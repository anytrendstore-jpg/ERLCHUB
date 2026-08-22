import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';
import { getBalance, adjustBalance } from '@/lib/hubPayServer';
import { notifyUser } from '@/lib/notificationsServer';
import { mdtCallsCollection } from '@/lib/mdtServer';
import { getRiskConfig } from '@/lib/riskConfigServer';

/**
 * Economía de criptomonedas puramente ficticia dentro del juego: precios, direcciones,
 * "anonimato" y seguridad son solo variables internas en Mongo. No hay conexión a ninguna
 * blockchain real ni mecanismos reales de anonimización, rastreo o evasión.
 */

export interface CryptoPricePoint { t: number; p: number }

export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  price: number;
  price24hAgo: number;
  price24hAgoSetAt: Date;
  volatility: number;
  minPrice: number;
  maxPrice: number;
  feePercent: number;
  maxSupply?: number;
  enabled: boolean;
  order: number;
  priceHistory: CryptoPricePoint[];
  lastTickAt: Date;
  createdAt: Date;
  updatedBy?: string;
}

export interface CryptoWallet {
  discordId: string;
  holdings: Record<string, number>;
  addresses: Record<string, string>;
  pinHash?: string;
  pinSalt?: string;
  pinEnabled: boolean;
  dailySend: { date: string; totalCOP: number };
  updatedAt: Date;
}

export type CryptoTxType = 'buy' | 'sell' | 'send' | 'receive' | 'swap' | 'payment';
export type CryptoTxStatus = 'completed' | 'rejected' | 'cancelled';

export interface CryptoTransaction {
  id: string;
  discordId: string;
  type: CryptoTxType;
  coinId: string;
  coinSymbol: string;
  amount: number;
  valueCOP: number;
  feeCOP: number;
  counterpartyId?: string;
  counterpartyName?: string;
  note?: string;
  status: CryptoTxStatus;
  txHash: string;
  createdAt: Date;
}

const TICK_INTERVAL_MS = 5 * 60 * 1000;
const MAX_TICKS_PER_READ = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function currentCryptoUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function cryptoCoinsCollection(): Promise<Collection<CryptoCoin>> {
  const db = await connectToDatabase();
  const col = db.collection<CryptoCoin>('crypto_coins');
  await col.createIndex({ order: 1 }).catch(() => {});
  await col.createIndex({ symbol: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function cryptoWalletsCollection(): Promise<Collection<CryptoWallet>> {
  const db = await connectToDatabase();
  const col = db.collection<CryptoWallet>('crypto_wallets');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function cryptoTransactionsCollection(): Promise<Collection<CryptoTransaction>> {
  const db = await connectToDatabase();
  const col = db.collection<CryptoTransaction>('crypto_transactions');
  await col.createIndex({ discordId: 1, createdAt: -1 }).catch(() => {});
  return col;
}

interface CryptoAddressIndexEntry { address: string; discordId: string; coinId: string }

/** Índice inverso dirección→dueño, para poder enviar cripto pegando/"escaneando" una dirección. */
async function cryptoAddressIndexCollection(): Promise<Collection<CryptoAddressIndexEntry>> {
  const db = await connectToDatabase();
  const col = db.collection<CryptoAddressIndexEntry>('crypto_address_index');
  await col.createIndex({ address: 1 }, { unique: true }).catch(() => {});
  return col;
}

const SEED_COINS: Array<Pick<CryptoCoin, 'symbol' | 'name' | 'icon' | 'price' | 'volatility' | 'minPrice' | 'maxPrice' | 'feePercent'>> = [
  { symbol: 'HBC', name: 'HUB Coin', icon: '🟣', price: 125430, volatility: 0.025, minPrice: 20000, maxPrice: 500000, feePercent: 1 },
  { symbol: 'LTC', name: 'Liberty Coin', icon: '🗽', price: 68200, volatility: 0.035, minPrice: 10000, maxPrice: 300000, feePercent: 1.5 },
  { symbol: 'LSC', name: 'Los Santos Coin', icon: '🌴', price: 41750, volatility: 0.04, minPrice: 5000, maxPrice: 250000, feePercent: 1.5 },
  { symbol: 'DKC', name: 'Dark Coin', icon: '⚫', price: 210900, volatility: 0.06, minPrice: 30000, maxPrice: 800000, feePercent: 2.5 },
];

export async function ensureCryptoCoinsSeeded(): Promise<Collection<CryptoCoin>> {
  const col = await cryptoCoinsCollection();
  const count = await col.countDocuments();
  if (count > 0) return col;
  const now = new Date();
  // Upsert por symbol (índice único) en vez de insertMany: dos requests concurrentes viendo
  // count===0 a la vez no deben poder crear monedas duplicadas.
  await Promise.all(SEED_COINS.map((c, i) => col.updateOne(
    { symbol: c.symbol },
    { $setOnInsert: {
      id: crypto.randomUUID(), ...c, price24hAgo: c.price, price24hAgoSetAt: now,
      enabled: true, order: i, priceHistory: [{ t: now.getTime(), p: c.price }], lastTickAt: now, createdAt: now, updatedBy: 'Sistema',
    } },
    { upsert: true }
  )));
  return col;
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

async function tickCoin(coin: CryptoCoin): Promise<CryptoCoin> {
  const now = Date.now();
  const elapsed = now - new Date(coin.lastTickAt).getTime();
  if (elapsed < TICK_INTERVAL_MS) return coin;

  const ticks = Math.min(MAX_TICKS_PER_READ, Math.floor(elapsed / TICK_INTERVAL_MS));
  let price = coin.price;
  const newPoints: CryptoPricePoint[] = [];
  for (let i = 0; i < ticks; i++) {
    const change = (Math.random() * 2 - 1) * coin.volatility;
    price = clamp(Math.round(price * (1 + change)), coin.minPrice, coin.maxPrice);
    newPoints.push({ t: now - (ticks - i) * TICK_INTERVAL_MS, p: price });
  }

  let price24hAgo = coin.price24hAgo;
  let price24hAgoSetAt = coin.price24hAgoSetAt;
  if (now - new Date(price24hAgoSetAt).getTime() >= DAY_MS) {
    price24hAgo = coin.price;
    price24hAgoSetAt = new Date(now);
  }

  const updated: CryptoCoin = {
    ...coin, price, price24hAgo, price24hAgoSetAt,
    priceHistory: [...coin.priceHistory, ...newPoints].slice(-200),
    lastTickAt: new Date(now),
  };

  const col = await cryptoCoinsCollection();
  await col.updateOne({ id: coin.id }, { $set: {
    price: updated.price, price24hAgo: updated.price24hAgo, price24hAgoSetAt: updated.price24hAgoSetAt,
    priceHistory: updated.priceHistory, lastTickAt: updated.lastTickAt,
  } });
  return updated;
}

export async function getLiveCoins(includeDisabled = false): Promise<CryptoCoin[]> {
  const col = await ensureCryptoCoinsSeeded();
  const coins = await col.find(includeDisabled ? {} : { enabled: true }).sort({ order: 1 }).toArray();
  return Promise.all(coins.map((c) => tickCoin(c)));
}

function generateAddress(symbol: string, discordId: string, coinId: string): string {
  const hash = crypto.createHash('sha256').update(`${discordId}:${coinId}:${process.env.NEXTAUTH_SECRET || 'erlchub'}`).digest('hex').toUpperCase();
  return `${symbol}-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

export async function getOrCreateWallet(discordId: string): Promise<CryptoWallet> {
  const col = await cryptoWalletsCollection();
  // Upsert atómico: dos requests concurrentes (p.ej. el GET de /api/crypto/wallet, que llama esta
  // función dos veces en paralelo vía Promise.all) no deben poder chocar en un E11000 duplicate key.
  const result = await col.findOneAndUpdate(
    { discordId },
    {
      $setOnInsert: {
        discordId, holdings: {}, addresses: {}, pinEnabled: false,
        dailySend: { date: new Date().toISOString().slice(0, 10), totalCOP: 0 }, updatedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  return result!;
}

function hashPin(pin: string, salt: string): string {
  return crypto.scryptSync(pin, salt, 32).toString('hex');
}

/** Define o cambia el PIN de 4-6 dígitos de la Crypto Wallet. Nunca se guarda en texto plano. */
export async function setWalletPin(discordId: string, pin: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^\d{4,6}$/.test(pin)) return { ok: false, error: 'El PIN debe tener entre 4 y 6 dígitos' };
  await getOrCreateWallet(discordId);
  const salt = crypto.randomBytes(16).toString('hex');
  const pinHash = hashPin(pin, salt);
  const col = await cryptoWalletsCollection();
  await col.updateOne({ discordId }, { $set: { pinHash, pinSalt: salt, pinEnabled: true, updatedAt: new Date() } });
  return { ok: true };
}

export async function disableWalletPin(discordId: string): Promise<void> {
  const col = await cryptoWalletsCollection();
  await col.updateOne({ discordId }, { $set: { pinEnabled: false, updatedAt: new Date() }, $unset: { pinHash: '', pinSalt: '' } });
}

/** Verifica el PIN cuando la wallet lo tiene activado; si no está activado, siempre pasa. */
export async function verifyWalletPin(discordId: string, pin?: string): Promise<{ ok: boolean; error?: string }> {
  const wallet = await getOrCreateWallet(discordId);
  if (!wallet.pinEnabled) return { ok: true };
  if (!pin || !wallet.pinHash || !wallet.pinSalt) return { ok: false, error: 'Se requiere tu PIN de seguridad' };
  const attempt = hashPin(pin, wallet.pinSalt);
  if (attempt !== wallet.pinHash) return { ok: false, error: 'PIN incorrecto' };
  return { ok: true };
}

export async function ensureAddress(discordId: string, coin: CryptoCoin): Promise<string> {
  const wallet = await getOrCreateWallet(discordId);
  if (wallet.addresses[coin.id]) return wallet.addresses[coin.id];
  const address = generateAddress(coin.symbol, discordId, coin.id);
  const col = await cryptoWalletsCollection();
  await col.updateOne({ discordId }, { $set: { [`addresses.${coin.id}`]: address } });
  const indexCol = await cryptoAddressIndexCollection();
  await indexCol.updateOne({ address }, { $set: { address, discordId, coinId: coin.id } }, { upsert: true });
  return address;
}

/** Resuelve quién es el dueño de una dirección cripto (para enviar pegando/"escaneando" la dirección). */
export async function resolveAddressOwner(address: string): Promise<{ discordId: string; coinId: string; displayName: string } | null> {
  const indexCol = await cryptoAddressIndexCollection();
  const entry = await indexCol.findOne({ address: address.trim().toUpperCase() });
  if (!entry) return null;
  const identity = await resolvePlayerIdentity(entry.discordId, { username: entry.discordId });
  return { discordId: entry.discordId, coinId: entry.coinId, displayName: identity.displayName };
}

function newTxHash(): string {
  return `TX-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

async function recordTx(entry: Omit<CryptoTransaction, 'id' | 'txHash' | 'createdAt' | 'status'> & { status?: CryptoTxStatus }) {
  const col = await cryptoTransactionsCollection();
  const doc: CryptoTransaction = {
    id: crypto.randomUUID(), txHash: newTxHash(), createdAt: new Date(), status: entry.status || 'completed', ...entry,
  };
  await col.insertOne(doc);
  return doc;
}

export async function buyCrypto(discordId: string, coinId: string, amount: number): Promise<{ ok: boolean; error?: string; tx?: CryptoTransaction }> {
  if (amount <= 0) return { ok: false, error: 'Cantidad inválida' };
  const coins = await getLiveCoins();
  const coin = coins.find((c) => c.id === coinId);
  if (!coin) return { ok: false, error: 'Moneda no encontrada' };

  const value = amount * coin.price;
  const fee = Math.round(value * (coin.feePercent / 100));
  const total = value + fee;
  const balance = await getBalance(discordId);
  if (balance < total) return { ok: false, error: 'Saldo insuficiente en HubPay' };

  await adjustBalance({ discordId, delta: -total, type: 'expense', description: `Compra de ${amount} ${coin.symbol}` });
  const walletCol = await cryptoWalletsCollection();
  await getOrCreateWallet(discordId);
  await walletCol.updateOne({ discordId }, { $inc: { [`holdings.${coinId}`]: amount }, $set: { updatedAt: new Date() } });

  const tx = await recordTx({ discordId, type: 'buy', coinId, coinSymbol: coin.symbol, amount, valueCOP: value, feeCOP: fee });
  return { ok: true, tx };
}

export async function sellCrypto(discordId: string, coinId: string, amount: number): Promise<{ ok: boolean; error?: string; tx?: CryptoTransaction }> {
  if (amount <= 0) return { ok: false, error: 'Cantidad inválida' };
  const coins = await getLiveCoins();
  const coin = coins.find((c) => c.id === coinId);
  if (!coin) return { ok: false, error: 'Moneda no encontrada' };

  const wallet = await getOrCreateWallet(discordId);
  const held = wallet.holdings[coinId] || 0;
  if (held < amount) return { ok: false, error: `No tienes suficientes ${coin.symbol}` };

  const value = amount * coin.price;
  const fee = Math.round(value * (coin.feePercent / 100));
  const net = value - fee;

  const walletCol = await cryptoWalletsCollection();
  await walletCol.updateOne({ discordId }, { $inc: { [`holdings.${coinId}`]: -amount }, $set: { updatedAt: new Date() } });
  await adjustBalance({ discordId, delta: net, type: 'income', description: `Venta de ${amount} ${coin.symbol}` });

  const tx = await recordTx({ discordId, type: 'sell', coinId, coinSymbol: coin.symbol, amount, valueCOP: value, feeCOP: fee });
  return { ok: true, tx };
}

export async function sendCrypto(discordId: string, coinId: string, amount: number, recipientId: string, note?: string, pin?: string): Promise<{ ok: boolean; error?: string; tx?: CryptoTransaction; unusual?: boolean }> {
  if (amount <= 0) return { ok: false, error: 'Cantidad inválida' };
  if (recipientId === discordId) return { ok: false, error: 'No puedes enviarte cripto a ti mismo' };

  const pinCheck = await verifyWalletPin(discordId, pin);
  if (!pinCheck.ok) return { ok: false, error: pinCheck.error };

  const config = await getRiskConfig();
  const coins = await getLiveCoins();
  const coin = coins.find((c) => c.id === coinId);
  if (!coin) return { ok: false, error: 'Moneda no encontrada' };

  const wallet = await getOrCreateWallet(discordId);
  const held = wallet.holdings[coinId] || 0;
  if (held < amount) return { ok: false, error: `No tienes suficientes ${coin.symbol}` };

  const value = amount * coin.price;
  const today = new Date().toISOString().slice(0, 10);
  const todaySoFar = wallet.dailySend.date === today ? wallet.dailySend.totalCOP : 0;
  if (todaySoFar + value > config.dailySendLimitCOP) {
    return { ok: false, error: `Límite diario de envíos superado ($${config.dailySendLimitCOP.toLocaleString('es-CO')})` };
  }

  const recipientIdentity = await resolvePlayerIdentity(recipientId, { username: recipientId });
  const senderIdentity = await resolvePlayerIdentity(discordId, { username: discordId });

  const walletCol = await cryptoWalletsCollection();
  await walletCol.updateOne({ discordId }, {
    $inc: { [`holdings.${coinId}`]: -amount },
    $set: { updatedAt: new Date(), dailySend: { date: today, totalCOP: todaySoFar + value } },
  });
  await getOrCreateWallet(recipientId);
  await walletCol.updateOne({ discordId: recipientId }, { $inc: { [`holdings.${coinId}`]: amount }, $set: { updatedAt: new Date() } });

  const tx = await recordTx({
    discordId, type: 'send', coinId, coinSymbol: coin.symbol, amount, valueCOP: value, feeCOP: 0,
    counterpartyId: recipientId, counterpartyName: recipientIdentity.displayName, note,
  });
  await recordTx({
    discordId: recipientId, type: 'receive', coinId, coinSymbol: coin.symbol, amount, valueCOP: value, feeCOP: 0,
    counterpartyId: discordId, counterpartyName: senderIdentity.displayName, note,
  });
  await notifyUser(recipientId, {
    title: 'Cripto recibida', message: `Recibiste ${amount} ${coin.symbol} de ${senderIdentity.displayName}.`, type: 'success', appId: 'crypto',
  });

  const unusual = amount / held >= config.unusualSendFraction;
  return { ok: true, tx, unusual };
}

export async function swapCrypto(discordId: string, fromCoinId: string, toCoinId: string, amount: number): Promise<{ ok: boolean; error?: string; tx?: CryptoTransaction; received?: number }> {
  if (amount <= 0) return { ok: false, error: 'Cantidad inválida' };
  if (fromCoinId === toCoinId) return { ok: false, error: 'Selecciona dos monedas distintas' };
  const coins = await getLiveCoins();
  const from = coins.find((c) => c.id === fromCoinId);
  const to = coins.find((c) => c.id === toCoinId);
  if (!from || !to) return { ok: false, error: 'Moneda no encontrada' };

  const wallet = await getOrCreateWallet(discordId);
  const held = wallet.holdings[fromCoinId] || 0;
  if (held < amount) return { ok: false, error: `No tienes suficientes ${from.symbol}` };

  const value = amount * from.price;
  const fee = Math.round(value * ((from.feePercent + to.feePercent) / 2 / 100));
  const net = value - fee;
  const received = net / to.price;

  const walletCol = await cryptoWalletsCollection();
  await walletCol.updateOne({ discordId }, {
    $inc: { [`holdings.${fromCoinId}`]: -amount, [`holdings.${toCoinId}`]: received },
    $set: { updatedAt: new Date() },
  });

  const tx = await recordTx({
    discordId, type: 'swap', coinId: fromCoinId, coinSymbol: from.symbol, amount, valueCOP: value, feeCOP: fee,
    note: `${amount} ${from.symbol} → ${received.toFixed(6)} ${to.symbol}`,
  });
  return { ok: true, tx, received };
}

/**
 * Usado por el sistema de riesgo de la Deep Web ("sesión comprometida"): confisca una fracción
 * de las tenencias cripto del jugador, nunca más de lo que realmente tiene. Server-authoritative,
 * no acepta montos del cliente.
 */
export async function seizeCryptoFraction(discordId: string, fraction: number, description: string): Promise<{ coinSymbol: string; amount: number; valueCOP: number } | null> {
  const wallet = await getOrCreateWallet(discordId);
  const coins = await getLiveCoins();
  let best: { coinId: string; coin: CryptoCoin; amount: number; valueCOP: number } | null = null;
  for (const coin of coins) {
    const held = wallet.holdings[coin.id] || 0;
    const valueCOP = held * coin.price;
    if (held > 0 && (!best || valueCOP > best.valueCOP)) best = { coinId: coin.id, coin, amount: held, valueCOP };
  }
  if (!best) return null;

  const seizeAmount = best.amount * fraction;
  const walletCol = await cryptoWalletsCollection();
  await walletCol.updateOne({ discordId }, { $inc: { [`holdings.${best.coinId}`]: -seizeAmount }, $set: { updatedAt: new Date() } });
  const valueCOP = seizeAmount * best.coin.price;
  await recordTx({ discordId, type: 'payment', coinId: best.coinId, coinSymbol: best.coin.symbol, amount: seizeAmount, valueCOP, feeCOP: 0, note: description });

  return { coinSymbol: best.coin.symbol, amount: seizeAmount, valueCOP };
}

/** Usado por VPS y Deep Web: cobra el equivalente en cripto de un precio en COP, siempre server-side. */
export async function chargeCrypto(discordId: string, coinId: string, priceCOP: number, description: string): Promise<{ ok: boolean; error?: string; amount?: number; coinSymbol?: string }> {
  const coins = await getLiveCoins();
  const coin = coins.find((c) => c.id === coinId);
  if (!coin) return { ok: false, error: 'Moneda no encontrada' };

  const amount = priceCOP / coin.price;
  const wallet = await getOrCreateWallet(discordId);
  const held = wallet.holdings[coinId] || 0;
  if (held < amount) {
    const missing = amount - held;
    return { ok: false, error: `Saldo insuficiente en Crypto Wallet. Te faltan ${missing.toFixed(4)} ${coin.symbol} — cómpralos desde la app Crypto Wallet.` };
  }

  const walletCol = await cryptoWalletsCollection();
  await walletCol.updateOne({ discordId }, { $inc: { [`holdings.${coinId}`]: -amount }, $set: { updatedAt: new Date() } });
  await recordTx({ discordId, type: 'payment', coinId, coinSymbol: coin.symbol, amount, valueCOP: priceCOP, feeCOP: 0, note: description });

  return { ok: true, amount, coinSymbol: coin.symbol };
}

/** Moneda usada por defecto para pagos de Deep Web y VPS (HUB Coin, la moneda principal del servidor). */
export async function getDefaultCryptoCoin(): Promise<CryptoCoin | null> {
  const coins = await getLiveCoins();
  return coins.find((c) => c.symbol === 'HBC') || coins[0] || null;
}

/** El propio jugador reporta una operación que no reconoce ("¿Reconoces esta operación? · Reportar"). */
export async function reportSuspiciousTransaction(discordId: string, txId: string): Promise<{ ok: boolean; error?: string }> {
  const txCol = await cryptoTransactionsCollection();
  const tx = await txCol.findOne({ id: txId, discordId });
  if (!tx) return { ok: false, error: 'Transacción no encontrada' };

  const identity = await resolvePlayerIdentity(discordId, { username: discordId });
  const callsCol = await mdtCallsCollection();
  const count = await callsCol.countDocuments();
  const now = new Date();
  await callsCol.insertOne({
    id: crypto.randomUUID(),
    callNumber: String(5480 + count + 1),
    type: 'Cyber Crime', priority: 'Medium', status: 'Pending',
    location: 'Crypto Wallet — reporte del propio usuario',
    description: `${identity.displayName} reportó no reconocer una operación de ${tx.amount.toFixed(4)} ${tx.coinSymbol} (${tx.txHash}) en su Crypto Wallet. Posible robo de credenciales o acceso no autorizado.`,
    assignedUnits: [], createdAt: now, updatedAt: now, notes: [],
    title: `Reporte de fraude cripto — ${identity.displayName}`,
    suspects: [],
  } as any);

  await notifyUser(discordId, { title: 'Reporte enviado', message: 'Se notificó a la Unidad de Delitos Informáticos sobre esta operación.', type: 'warning', appId: 'crypto' });
  return { ok: true };
}

export async function getWalletSummary(discordId: string) {
  const [wallet, coins] = await Promise.all([getOrCreateWallet(discordId), getLiveCoins()]);
  const holdings = coins
    .filter((c) => (wallet.holdings[c.id] || 0) > 0.000001)
    .map((c) => ({
      coinId: c.id, symbol: c.symbol, name: c.name, icon: c.icon, amount: wallet.holdings[c.id] || 0,
      price: c.price, valueCOP: (wallet.holdings[c.id] || 0) * c.price,
      changePercent: c.price24hAgo > 0 ? ((c.price - c.price24hAgo) / c.price24hAgo) * 100 : 0,
    }));
  const totalCOP = holdings.reduce((sum, h) => sum + h.valueCOP, 0);
  return { totalCOP, holdings };
}

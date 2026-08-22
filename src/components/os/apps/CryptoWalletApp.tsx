'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Repeat, Send, QrCode,
  Copy, Check, X, ShoppingCart, Search, ShieldCheck, Lock, LockOpen,
} from 'lucide-react';
import { useToast } from '@/components/os/ui';

interface CryptoCoin {
  id: string; symbol: string; name: string; icon: string; price: number; price24hAgo: number;
  feePercent: number; enabled: boolean; priceHistory: { t: number; p: number }[];
}

interface Holding { coinId: string; symbol: string; name: string; icon: string; amount: number; price: number; valueCOP: number; changePercent: number }

interface CryptoTx {
  id: string; type: 'buy' | 'sell' | 'send' | 'receive' | 'swap' | 'payment'; coinSymbol: string;
  amount: number; valueCOP: number; feeCOP: number; counterpartyName?: string; note?: string;
  status: 'completed' | 'rejected' | 'cancelled'; txHash: string; createdAt: string;
}

interface SearchUser { id: string; name: string; avatar?: string }

const TX_LABEL: Record<CryptoTx['type'], string> = {
  buy: 'Compra', sell: 'Venta', send: 'Envío', receive: 'Recibido', swap: 'Intercambio', payment: 'Pago',
};
const TX_ICON: Record<CryptoTx['type'], React.ElementType> = {
  buy: ShoppingCart, sell: TrendingDown, send: ArrowUpRight, receive: ArrowDownLeft, swap: Repeat, payment: ShoppingCart,
};
const TX_COLOR: Record<CryptoTx['type'], string> = {
  buy: 'text-emerald-400 bg-emerald-500/10', sell: 'text-orange-400 bg-orange-500/10',
  send: 'text-red-400 bg-red-500/10', receive: 'text-emerald-400 bg-emerald-500/10',
  swap: 'text-purple-400 bg-purple-500/10', payment: 'text-red-400 bg-red-500/10',
};

function fmtCOP(n: number) { return `$${Math.round(n).toLocaleString('es-CO')}`; }
function fmtCoin(n: number) { return n.toLocaleString('es-CO', { maximumFractionDigits: 6 }); }

function Sparkline({ points, positive }: { points: { t: number; p: number }[]; positive: boolean }) {
  if (points.length < 2) return <div className="w-20 h-8" />;
  const prices = points.map((p) => p.p);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const w = 80, h = 32;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p.p - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      <path d={path} fill="none" stroke={positive ? '#34d399' : '#f87171'} strokeWidth="1.5" />
    </svg>
  );
}

export default function CryptoWalletApp() {
  const toast = useToast();
  const [tab, setTab] = useState<'market' | 'wallet' | 'history' | 'security'>('market');
  const [coins, setCoins] = useState<CryptoCoin[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalCOP, setTotalCOP] = useState(0);
  const [history, setHistory] = useState<CryptoTx[]>([]);
  const [pinEnabled, setPinEnabled] = useState(false);

  const [pinForm, setPinForm] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const [sendPin, setSendPin] = useState('');

  const [tradeCoin, setTradeCoin] = useState<CryptoCoin | null>(null);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState('');
  const [trading, setTrading] = useState(false);

  const [sendOpen, setSendOpen] = useState(false);
  const [sendCoinId, setSendCoinId] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [recipient, setRecipient] = useState<SearchUser | null>(null);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientResults, setRecipientResults] = useState<SearchUser[]>([]);
  const [sending, setSending] = useState(false);
  const [recipientMode, setRecipientMode] = useState<'search' | 'address'>('search');
  const [addressInput, setAddressInput] = useState('');
  const [addressLookupError, setAddressLookupError] = useState<string | null>(null);
  const [addressLookingUp, setAddressLookingUp] = useState(false);
  const [unusualTx, setUnusualTx] = useState<{ id: string; amount: string; coinSymbol: string } | null>(null);
  const [reporting, setReporting] = useState(false);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveCoinId, setReceiveCoinId] = useState('');
  const [receiveAddress, setReceiveAddress] = useState('');
  const [copied, setCopied] = useState(false);

  const [swapOpen, setSwapOpen] = useState(false);
  const [swapFromId, setSwapFromId] = useState('');
  const [swapToId, setSwapToId] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapping, setSwapping] = useState(false);

  const loadCoins = useCallback(async () => {
    const res = await fetch('/api/crypto/coins', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setCoins(data.coins);
  }, []);

  const loadWallet = useCallback(async () => {
    const res = await fetch('/api/crypto/wallet', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) { setHoldings(data.holdings); setTotalCOP(data.totalCOP); setPinEnabled(Boolean(data.pinEnabled)); }
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/crypto/history', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setHistory(data.transactions);
  }, []);

  useEffect(() => { loadCoins(); loadWallet(); loadHistory(); }, [loadCoins, loadWallet, loadHistory]);
  useEffect(() => {
    const interval = setInterval(loadCoins, 30000);
    return () => clearInterval(interval);
  }, [loadCoins]);

  useEffect(() => {
    if (!recipientQuery.trim()) { setRecipientResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/social/search?q=${encodeURIComponent(recipientQuery.trim())}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (d.success) setRecipientResults(d.users.map((u: any) => ({ id: u.discordId, name: u.displayName, avatar: u.avatar }))); });
    }, 250);
    return () => clearTimeout(t);
  }, [recipientQuery]);

  const openTrade = (coin: CryptoCoin, mode: 'buy' | 'sell') => { setTradeCoin(coin); setTradeMode(mode); setTradeAmount(''); };

  const confirmTrade = async () => {
    if (!tradeCoin || !tradeAmount) return;
    setTrading(true);
    try {
      const res = await fetch(`/api/crypto/${tradeMode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coinId: tradeCoin.id, amount: Number(tradeAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(tradeMode === 'buy' ? `Compraste ${tradeAmount} ${tradeCoin.symbol}` : `Vendiste ${tradeAmount} ${tradeCoin.symbol}`);
        setTradeCoin(null);
        await Promise.all([loadWallet(), loadHistory()]);
      } else {
        toast.error(data.error || 'No se pudo completar la operación');
      }
    } finally {
      setTrading(false);
    }
  };

  const openReceive = async (coinId: string) => {
    setReceiveCoinId(coinId);
    setReceiveOpen(true);
    setReceiveAddress('');
    const res = await fetch(`/api/crypto/address?coinId=${coinId}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setReceiveAddress(data.address);
  };

  const copyAddress = () => {
    navigator.clipboard?.writeText(receiveAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lookupAddress = async () => {
    if (!addressInput.trim()) return;
    setAddressLookingUp(true);
    setAddressLookupError(null);
    try {
      const res = await fetch(`/api/crypto/resolve-address?address=${encodeURIComponent(addressInput.trim())}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setRecipient({ id: data.discordId, name: data.displayName });
        setAddressInput('');
        if (data.coinId) setSendCoinId(data.coinId);
      } else {
        setAddressLookupError(data.error || 'No se encontró esa dirección');
      }
    } finally {
      setAddressLookingUp(false);
    }
  };

  const confirmSend = async () => {
    if (!sendCoinId || !sendAmount || !recipient) return;
    if (pinEnabled && !/^\d{4,6}$/.test(sendPin)) { toast.error('Ingresa tu PIN de seguridad'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/crypto/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coinId: sendCoinId, amount: Number(sendAmount), recipientId: recipient.id, note: sendNote || undefined, pin: pinEnabled ? sendPin : undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Enviaste ${sendAmount} cripto a ${recipient.name}`);
        if (data.unusual && data.tx) {
          setUnusualTx({ id: data.tx.id, amount: sendAmount, coinSymbol: data.tx.coinSymbol });
        }
        setSendOpen(false); setSendAmount(''); setSendNote(''); setRecipient(null); setRecipientQuery(''); setSendPin('');
        setRecipientMode('search'); setAddressInput(''); setAddressLookupError(null);
        await Promise.all([loadWallet(), loadHistory()]);
      } else {
        toast.error(data.error || 'No se pudo completar el envío');
      }
    } finally {
      setSending(false);
    }
  };

  const reportTx = async () => {
    if (!unusualTx) return;
    setReporting(true);
    try {
      await fetch('/api/crypto/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txId: unusualTx.id }) });
      toast.success('Reporte enviado a la Unidad de Delitos Informáticos');
      setUnusualTx(null);
    } finally {
      setReporting(false);
    }
  };

  const savePin = async () => {
    if (!/^\d{4,6}$/.test(pinForm)) { toast.error('El PIN debe tener entre 4 y 6 dígitos'); return; }
    if (pinForm !== pinConfirm) { toast.error('Los PIN no coinciden'); return; }
    setPinSaving(true);
    try {
      const res = await fetch('/api/crypto/pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: pinForm }) });
      const data = await res.json();
      if (data.success) { toast.success('PIN configurado'); setPinForm(''); setPinConfirm(''); await loadWallet(); }
      else toast.error(data.error || 'No se pudo configurar el PIN');
    } finally {
      setPinSaving(false);
    }
  };

  const removePin = async () => {
    setPinSaving(true);
    try {
      await fetch('/api/crypto/pin', { method: 'DELETE' });
      toast.success('PIN desactivado');
      await loadWallet();
    } finally {
      setPinSaving(false);
    }
  };

  const confirmSwap = async () => {
    if (!swapFromId || !swapToId || !swapAmount) return;
    setSwapping(true);
    try {
      const res = await fetch('/api/crypto/swap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromCoinId: swapFromId, toCoinId: swapToId, amount: Number(swapAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Intercambio completado`);
        setSwapOpen(false); setSwapAmount('');
        await Promise.all([loadWallet(), loadHistory()]);
      } else {
        toast.error(data.error || 'No se pudo completar el intercambio');
      }
    } finally {
      setSwapping(false);
    }
  };

  const tradeValue = tradeCoin && tradeAmount ? Number(tradeAmount) * tradeCoin.price : 0;
  const tradeFee = tradeCoin ? Math.round(tradeValue * (tradeCoin.feePercent / 100)) : 0;

  return (
    <div className="h-full flex flex-col bg-[#0a0a12] text-white">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-purple-950/40 to-[#0a0a12]">
        <Wallet className="w-6 h-6 text-purple-400" />
        <span className="font-bold text-xl">Crypto Wallet</span>
        <div className="ml-auto text-right">
          <p className="text-white/40 text-[11px]">Saldo total</p>
          <p className="font-bold text-lg text-purple-300">{fmtCOP(totalCOP)}</p>
        </div>
      </div>

      {unusualTx && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[3100] bg-[#12121e] border border-amber-500/40 text-white px-4 py-3 rounded-xl text-sm shadow-xl max-w-xs">
          <p className="font-semibold mb-1">🚨 Nueva actividad detectada</p>
          <p className="text-white/60 text-xs mb-3">Se realizó una operación de {unusualTx.amount} {unusualTx.coinSymbol}. ¿Reconoces esta operación?</p>
          <div className="flex gap-2">
            <button onClick={() => setUnusualTx(null)} className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold transition-colors">Sí, fui yo</button>
            <button onClick={reportTx} disabled={reporting} className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-semibold transition-colors">{reporting ? '...' : 'Reportar'}</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 px-5 pt-3 border-b border-white/10">
        {(['market', 'wallet', 'history', 'security'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            {t === 'market' ? 'Mercado' : t === 'wallet' ? 'Billetera' : t === 'history' ? 'Historial' : 'Seguridad'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {tab === 'market' && (
          <div className="space-y-2">
            {coins.map((coin) => {
              const change = coin.price24hAgo > 0 ? ((coin.price - coin.price24hAgo) / coin.price24hAgo) * 100 : 0;
              const positive = change >= 0;
              return (
                <div key={coin.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl flex-shrink-0">{coin.icon}</div>
                  <div className="min-w-0 w-28 flex-shrink-0">
                    <p className="font-semibold text-sm truncate">{coin.symbol}</p>
                    <p className="text-white/40 text-xs truncate">{coin.name}</p>
                  </div>
                  <Sparkline points={coin.priceHistory} positive={positive} />
                  <div className="flex-1 text-right">
                    <p className="font-semibold text-sm">{fmtCOP(coin.price)}</p>
                    <p className={`text-xs flex items-center justify-end gap-1 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {positive ? '+' : ''}{change.toFixed(2)}%
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => openTrade(coin, 'buy')} className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold transition-colors">Comprar</button>
                    <button onClick={() => openTrade(coin, 'sell')} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold transition-colors">Vender</button>
                  </div>
                </div>
              );
            })}
            {coins.length === 0 && <p className="text-white/30 text-sm text-center py-10">No hay criptomonedas disponibles.</p>}
          </div>
        )}

        {tab === 'wallet' && (
          <div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => { setSendOpen(true); setSendCoinId(holdings[0]?.coinId || coins[0]?.id || ''); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <Send className="w-5 h-5 text-purple-400" /><span className="text-xs">Enviar</span>
              </button>
              <button onClick={() => openReceive(holdings[0]?.coinId || coins[0]?.id || '')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <QrCode className="w-5 h-5 text-purple-400" /><span className="text-xs">Recibir</span>
              </button>
              <button onClick={() => { setSwapOpen(true); setSwapFromId(holdings[0]?.coinId || coins[0]?.id || ''); setSwapToId(coins[1]?.id || coins[0]?.id || ''); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <Repeat className="w-5 h-5 text-purple-400" /><span className="text-xs">Intercambiar</span>
              </button>
            </div>
            <div className="space-y-2">
              {holdings.map((h) => (
                <div key={h.coinId} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl flex-shrink-0">{h.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{fmtCoin(h.amount)} {h.symbol}</p>
                    <p className="text-white/40 text-xs">{h.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{fmtCOP(h.valueCOP)}</p>
                    <p className={`text-xs ${h.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{h.changePercent >= 0 ? '+' : ''}{h.changePercent.toFixed(2)}%</p>
                  </div>
                </div>
              ))}
              {holdings.length === 0 && <p className="text-white/30 text-sm text-center py-10">Todavía no tienes criptomonedas. Cómpralas en el Mercado.</p>}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {history.map((tx) => {
              const Icon = TX_ICON[tx.type];
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${TX_COLOR[tx.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{TX_LABEL[tx.type]} {fmtCoin(tx.amount)} {tx.coinSymbol}</p>
                    <p className="text-white/40 text-xs">{tx.counterpartyName ? `${tx.counterpartyName} · ` : ''}{new Date(tx.createdAt).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold">{fmtCOP(tx.valueCOP)}</p>
                    <p className="text-[10px] text-white/30 font-mono">{tx.txHash}</p>
                  </div>
                </div>
              );
            })}
            {history.length === 0 && <p className="text-white/30 text-sm text-center py-10">Sin movimientos todavía.</p>}
          </div>
        )}

        {tab === 'security' && (
          <div className="max-w-sm">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
              {pinEnabled ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-white/40" />}
              <div>
                <p className="text-sm font-medium">PIN de seguridad</p>
                <p className="text-white/40 text-xs">{pinEnabled ? 'Activado — requerido para enviar cripto a otros jugadores' : 'Desactivado'}</p>
              </div>
            </div>

            {pinEnabled ? (
              <button onClick={removePin} disabled={pinSaving} className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-red-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <LockOpen className="w-4 h-4" /> {pinSaving ? 'Procesando...' : 'Desactivar PIN'}
              </button>
            ) : (
              <>
                <p className="text-white/40 text-xs mb-1">Nuevo PIN (4-6 dígitos)</p>
                <input type="password" inputMode="numeric" value={pinForm} onChange={(e) => setPinForm(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white mb-3 focus:outline-none focus:border-purple-500 tracking-widest" />
                <p className="text-white/40 text-xs mb-1">Confirmar PIN</p>
                <input type="password" inputMode="numeric" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white mb-4 focus:outline-none focus:border-purple-500 tracking-widest" />
                <button onClick={savePin} disabled={pinSaving || !pinForm} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors">
                  {pinSaving ? 'Guardando...' : 'Activar PIN'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Buy/Sell Modal */}
      {tradeCoin && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4">
          <div className="bg-[#12121e] rounded-xl w-full max-w-sm border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{tradeMode === 'buy' ? 'Comprar' : 'Vender'} {tradeCoin.symbol}</h3>
              <button onClick={() => setTradeCoin(null)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <p className="text-white/40 text-xs mb-1">Cantidad de {tradeCoin.symbol}</p>
            <input
              type="number" value={tradeAmount} onChange={(e) => setTradeAmount(e.target.value)}
              placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white mb-3 focus:outline-none focus:border-purple-500"
            />
            <div className="space-y-1.5 text-xs mb-4 p-3 rounded-lg bg-white/5">
              <div className="flex justify-between text-white/50"><span>Precio</span><span>{fmtCOP(tradeCoin.price)}</span></div>
              <div className="flex justify-between text-white/50"><span>Valor</span><span>{fmtCOP(tradeValue)}</span></div>
              <div className="flex justify-between text-white/50"><span>Comisión ({tradeCoin.feePercent}%)</span><span>{fmtCOP(tradeFee)}</span></div>
              <div className="flex justify-between font-semibold text-white pt-1.5 border-t border-white/10"><span>Total</span><span>{fmtCOP(tradeMode === 'buy' ? tradeValue + tradeFee : tradeValue - tradeFee)}</span></div>
            </div>
            <button
              onClick={confirmTrade}
              disabled={trading || !tradeAmount || Number(tradeAmount) <= 0}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold transition-colors"
            >
              {trading ? 'Procesando...' : tradeMode === 'buy' ? 'Confirmar compra' : 'Confirmar venta'}
            </button>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {sendOpen && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4">
          <div className="bg-[#12121e] rounded-xl w-full max-w-sm border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Enviar criptomoneda</h3>
              <button onClick={() => setSendOpen(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <p className="text-white/40 text-xs mb-1">Moneda</p>
            <select value={sendCoinId} onChange={(e) => setSendCoinId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white mb-3 focus:outline-none">
              {holdings.map((h) => <option key={h.coinId} value={h.coinId}>{h.symbol} — {fmtCoin(h.amount)} disponibles</option>)}
            </select>
            <p className="text-white/40 text-xs mb-1">Cantidad</p>
            <input type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white mb-3 focus:outline-none focus:border-purple-500" />
            <p className="text-white/40 text-xs mb-1">Destinatario</p>
            {recipient ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 mb-3">
                <span className="text-sm flex-1 truncate">{recipient.name}</span>
                <button onClick={() => setRecipient(null)}><X className="w-4 h-4 text-white/40" /></button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setRecipientMode('search')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${recipientMode === 'search' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}
                  >
                    <Search className="w-3.5 h-3.5" /> Buscar jugador
                  </button>
                  <button
                    onClick={() => setRecipientMode('address')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${recipientMode === 'address' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}
                  >
                    <QrCode className="w-3.5 h-3.5" /> Dirección
                  </button>
                </div>

                {recipientMode === 'search' ? (
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input value={recipientQuery} onChange={(e) => setRecipientQuery(e.target.value)} placeholder="Buscar jugador..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2.5 text-sm text-white focus:outline-none" />
                    {recipientResults.length > 0 && (
                      <div className="mt-1.5 max-h-32 overflow-y-auto space-y-1 bg-[#1a1a28] rounded-lg p-1">
                        {recipientResults.map((u) => (
                          <button key={u.id} onClick={() => { setRecipient(u); setRecipientQuery(''); setRecipientResults([]); }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 text-left text-sm">
                            {u.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-3">
                    <div className="flex gap-2">
                      <input
                        value={addressInput}
                        onChange={(e) => { setAddressInput(e.target.value.toUpperCase()); setAddressLookupError(null); }}
                        placeholder="HBC-XXXX-XXXX-XXXX"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                      <button onClick={lookupAddress} disabled={addressLookingUp || !addressInput.trim()} className="px-3 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 text-sm font-medium transition-colors">
                        {addressLookingUp ? '...' : 'Buscar'}
                      </button>
                    </div>
                    {addressLookupError && <p className="text-red-400 text-xs mt-1.5">{addressLookupError}</p>}
                  </div>
                )}
              </>
            )}
            <input value={sendNote} onChange={(e) => setSendNote(e.target.value)} placeholder="Nota (opcional)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white mb-3 focus:outline-none" />
            {pinEnabled && (
              <>
                <p className="text-white/40 text-xs mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> PIN de seguridad</p>
                <input type="password" inputMode="numeric" value={sendPin} onChange={(e) => setSendPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white mb-4 focus:outline-none focus:border-purple-500 tracking-widest" />
              </>
            )}
            <button
              onClick={confirmSend}
              disabled={sending || !sendAmount || !recipient}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold transition-colors"
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {receiveOpen && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4">
          <div className="bg-[#12121e] rounded-xl w-full max-w-sm border border-white/10 p-5 text-center">
            <div className="flex items-center justify-between mb-4 text-left">
              <h3 className="font-bold">Recibir criptomoneda</h3>
              <button onClick={() => setReceiveOpen(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <select value={receiveCoinId} onChange={(e) => openReceive(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white mb-4 focus:outline-none">
              {coins.map((c) => <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>)}
            </select>
            <div className="w-32 h-32 mx-auto mb-4 rounded-xl bg-white p-2 grid grid-cols-6 grid-rows-6 gap-0.5">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className={(receiveAddress.charCodeAt(i % receiveAddress.length || 0) + i) % 3 === 0 ? 'bg-black rounded-[1px]' : ''} />
              ))}
            </div>
            <p className="font-mono text-sm bg-white/5 rounded-lg py-2 px-3 mb-3 break-all">{receiveAddress || '...'}</p>
            <button onClick={copyAddress} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copiada' : 'Copiar dirección'}
            </button>
          </div>
        </div>
      )}

      {/* Swap Modal */}
      {swapOpen && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4">
          <div className="bg-[#12121e] rounded-xl w-full max-w-sm border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Intercambiar</h3>
              <button onClick={() => setSwapOpen(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <p className="text-white/40 text-xs mb-1">De</p>
            <select value={swapFromId} onChange={(e) => setSwapFromId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white mb-3 focus:outline-none">
              {holdings.map((h) => <option key={h.coinId} value={h.coinId}>{h.symbol} — {fmtCoin(h.amount)} disponibles</option>)}
            </select>
            <p className="text-white/40 text-xs mb-1">A</p>
            <select value={swapToId} onChange={(e) => setSwapToId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white mb-3 focus:outline-none">
              {coins.filter((c) => c.id !== swapFromId).map((c) => <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>)}
            </select>
            <p className="text-white/40 text-xs mb-1">Cantidad a intercambiar</p>
            <input type="number" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white mb-4 focus:outline-none focus:border-purple-500" />
            <button
              onClick={confirmSwap}
              disabled={swapping || !swapAmount}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold transition-colors"
            >
              {swapping ? 'Procesando...' : 'Confirmar intercambio'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { currentCasinoUser, casinoBetsCollection, newBetId } from '@/lib/casinoServer';
import { getBalance, adjustBalance, getHubPayFreeze } from '@/lib/hubPayServer';
import { notifyUser } from '@/lib/notificationsServer';
import { economyItems } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const DEFAULT_MIN_BET = 100;
const DEFAULT_MAX_BET = 25000;

/** Límites de apuesta: si Staff configuró alguna entrada activa de "Casino" en el registro económico con minBet/maxBet, se usan esos; si no, los valores por defecto. */
async function getBetLimits(): Promise<{ min: number; max: number }> {
  try {
    const col = await economyItems();
    const items = await col.find({ module: 'casino', active: true }).toArray();
    const mins = items.map((i) => Number(i.fields?.minBet)).filter((n) => Number.isFinite(n) && n > 0);
    const maxs = items.map((i) => Number(i.fields?.maxBet)).filter((n) => Number.isFinite(n) && n > 0);
    return {
      min: mins.length ? Math.min(...mins) : DEFAULT_MIN_BET,
      max: maxs.length ? Math.max(...maxs) : DEFAULT_MAX_BET,
    };
  } catch {
    return { min: DEFAULT_MIN_BET, max: DEFAULT_MAX_BET };
  }
}

function playRoulette(choice: string, bet: number): { result: string; multiplier: number } {
  const number = Math.floor(Math.random() * 37);
  const color = number === 0 ? 'green' : RED_NUMBERS.has(number) ? 'red' : 'black';
  const result = `${number} (${color})`;

  if (/^\d+$/.test(choice) && Number(choice) === number) return { result, multiplier: 36 };
  if ((choice === 'red' || choice === 'black') && choice === color) return { result, multiplier: 2 };
  if (choice === 'even' && number !== 0 && number % 2 === 0) return { result, multiplier: 2 };
  if (choice === 'odd' && number % 2 === 1) return { result, multiplier: 2 };
  return { result, multiplier: 0 };
}

function playDice(choice: string): { result: string; multiplier: number } {
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  const sum = d1 + d2;
  const result = `${d1} + ${d2} = ${sum}`;

  if (choice === 'seven' && sum === 7) return { result, multiplier: 5 };
  if (choice === 'low' && sum >= 2 && sum <= 6) return { result, multiplier: 2.4 };
  if (choice === 'high' && sum >= 8 && sum <= 12) return { result, multiplier: 2.4 };
  return { result, multiplier: 0 };
}

const SYMBOLS = [
  { icon: '🍒', weight: 40, payout: 3 },
  { icon: '🍋', weight: 30, payout: 4 },
  { icon: '🔔', weight: 18, payout: 8 },
  { icon: '⭐', weight: 9, payout: 15 },
  { icon: '💎', weight: 3, payout: 50 },
];
const TOTAL_WEIGHT = SYMBOLS.reduce((s, x) => s + x.weight, 0);

function spinReel(): { icon: string; payout: number } {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const s of SYMBOLS) {
    if (r < s.weight) return s;
    r -= s.weight;
  }
  return SYMBOLS[0];
}

function playSlots(): { result: string; multiplier: number } {
  const reels = [spinReel(), spinReel(), spinReel()];
  const result = reels.map((r) => r.icon).join(' ');

  if (reels[0].icon === reels[1].icon && reels[1].icon === reels[2].icon) {
    return { result, multiplier: reels[0].payout };
  }
  if (reels[0].icon === reels[1].icon || reels[1].icon === reels[2].icon || reels[0].icon === reels[2].icon) {
    return { result, multiplier: 1.5 };
  }
  return { result, multiplier: 0 };
}

export async function POST(request: NextRequest) {
  const me = await currentCasinoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const freeze = await getHubPayFreeze(me.id);
    if (freeze.frozen) {
      return NextResponse.json({ success: false, error: `Tu cuenta de HubPay está congelada por Staff${freeze.reason ? `: ${freeze.reason}` : ''}` }, { status: 403 });
    }

    const { game, bet, choice } = await request.json();
    const betAmount = Number(bet);
    const { min, max } = await getBetLimits();
    if (!Number.isFinite(betAmount) || betAmount < min || betAmount > max) {
      return NextResponse.json({ success: false, error: `La apuesta debe estar entre $${min.toLocaleString()} y $${max.toLocaleString()}` }, { status: 400 });
    }

    const balance = await getBalance(me.id);
    if (balance < betAmount) return NextResponse.json({ success: false, error: 'Saldo insuficiente en HubPay' }, { status: 400 });

    let outcome: { result: string; multiplier: number };
    if (game === 'roulette') outcome = playRoulette(String(choice), betAmount);
    else if (game === 'dice') outcome = playDice(String(choice));
    else if (game === 'slots') outcome = playSlots();
    else return NextResponse.json({ success: false, error: 'Juego no válido' }, { status: 400 });

    const payout = Math.round(betAmount * outcome.multiplier);
    const net = payout - betAmount;

    await adjustBalance({ discordId: me.id, delta: net, type: net >= 0 ? 'transfer_in' : 'expense', description: `Casino (${game}): ${outcome.result}` });

    const betsCol = await casinoBetsCollection();
    const doc = {
      id: newBetId(), playerId: me.id, game, bet: betAmount, choice: String(choice || ''),
      result: outcome.result, payout, net, createdAt: new Date(),
    };
    await betsCol.insertOne(doc);

    if (net > 0) {
      await notifyUser(me.id, {
        title: 'Premio de Casino',
        message: `Ganaste $${payout.toLocaleString('es-CO')} en ${game} (${outcome.result})`,
        type: 'success',
        appId: 'casino',
      });
    }

    return NextResponse.json({ success: true, ...doc, won: net > 0 });
  } catch (error) {
    console.error('Error jugando en el casino:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar la jugada' }, { status: 500 });
  }
}

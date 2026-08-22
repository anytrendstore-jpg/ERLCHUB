'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dices,
  CircleDot,
  Cherry,
  History,
  Loader2,
  Wallet,
  Gem,
  Trophy,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Sparkles,
  Lock,
} from 'lucide-react';
import RouletteWheel from './casino/RouletteWheel';
import DiceRoller from './casino/DiceRoller';
import SlotReels from './casino/SlotReels';

interface BetResult {
  id: string;
  game: string;
  bet: number;
  choice: string;
  result: string;
  payout: number;
  net: number;
  createdAt: string;
  won?: boolean;
}

interface CasinoMe {
  displayName: string;
  avatar?: string;
}

const GAMES = [
  { id: 'roulette', label: 'Ruleta', icon: CircleDot, desc: 'Apuesta a color, número o paridad' },
  { id: 'dice', label: 'Dados', icon: Dices, desc: 'Predice la suma de dos dados' },
  { id: 'slots', label: 'Tragamonedas', icon: Cherry, desc: 'Iguala símbolos y multiplica tu apuesta' },
] as const;

const SIDEBAR_LOCKED = [
  { label: 'Blackjack', icon: Gem },
  { label: 'Apuestas', icon: TrendingUp },
  { label: 'Torneos', icon: Trophy },
];

type ViewId = 'lobby' | 'roulette' | 'dice' | 'slots' | 'history' | 'stats';

interface GameTarget {
  rouletteNumber: number | null;
  d1: number | null;
  d2: number | null;
  slotSymbols: string[] | null;
}

const EMPTY_TARGET: GameTarget = { rouletteNumber: null, d1: null, d2: null, slotSymbols: null };

const MIN_SPIN_MS: Record<string, number> = { roulette: 1000, dice: 900, slots: 900 };
const SETTLE_MS: Record<string, number> = { roulette: 3300, dice: 550, slots: 1150 };

function parseTarget(gameId: string, result: string): GameTarget {
  if (gameId === 'roulette') {
    const m = /^(\d+)/.exec(result);
    return { ...EMPTY_TARGET, rouletteNumber: m ? parseInt(m[1], 10) : null };
  }
  if (gameId === 'dice') {
    const m = /^(\d+)\s*\+\s*(\d+)/.exec(result);
    return { ...EMPTY_TARGET, d1: m ? parseInt(m[1], 10) : null, d2: m ? parseInt(m[2], 10) : null };
  }
  if (gameId === 'slots') {
    return { ...EMPTY_TARGET, slotSymbols: result.split(' ').filter(Boolean) };
  }
  return EMPTY_TARGET;
}

export default function CasinoApp() {
  const [view, setView] = useState<ViewId>('lobby');
  const [bet, setBet] = useState(500);
  const [choice, setChoice] = useState('red');
  const [playing, setPlaying] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [target, setTarget] = useState<GameTarget>(EMPTY_TARGET);
  const [lastResult, setLastResult] = useState<BetResult | null>(null);
  const [history, setHistory] = useState<BetResult[]>([]);
  const [me, setMe] = useState<CasinoMe | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const game = view === 'roulette' || view === 'dice' || view === 'slots' ? view : null;

  const loadWallet = useCallback(async () => {
    const res = await fetch('/api/hubpay/wallet', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setBalance(data.wallet.availableBalance);
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/casino/history', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) { setHistory(data.bets); if (data.me) setMe(data.me); }
  }, []);

  useEffect(() => { loadWallet(); loadHistory(); }, [loadWallet, loadHistory]);

  const selectGame = (id: (typeof GAMES)[number]['id']) => {
    setView(id);
    setChoice(id === 'roulette' ? 'red' : 'low');
    setLastResult(null);
    setTarget(EMPTY_TARGET);
    setSpinning(false);
  };

  const play = async () => {
    if (!game) return;
    setPlaying(true);
    setLastResult(null);
    setTarget(EMPTY_TARGET);
    setSpinning(true);
    const startedAt = Date.now();
    try {
      const res = await fetch('/api/casino/play', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, bet, choice: game === 'slots' ? '' : choice }),
      });
      const data = await res.json();

      if (!data.success) {
        setSpinning(false);
        setLastResult({ id: 'err', game, bet, choice, result: data.error, payout: 0, net: 0, createdAt: '' });
        return;
      }

      const elapsed = Date.now() - startedAt;
      const minWait = MIN_SPIN_MS[game] || 800;
      if (elapsed < minWait) await new Promise((r) => setTimeout(r, minWait - elapsed));

      setTarget(parseTarget(game, data.result));
      setSpinning(false);
      await new Promise((r) => setTimeout(r, SETTLE_MS[game] || 500));

      setLastResult(data);
      await Promise.all([loadWallet(), loadHistory()]);
    } finally {
      setPlaying(false);
    }
  };

  const stats = useMemo(() => {
    const played = history.length;
    const wins = history.filter((b) => b.net > 0).length;
    const losses = history.filter((b) => b.net < 0).length;
    const pushes = played - wins - losses;
    const wagered = history.reduce((acc, b) => acc + b.bet, 0);
    const won = history.filter((b) => b.net > 0).reduce((acc, b) => acc + b.net, 0);
    const lost = history.filter((b) => b.net < 0).reduce((acc, b) => acc + Math.abs(b.net), 0);
    const biggest = history.reduce((max, b) => (b.net > max ? b.net : max), 0);
    const favGame = Object.entries(
      history.reduce((acc: Record<string, number>, b) => { acc[b.game] = (acc[b.game] || 0) + 1; return acc; }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { played, wins, losses, pushes, wagered, won, lost, biggest, favGame };
  }, [history]);

  return (
    <div className="h-full flex flex-col bg-[#060a14] text-white">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-5 py-3 bg-gradient-to-r from-[#0a1020] to-[#0d1424] border-b border-cyan-500/10 flex-shrink-0">
        <button onClick={() => setView('lobby')} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center">
            <Dices className="w-4.5 h-4.5 text-cyan-300" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            ERLC<span className="text-cyan-300">BET</span>
          </span>
        </button>

        <div className="ml-2 hidden sm:flex items-center gap-1">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => selectGame(g.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === g.id ? 'bg-cyan-400/15 text-cyan-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
            <Wallet className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-sm font-bold">${balance?.toLocaleString('es-CO') ?? '...'}</span>
          </div>
          {me && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-1 pr-3 py-1">
              {me.avatar ? (
                <img src={me.avatar} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-cyan-400/20" />
              )}
              <span className="text-xs text-white/70 max-w-[100px] truncate">{me.displayName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-52 border-r border-white/5 p-3 overflow-y-auto custom-scrollbar hidden md:flex flex-col gap-1 flex-shrink-0">
          <p className="text-white/30 text-[11px] uppercase tracking-wide px-2 mb-1 mt-1">Casino</p>
          <SidebarItem icon={Sparkles} label="Lobby" active={view === 'lobby'} onClick={() => setView('lobby')} />
          {GAMES.map((g) => (
            <SidebarItem key={g.id} icon={g.icon} label={g.label} active={view === g.id} onClick={() => selectGame(g.id)} />
          ))}
          <SidebarItem icon={History} label="Historial" active={view === 'history'} onClick={() => setView('history')} />
          <SidebarItem icon={BarChart3} label="Estadísticas" active={view === 'stats'} onClick={() => setView('stats')} />

          <p className="text-white/30 text-[11px] uppercase tracking-wide px-2 mb-1 mt-4">Próximamente</p>
          {SIDEBAR_LOCKED.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/25 text-sm cursor-not-allowed">
              <item.icon className="w-4 h-4" />
              {item.label}
              <Lock className="w-3 h-3 ml-auto" />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6">
          {view === 'lobby' && (
            <LobbyView balance={balance} onPlay={selectGame} />
          )}

          {game && (
            <GameView
              gameId={game}
              bet={bet}
              setBet={setBet}
              choice={choice}
              setChoice={setChoice}
              playing={playing}
              spinning={spinning}
              target={target}
              lastResult={lastResult}
              balance={balance}
              onPlay={play}
            />
          )}

          {view === 'history' && <HistoryView history={history} />}
          {view === 'stats' && <StatsView stats={stats} />}
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/20' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function LobbyView({ balance, onPlay }: { balance: number | null; onPlay: (g: (typeof GAMES)[number]['id']) => void }) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e1a33] via-[#0c1428] to-[#1a0f2e] border border-white/10 p-8">
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-10 bottom-0 opacity-10">
          <Dices className="w-40 h-40 text-cyan-300" />
        </div>
        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-1.5 text-cyan-300 text-xs font-semibold bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3 h-3" /> Casino oficial de ERLC Hub
          </span>
          <h1 className="text-3xl font-extrabold mb-2">La casa siempre gana.<br />¿Te atreves a probar suerte?</h1>
          <p className="text-white/50 text-sm mb-5">Todas las jugadas se procesan en el servidor y se pagan directo desde tu cuenta de HubPay.</p>
          <div className="flex items-center gap-3 text-sm">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <p className="text-white/40 text-xs">Tu saldo</p>
              <p className="font-bold text-cyan-300">${balance?.toLocaleString('es-CO') ?? '...'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Games grid */}
      <div>
        <h2 className="text-white/80 font-semibold mb-3">Juegos disponibles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {GAMES.map((g) => {
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                onClick={() => onPlay(g.id)}
                className="group text-left p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.07] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 text-cyan-300" />
                </div>
                <p className="font-bold mb-1">{g.label}</p>
                <p className="text-white/40 text-xs mb-4">{g.desc}</p>
                <span className="text-cyan-300 text-xs font-semibold">Jugar ahora →</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GameView({
  gameId, bet, setBet, choice, setChoice, playing, spinning, target, lastResult, balance, onPlay,
}: {
  gameId: 'roulette' | 'dice' | 'slots';
  bet: number;
  setBet: (n: number) => void;
  choice: string;
  setChoice: (c: string) => void;
  playing: boolean;
  spinning: boolean;
  target: GameTarget;
  lastResult: BetResult | null;
  balance: number | null;
  onPlay: () => void;
}) {
  const meta = GAMES.find((g) => g.id === gameId)!;
  const Icon = meta.icon;
  return (
    <div className="max-w-lg mx-auto mt-2">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-cyan-300" />
        </div>
        <div>
          <p className="font-bold">{meta.label}</p>
          <p className="text-white/40 text-xs">{meta.desc}</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        {lastResult && !spinning && (
          <div className={`mb-6 p-4 rounded-xl text-center ${lastResult.net > 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            <p className="text-white text-lg font-mono">{lastResult.result}</p>
            <p className={`text-2xl font-bold mt-1 ${lastResult.net > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {lastResult.net > 0 ? `+$${lastResult.net.toLocaleString('es-CO')}` : lastResult.net < 0 ? `-$${Math.abs(lastResult.net).toLocaleString('es-CO')}` : 'Sin cambio'}
            </p>
          </div>
        )}

        {(spinning || target.rouletteNumber !== null || target.d1 !== null || target.slotSymbols !== null) && (
          <div className="mb-6 flex justify-center">
            {gameId === 'roulette' && <RouletteWheel spinning={spinning} targetNumber={target.rouletteNumber} />}
            {gameId === 'dice' && <DiceRoller spinning={spinning} d1={target.d1} d2={target.d2} />}
            {gameId === 'slots' && <SlotReels spinning={spinning} symbols={target.slotSymbols} />}
          </div>
        )}

        {gameId === 'roulette' && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {['red', 'black', 'even', 'odd'].map((c) => (
              <button key={c} disabled={playing} onClick={() => setChoice(c)} className={`py-3 rounded-lg text-sm font-medium capitalize transition-colors disabled:opacity-50 ${choice === c ? 'bg-cyan-500 text-[#060a14]' : 'bg-white/10 text-white/60'}`}>
                {c === 'red' ? 'Rojo (2x)' : c === 'black' ? 'Negro (2x)' : c === 'even' ? 'Par (2x)' : 'Impar (2x)'}
              </button>
            ))}
          </div>
        )}

        {gameId === 'dice' && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[{ id: 'low', label: 'Bajo 2-6 (2.4x)' }, { id: 'seven', label: 'Siete (5x)' }, { id: 'high', label: 'Alto 8-12 (2.4x)' }].map((c) => (
              <button key={c.id} disabled={playing} onClick={() => setChoice(c.id)} className={`py-3 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${choice === c.id ? 'bg-cyan-500 text-[#060a14]' : 'bg-white/10 text-white/60'}`}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {gameId === 'slots' && (
          <p className="text-white/50 text-sm text-center mb-6">3 símbolos iguales = premio mayor · 2 iguales = premio menor</p>
        )}

        <div className="flex items-center gap-3 mb-4">
          <label className="text-white/50 text-sm">Apuesta:</label>
          <input type="number" disabled={playing} value={bet} onChange={(e) => setBet(Number(e.target.value))} min={100} max={25000} step={100}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" />
        </div>

        <button onClick={onPlay} disabled={playing || bet < 100 || (balance !== null && bet > balance)}
          className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#060a14] font-bold transition-colors flex items-center justify-center gap-2">
          {playing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Jugar'}
        </button>
      </div>
    </div>
  );
}

function HistoryView({ history }: { history: BetResult[] }) {
  return (
    <div>
      <h2 className="text-white/80 font-semibold mb-4 flex items-center gap-2"><History className="w-4 h-4" /> Historial de partidas</h2>
      {history.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-16">Todavía no has jugado ninguna partida.</p>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/40 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Juego</th>
                <th className="text-left px-4 py-3 font-medium">Resultado</th>
                <th className="text-right px-4 py-3 font-medium">Apuesta</th>
                <th className="text-right px-4 py-3 font-medium">Ganancia</th>
                <th className="text-right px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((b) => (
                <tr key={b.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 capitalize text-white/80">{b.game}</td>
                  <td className="px-4 py-3 text-white/50 font-mono text-xs">{b.result}</td>
                  <td className="px-4 py-3 text-right text-white/60">${b.bet.toLocaleString('es-CO')}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${b.net > 0 ? 'text-emerald-400' : b.net < 0 ? 'text-red-400' : 'text-white/40'}`}>
                    {b.net > 0 ? '+' : ''}{b.net.toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-right text-white/30 text-xs">{b.createdAt ? new Date(b.createdAt).toLocaleString('es-CO') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatsView({ stats }: { stats: { played: number; wins: number; losses: number; pushes: number; wagered: number; won: number; lost: number; biggest: number; favGame?: string } }) {
  const cards = [
    { label: 'Partidas jugadas', value: stats.played.toLocaleString('es-CO'), icon: Dices },
    { label: 'Victorias', value: stats.wins.toLocaleString('es-CO'), icon: TrendingUp, accent: 'text-emerald-400' },
    { label: 'Derrotas', value: stats.losses.toLocaleString('es-CO'), icon: TrendingDown, accent: 'text-red-400' },
    { label: 'Total apostado', value: `$${stats.wagered.toLocaleString('es-CO')}`, icon: Wallet },
    { label: 'Total ganado', value: `$${stats.won.toLocaleString('es-CO')}`, icon: TrendingUp, accent: 'text-emerald-400' },
    { label: 'Total perdido', value: `$${stats.lost.toLocaleString('es-CO')}`, icon: TrendingDown, accent: 'text-red-400' },
    { label: 'Mayor premio', value: `$${stats.biggest.toLocaleString('es-CO')}`, icon: Trophy, accent: 'text-yellow-400' },
    { label: 'Juego favorito', value: stats.favGame ? stats.favGame.charAt(0).toUpperCase() + stats.favGame.slice(1) : '—', icon: Sparkles },
  ];
  return (
    <div>
      <h2 className="text-white/80 font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Estadísticas personales</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <c.icon className={`w-4 h-4 mb-2 ${c.accent || 'text-cyan-300'}`} />
            <p className="text-white/40 text-xs mb-1">{c.label}</p>
            <p className={`font-bold ${c.accent || 'text-white'}`}>{c.value}</p>
          </div>
        ))}
      </div>
      {stats.played === 0 && (
        <p className="text-white/30 text-sm mt-6 text-center">Juega alguna partida para empezar a ver tus estadísticas.</p>
      )}
    </div>
  );
}

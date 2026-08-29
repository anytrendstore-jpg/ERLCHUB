'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOS } from '@/contexts/OSContext';
import type { DepartmentConfig } from '@/lib/departments';
import { bootFont } from '@/lib/bootFont';
import { useCardTilt } from '@/hooks/useCardTilt';
import { Plus, Star, X, Loader2, Clock, Briefcase, MapPin, ShieldCheck, Lock, CalendarDays } from 'lucide-react';

interface CharacterRow {
  id: string;
  name: string;
  avatar?: string;
  city?: string;
  job?: string;
  department?: string;
  isPrimary: boolean;
  lastSessionAt: string;
  createdAt?: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

function memberSince(iso?: string): string {
  if (!iso) return 'Fecha desconocida';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatRow({ icon: Icon, label, accent }: { icon: typeof Clock; label: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${accent ? 'text-blue-400' : 'text-white/30'}`} />
      <span className={`truncate ${accent ? 'text-blue-300' : 'text-white/50'}`}>{label}</span>
    </div>
  );
}

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const PARTICLES = [
  { left: '8%', size: 3, dur: 9, delay: -1 },
  { left: '18%', size: 2, dur: 12, delay: -6 },
  { left: '29%', size: 2, dur: 10, delay: -3 },
  { left: '41%', size: 3, dur: 14, delay: -8 },
  { left: '58%', size: 2, dur: 11, delay: -2 },
  { left: '69%', size: 3, dur: 13, delay: -9 },
  { left: '81%', size: 2, dur: 9.5, delay: -4 },
  { left: '91%', size: 2, dur: 12.5, delay: -7 },
];

function Particles() {
  return (
    <>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle absolute bottom-0 rounded-full bg-blue-300/40 pointer-events-none"
          style={{ left: p.left, width: p.size, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
        />
      ))}
    </>
  );
}

function CardShine() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{
        background: 'radial-gradient(220px circle at var(--glow-x,50%) var(--glow-y,50%), rgba(255,255,255,0.10), transparent 60%)',
      }}
    />
  );
}

const CARD_SHELL =
  'group relative w-52 rounded-2xl overflow-hidden bg-gradient-to-b from-[#12121e] to-[#0a0a12] border border-white/10 transition-[transform,border-color,box-shadow] duration-300 ease-out will-change-transform [transform-style:preserve-3d]';

interface CharacterSelectScreenProps {
  onDone: () => void;
  institutionalDept?: DepartmentConfig | null;
}

export default function CharacterSelectScreen({ onDone, institutionalDept }: CharacterSelectScreenProps) {
  const { user, characterSlots, switchProfile } = useOS();
  const [rows, setRows] = useState<CharacterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const scene = useCardTilt<HTMLDivElement>();

  useEffect(() => {
    fetch('/api/characters', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => { if (data.success) setRows(data.characters); })
      .finally(() => setLoading(false));
  }, []);

  const canCreate = rows.length < characterSlots;
  const showLockedSlot = characterSlots <= 1 && rows.length >= characterSlots;

  const pick = async (id: string) => {
    if (entering) return;
    setEntering(id);
    if (id !== user.activeProfileId) await switchProfile(id);
    setLeaving(true);
    setTimeout(onDone, 320);
  };

  return (
    <div
      ref={scene.ref}
      onMouseMove={scene.onMouseMove}
      className={`${bootFont.className} fixed inset-0 z-[9998] bg-[#07070c] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${leaving ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'}`}
    >
      {/* Foco que sigue el cursor por toda la pantalla */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ background: 'radial-gradient(640px circle at var(--glow-x,50%) var(--glow-y,20%), rgba(99,102,241,0.10), transparent 65%)' }}
      />
      <div className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#8e00f7]/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.14] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 35%, black 40%, transparent 90%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 35%, black 40%, transparent 90%)',
      }} />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay" style={{ backgroundImage: NOISE_BG }} />
      <div className="scanline absolute inset-x-0 h-40 pointer-events-none opacity-[0.05] bg-gradient-to-b from-transparent via-white to-transparent" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><Particles /></div>

      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full px-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-white/40 text-[11px] uppercase tracking-[0.3em]">ERLC HUB OS · Sesión iniciada</p>
        </div>
        <h1 className="text-white text-3xl sm:text-4xl font-semibold tracking-tight mb-2 text-center" style={{ textShadow: '0 0 40px rgba(99,102,241,0.35)' }}>
          ¿Con qué personaje vas a entrar?
        </h1>
        <div className="flex items-center gap-2 mb-10">
          {institutionalDept && (
            <p className="text-white/40 text-xs">Elegí el personaje — después vas a poder abrir la terminal de {institutionalDept.name}.</p>
          )}
          {!loading && (
            <span className={`text-[10px] font-mono tracking-wide text-white/35 border border-white/10 rounded-full px-2.5 py-1 bg-white/[0.02] ${institutionalDept ? '' : 'mx-auto'}`}>
              {rows.length}/{characterSlots} PERSONAJES
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-white/30 text-xs font-mono tracking-widest">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
            </span>
            CARGANDO PERSONAJES
          </div>
        ) : (
          <div className="flex flex-wrap items-stretch justify-center gap-6 [perspective:1200px]">
            {rows.map((c, i) => (
              <CharacterCard
                key={c.id}
                character={c}
                index={i}
                isActive={c.id === user.activeProfileId}
                entering={entering === c.id}
                disabled={entering !== null}
                onPick={() => pick(c.id)}
              />
            ))}

            {canCreate && (
              <button
                onClick={() => setShowCreate(true)}
                disabled={entering !== null}
                style={{ animationDelay: `${rows.length * 80}ms` }}
                className={`${CARD_SHELL} card-enter h-full flex flex-col border-dashed hover:border-white/30 disabled:opacity-40 hover:-translate-y-1`}
              >
                <div className="aspect-[4/5] flex items-center justify-center relative">
                  <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: NOISE_BG }} />
                  <Plus className="w-9 h-9 text-white/20 group-hover:text-white/50 group-hover:scale-110 transition-all duration-300" />
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
                  <span className="text-[10px] text-white/35 uppercase tracking-wide font-mono">Slot libre</span>
                </div>
                <div className="flex-1 px-3.5 py-2.5">
                  <p className="text-white/45 text-[11px] leading-relaxed">Nuevo personaje con su propio escritorio, apps y configuración — completamente separado de los que ya tenés.</p>
                </div>
                <div className="w-full py-2.5 text-[11px] text-center font-bold tracking-wide uppercase bg-white/10 text-white/80 group-hover:bg-white/15 transition-colors">
                  Crear personaje
                </div>
              </button>
            )}

            {showLockedSlot && (
              <div
                style={{ animationDelay: `${(rows.length + (canCreate ? 1 : 0)) * 80}ms` }}
                className={`${CARD_SHELL} card-enter h-full flex flex-col opacity-80 hover:opacity-100`}
              >
                <div className="relative aspect-[4/5] bg-white/[0.03] flex items-center justify-center grayscale">
                  <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: NOISE_BG }} />
                  <Lock className="w-8 h-8 text-white/20" />
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400/70" />
                  <span className="text-[10px] text-white/35 uppercase tracking-wide font-mono">Slot premium</span>
                </div>
                <div className="flex-1 px-3.5 py-2.5">
                  <p className="text-white/45 text-[11px] leading-relaxed">
                    Desbloqueá otro personaje con el <span className="text-white/70">Kit Personajes</span>, o subiendo a una <span className="text-white/70">membresía</span> VIP, Elite o Leyenda. Cada personaje tiene su propio escritorio y progreso.
                  </p>
                </div>
                <div className="flex flex-col">
                  <Link
                    href="/tienda/kit/kit-personajes"
                    className="w-full py-2 text-[11px] text-center font-bold tracking-wide uppercase bg-white/10 hover:bg-white/15 text-white/80 transition-colors border-b border-white/5"
                  >
                    Ver Kit Personajes
                  </Link>
                  <Link
                    href="/tienda#membresias"
                    className="w-full py-2 text-[11px] text-center font-bold tracking-wide uppercase bg-gradient-to-r from-blue-600 to-[#8e00f7] hover:brightness-110 text-white transition-all"
                  >
                    Ver Membresías
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCharacterModal
          onClose={() => setShowCreate(false)}
          onCreated={async (id) => {
            setShowCreate(false);
            setEntering(id);
            await switchProfile(id);
            setLeaving(true);
            setTimeout(onDone, 320);
          }}
        />
      )}

      <style jsx>{`
        .card-enter {
          animation: cardEnter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(18px) rotateX(8deg) scale(0.96); }
          to { opacity: 1; transform: translateY(0) rotateX(0) scale(1); }
        }
        .scanline {
          animation: scanline 7s linear infinite;
          top: -10rem;
        }
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(160vh); }
        }
        .shimmer {
          background: linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%);
          background-size: 200% 100%;
          background-position: 150% 0;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .group:hover .shimmer {
          opacity: 1;
          animation: shimmerSweep 1.1s ease-out;
        }
        @keyframes shimmerSweep {
          from { background-position: 150% 0; }
          to { background-position: -50% 0; }
        }
        .particle {
          animation: floatUp linear infinite;
        }
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .card-enter, .scanline, .shimmer, .particle { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function CharacterCard({ character: c, index: i, isActive, entering, disabled, onPick }: {
  character: CharacterRow;
  index: number;
  isActive: boolean;
  entering: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  const tilt = useCardTilt<HTMLButtonElement>();

  return (
    <button
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      onClick={onPick}
      disabled={disabled}
      style={{
        animationDelay: `${i * 80}ms`,
        transform: 'rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))',
      }}
      className={`${CARD_SHELL} card-enter h-full flex flex-col text-left disabled:opacity-40 disabled:hover:scale-100 hover:-translate-y-1 ${isActive ? 'border-blue-500/50 shadow-[0_25px_60px_-20px_rgba(59,130,246,0.5)]' : 'hover:border-blue-500/40 hover:shadow-[0_25px_60px_-20px_rgba(59,130,246,0.4)]'}`}
    >
      <div className="relative aspect-[4/5] bg-white/5 overflow-hidden">
        {c.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.avatar} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl font-semibold">{c.name.charAt(0).toUpperCase()}</div>
        )}
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: NOISE_BG }} />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 to-transparent" />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
        <CardShine />
        <span className="absolute top-2.5 right-2.5 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] text-white/60 border border-white/10 font-mono">#{i + 1}</span>
        {isActive && (
          <span className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/10">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          </span>
        )}
        {entering && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
        <p className="absolute bottom-2 left-3 right-3 text-white font-semibold text-base tracking-tight truncate">{c.name}</p>
      </div>

      <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5">
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-white/25'}`} />
        <span className="text-[10px] text-white/35 uppercase tracking-wide font-mono">{isActive ? 'Sesión activa' : 'Disponible'}</span>
        {c.isPrimary && (
          <span className="ml-auto text-[9px] text-amber-300/80 uppercase tracking-wide font-mono flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-amber-300/80" /> Principal
          </span>
        )}
      </div>

      <div className="flex-1 px-3.5 py-2.5 space-y-1.5">
        <StatRow icon={Clock} label={timeAgo(c.lastSessionAt)} />
        <StatRow icon={CalendarDays} label={`Desde el ${memberSince(c.createdAt)}`} />
        <StatRow icon={Briefcase} label={c.job || 'Sin oficio asignado'} />
        <StatRow icon={MapPin} label={c.city || 'Sin ciudad asignada'} />
        {c.department && <StatRow icon={ShieldCheck} label={c.department} accent />}
      </div>

      <div className="relative w-full py-2.5 text-[11px] text-center font-bold tracking-wide uppercase bg-gradient-to-r from-blue-600 to-[#8e00f7] text-white overflow-hidden">
        <span className="relative z-10">Seleccionar personaje</span>
        <span className="shimmer absolute inset-0" />
      </div>

      <style jsx>{`
        .card-enter {
          animation: cardEnter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(18px) rotateX(8deg) scale(0.96); }
          to { opacity: 1; transform: translateY(0) rotateX(0) scale(1); }
        }
        .shimmer {
          background: linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%);
          background-size: 200% 100%;
          background-position: 150% 0;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .group:hover .shimmer {
          opacity: 1;
          animation: shimmerSweep 1.1s ease-out;
        }
        @keyframes shimmerSweep {
          from { background-position: 150% 0; }
          to { background-position: -50% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .card-enter, .shimmer { animation: none !important; }
        }
      `}</style>
    </button>
  );
}

function CreateCharacterModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { createCharacter } = useOS();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    const result = await createCharacter(name.trim(), { city: city.trim() || undefined });
    setSaving(false);
    if (!result.ok) { setError(result.error || 'No se pudo crear el personaje'); return; }
    const res = await fetch('/api/characters', { cache: 'no-store' }).then((r) => r.json());
    const created = res.characters?.find((c: any) => c.name === name.trim());
    if (created) onCreated(created.id);
    else onClose();
  };

  return (
    <div className={`${bootFont.className} fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]`} onClick={onClose}>
      <div className="bg-gradient-to-b from-[#12121e] to-[#0a0a12] border border-white/10 rounded-2xl w-full max-w-sm p-6 card-enter" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Crear nuevo personaje</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-white/40 text-xs mb-5">Este personaje tendrá su propio escritorio, apps instaladas y configuración — completamente separado del resto de tus personajes.</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-white/40 text-xs mb-1">Nombre del personaje</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)} autoFocus
              placeholder="Nombre y apellido"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-white/40 text-xs mb-1">Ciudad (opcional)</label>
            <input
              value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="Los Santos..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit" disabled={saving || !name.trim()}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-[#8e00f7] hover:brightness-110 disabled:opacity-50 text-white text-sm font-semibold transition-all mt-2"
          >
            {saving ? 'Creando...' : 'Crear y entrar'}
          </button>
        </form>
      </div>
      <style jsx>{`
        .card-enter {
          animation: cardEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

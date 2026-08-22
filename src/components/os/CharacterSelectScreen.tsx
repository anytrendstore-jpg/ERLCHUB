'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOS } from '@/contexts/OSContext';
import type { DepartmentConfig } from '@/lib/departments';
import { Plus, Star, X, Loader2, Clock, Briefcase, MapPin, ShieldCheck, Lock } from 'lucide-react';

interface CharacterRow {
  id: string;
  name: string;
  avatar?: string;
  city?: string;
  job?: string;
  department?: string;
  isPrimary: boolean;
  lastSessionAt: string;
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

function StatRow({ icon: Icon, label, accent }: { icon: typeof Clock; label: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${accent ? 'text-blue-400' : 'text-white/30'}`} />
      <span className={`truncate ${accent ? 'text-blue-300' : 'text-white/50'}`}>{label}</span>
    </div>
  );
}

const CARD_SHELL =
  'group relative w-52 rounded-2xl overflow-hidden bg-[#0d0d16] border border-white/10 transition-all duration-300 hover:-translate-y-1.5';

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
      className={`fixed inset-0 z-[9998] bg-[#0a0a0f] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${leaving ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'}`}
    >
      <div className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#8e00f7]/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full px-6">
        <p className="text-white/40 text-[11px] uppercase tracking-[0.25em] mb-1">ERLC HUB OS</p>
        <h1 className="text-white text-2xl font-light mb-1">¿Con qué personaje vas a entrar?</h1>
        {institutionalDept && (
          <p className="text-white/35 text-xs mb-9">Elegí el personaje — después vas a poder abrir la terminal de {institutionalDept.name}.</p>
        )}
        {!institutionalDept && <div className="mb-9" />}

        {loading ? (
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
        ) : (
          <div className="flex flex-wrap items-start justify-center gap-5">
            {rows.map((c, i) => {
              const isActive = c.id === user.activeProfileId;
              return (
                <button
                  key={c.id}
                  onClick={() => pick(c.id)}
                  disabled={entering !== null}
                  style={{ animationDelay: `${i * 70}ms` }}
                  className={`${CARD_SHELL} card-enter text-left disabled:opacity-40 disabled:hover:translate-y-0 ${isActive ? 'border-blue-500/40 shadow-[0_20px_45px_-20px_rgba(59,130,246,0.45)]' : 'hover:border-blue-500/40 hover:shadow-[0_20px_45px_-20px_rgba(59,130,246,0.35)]'}`}
                >
                  <div className="relative aspect-[4/5] bg-white/5 overflow-hidden">
                    {c.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl font-semibold">{c.name.charAt(0).toUpperCase()}</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/85 to-transparent" />
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] text-white/60 border border-white/10">#{i + 1}</span>
                    {isActive && (
                      <span className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/10">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      </span>
                    )}
                    {entering === c.id && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                    <p className="absolute bottom-2 left-3 right-3 text-white font-semibold text-sm truncate">{c.name}</p>
                  </div>

                  <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-white/25'}`} />
                    <span className="text-[10px] text-white/35 uppercase tracking-wide">{isActive ? 'Sesión activa' : `Personaje ${i + 1}`}</span>
                  </div>

                  <div className="px-3.5 py-2.5 space-y-1.5">
                    <StatRow icon={Clock} label={timeAgo(c.lastSessionAt)} />
                    <StatRow icon={Briefcase} label={c.job || 'Sin oficio asignado'} />
                    <StatRow icon={MapPin} label={c.city || 'Sin ciudad asignada'} />
                    {c.department && <StatRow icon={ShieldCheck} label={c.department} accent />}
                  </div>

                  <div className="w-full py-2.5 text-[11px] text-center font-bold tracking-wide uppercase bg-gradient-to-r from-blue-600 to-[#8e00f7] text-white transition-opacity group-hover:opacity-90">
                    Seleccionar personaje
                  </div>
                </button>
              );
            })}

            {canCreate && (
              <button
                onClick={() => setShowCreate(true)}
                disabled={entering !== null}
                style={{ animationDelay: `${rows.length * 70}ms` }}
                className={`${CARD_SHELL} card-enter border-dashed hover:border-white/30 disabled:opacity-40 disabled:hover:translate-y-0`}
              >
                <div className="aspect-[4/5] flex items-center justify-center">
                  <Plus className="w-9 h-9 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
                  <span className="text-[10px] text-white/35 uppercase tracking-wide">Slot libre</span>
                </div>
                <div className="px-3.5 py-2.5">
                  <p className="text-white/45 text-[11px] leading-relaxed">Nuevo personaje con su propio escritorio, apps y configuración.</p>
                </div>
                <div className="w-full py-2.5 text-[11px] text-center font-bold tracking-wide uppercase bg-white/10 text-white/80 group-hover:bg-white/15 transition-colors">
                  Crear personaje
                </div>
              </button>
            )}

            {showLockedSlot && (
              <Link
                href="/tienda/kit/kit-completo"
                style={{ animationDelay: `${(rows.length + (canCreate ? 1 : 0)) * 70}ms` }}
                className={`${CARD_SHELL} card-enter block opacity-70 hover:opacity-100`}
              >
                <div className="relative aspect-[4/5] bg-white/[0.03] flex items-center justify-center grayscale">
                  <Lock className="w-8 h-8 text-white/20" />
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400/70" />
                  <span className="text-[10px] text-white/35 uppercase tracking-wide">Slot premium</span>
                </div>
                <div className="px-3.5 py-2.5">
                  <p className="text-white/45 text-[11px] leading-relaxed">Desbloqueá un 2do personaje con el Kit Completo.</p>
                </div>
                <div className="w-full py-2.5 text-[11px] text-center font-bold tracking-wide uppercase bg-white/10 text-white/70 group-hover:bg-white/15 transition-colors">
                  Desbloquear
                </div>
              </Link>
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
          animation: cardEnter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="bg-[#0d0d16] border border-white/10 rounded-2xl w-full max-w-sm p-6 card-enter" onClick={(e) => e.stopPropagation()}>
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

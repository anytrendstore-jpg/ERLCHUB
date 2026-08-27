'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PhoneCall,
  Shield,
  Star,
  Flame,
  MapPin,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  History,
  EyeOff,
  Eye,
  Radio,
  Siren,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';

type CallType =
  | 'Traffic Stop' | 'Suspicious Activity' | 'Robbery' | 'Assault' | 'Shots Fired'
  | 'Welfare Check' | 'Disturbance' | 'Traffic Accident' | 'Cyber Crime'
  | 'Structure Fire' | 'Vehicle Fire' | 'Medical Emergency' | 'Hazmat' | 'Rescue' | 'Other';
type CallStatus = 'Pending' | 'En Route' | 'On Scene' | 'Resolved' | 'Cancelled';
type Priority = 'Low' | 'Medium' | 'High' | 'Emergency';
type Faction = 'Policía' | 'Sheriff' | 'Bomberos';

interface EmergencyCall {
  id: string;
  callNumber: string;
  type: CallType;
  status: CallStatus;
  priority?: Priority;
  location: string;
  description: string;
  faction?: Faction;
  anonymous?: boolean;
  createdAt: string;
}

const TYPE_LABEL: Record<CallType, string> = {
  'Traffic Stop': 'Control de tránsito',
  'Suspicious Activity': 'Actividad sospechosa',
  'Robbery': 'Robo',
  'Assault': 'Agresión',
  'Shots Fired': 'Disparos',
  'Welfare Check': 'Chequeo de bienestar',
  'Disturbance': 'Disturbio',
  'Traffic Accident': 'Accidente de tránsito',
  'Cyber Crime': 'Delito cibernético',
  'Structure Fire': 'Incendio estructural',
  'Vehicle Fire': 'Incendio de vehículo',
  'Medical Emergency': 'Emergencia médica',
  'Hazmat': 'Materiales peligrosos',
  'Rescue': 'Rescate',
  'Other': 'Otro',
};

const PRIORITY_BY_TYPE: Record<CallType, Priority> = {
  'Shots Fired': 'Emergency', 'Robbery': 'Emergency', 'Assault': 'High', 'Traffic Accident': 'High',
  'Disturbance': 'Medium', 'Suspicious Activity': 'Medium', 'Welfare Check': 'Medium',
  'Traffic Stop': 'Low', 'Cyber Crime': 'Low',
  'Structure Fire': 'Emergency', 'Hazmat': 'Emergency', 'Medical Emergency': 'High', 'Rescue': 'High', 'Vehicle Fire': 'High',
  'Other': 'Medium',
};

const PRIORITY_STYLE: Record<Priority, { label: string; bg: string; text: string; ring: string; dot: string }> = {
  Emergency: { label: 'CRÍTICA', bg: 'bg-red-500/15', text: 'text-red-300', ring: 'ring-red-500/30', dot: 'bg-red-500' },
  High: { label: 'ALTA', bg: 'bg-orange-500/15', text: 'text-orange-300', ring: 'ring-orange-500/30', dot: 'bg-orange-400' },
  Medium: { label: 'MEDIA', bg: 'bg-yellow-500/15', text: 'text-yellow-300', ring: 'ring-yellow-500/30', dot: 'bg-yellow-400' },
  Low: { label: 'BAJA', bg: 'bg-blue-500/15', text: 'text-blue-300', ring: 'ring-blue-500/30', dot: 'bg-blue-400' },
};

const STATUS_LABEL: Record<CallStatus, string> = {
  Pending: 'Pendiente', 'En Route': 'En camino', 'On Scene': 'En el lugar', Resolved: 'Resuelta', Cancelled: 'Cancelada',
};

const STATUS_STYLE: Record<CallStatus, string> = {
  Pending: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/25',
  'En Route': 'bg-blue-500/15 text-blue-400 ring-blue-500/25',
  'On Scene': 'bg-orange-500/15 text-orange-400 ring-orange-500/25',
  Resolved: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25',
  Cancelled: 'bg-white/10 text-white/40 ring-white/10',
};

const STATUS_STEPS: CallStatus[] = ['Pending', 'En Route', 'On Scene', 'Resolved'];

const FACTIONS: { id: Faction; label: string; blurb: string; icon: React.ElementType; ring: string; bg: string; text: string; grad: string; shadow: string }[] = [
  { id: 'Policía', label: 'Policía', blurb: 'Robos, agresiones, disturbios', icon: Shield, ring: 'ring-blue-400/60', bg: 'bg-blue-500/15', text: 'text-blue-300', grad: 'from-blue-500 to-blue-700', shadow: 'shadow-blue-600/40' },
  { id: 'Sheriff', label: 'Sheriff', blurb: 'Patrulla, tránsito, apoyo rural', icon: Star, ring: 'ring-amber-400/60', bg: 'bg-amber-500/15', text: 'text-amber-300', grad: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/40' },
  { id: 'Bomberos', label: 'Bomberos', blurb: 'Incendios, accidentes, rescate', icon: Flame, ring: 'ring-orange-400/60', bg: 'bg-orange-500/15', text: 'text-orange-300', grad: 'from-orange-400 to-orange-600', shadow: 'shadow-orange-500/40' },
];

const TYPES_BY_FACTION: Record<Faction, CallType[]> = {
  'Policía': ['Robbery', 'Assault', 'Shots Fired', 'Suspicious Activity', 'Disturbance', 'Traffic Stop', 'Cyber Crime', 'Other'],
  'Sheriff': ['Robbery', 'Assault', 'Shots Fired', 'Suspicious Activity', 'Disturbance', 'Welfare Check', 'Other'],
  'Bomberos': ['Structure Fire', 'Vehicle Fire', 'Medical Emergency', 'Hazmat', 'Rescue', 'Traffic Accident', 'Other'],
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export default function Emergency911App() {
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [faction, setFaction] = useState<Faction>('Policía');
  const [type, setType] = useState<CallType>('Suspicious Activity');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCall, setLastCall] = useState<EmergencyCall | null>(null);

  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(() => {
    fetch('/api/emergency/calls', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCalls(d.calls); })
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 8000);
    return () => clearInterval(interval);
  }, [loadHistory]);

  useEffect(() => {
    if (!TYPES_BY_FACTION[faction].includes(type)) setType(TYPES_BY_FACTION[faction][0]);
    setTypeMenuOpen(false);
  }, [faction]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!typeMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) setTypeMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTypeMenuOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [typeMenuOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/emergency/calls', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faction, type, location, description, anonymous }),
      });
      const data = await res.json();
      if (data.success) {
        setLastCall(data.call);
        setLocation('');
        setDescription('');
        setAnonymous(false);
        loadHistory();
      } else {
        setError(data.error || 'No se pudo enviar la llamada');
      }
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const activeFaction = FACTIONS.find((f) => f.id === faction)!;
  const priority = PRIORITY_BY_TYPE[type];
  const pStyle = PRIORITY_STYLE[priority];
  const pendingCount = calls.filter((c) => c.status === 'Pending' || c.status === 'En Route').length;

  return (
    <div className="h-full flex flex-col bg-[#08050a] text-white relative overflow-hidden">
      {/* Ambient — glow rojo/azul + radar giratorio muy tenue */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 15% -5%, rgba(220,38,38,0.20), transparent 45%), radial-gradient(circle at 100% 100%, rgba(37,99,235,0.14), transparent 45%)' }}
      />
      <div
        className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.07] animate-spin [animation-duration:14s]"
        style={{ background: 'conic-gradient(from 0deg, transparent 0%, #dc2626 8%, transparent 20%, transparent 50%, #2563eb 58%, transparent 70%)' }}
      />

      {/* Header */}
      <div className="relative flex items-center gap-3.5 px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="relative flex-shrink-0">
          <span className="absolute inset-0 rounded-2xl bg-red-500 animate-ping opacity-20" />
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/50 animate-siren-flash">
            <Siren className="w-6 h-6 text-white drop-shadow" />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-red-200 bg-clip-text text-transparent">Central de Emergencias 911</h1>
          <p className="text-white/40 text-xs">Reporta incidentes a Policía, Sheriff o Bomberos</p>
        </div>
        <div className="ml-auto flex items-center gap-2.5 flex-shrink-0">
          <div className="hidden sm:flex items-end gap-[3px] h-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{ height: `${[6, 12, 16, 10, 14][i]}px`, animationDelay: `${i * 120}ms`, animationDuration: '900ms' }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-300 bg-red-500/10 border border-red-500/25 rounded-full px-2.5 py-1 shadow-[0_0_16px_-6px_rgba(220,38,38,0.7)]">
            <Radio className="w-3 h-3" /> LÍNEA ABIERTA
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex gap-1 px-6 pt-3.5">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <button
            onClick={() => setTab('new')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === 'new' ? 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg shadow-red-600/30' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" /> Nueva llamada
          </button>
          <button
            onClick={() => setTab('history')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === 'history' ? 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg shadow-red-600/30' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Mis llamadas
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-red-600 text-[9px] font-extrabold flex items-center justify-center">{pendingCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto custom-scrollbar">
        {tab === 'new' ? (
          lastCall ? (
            <SuccessScreen call={lastCall} onNewCall={() => setLastCall(null)} onViewHistory={() => { setLastCall(null); setTab('history'); }} />
          ) : (
            <form onSubmit={submit} className="p-6 max-w-xl mx-auto space-y-6">
              {/* Faction selector */}
              <div>
                <label className="text-white/50 text-xs font-bold uppercase tracking-widest block mb-2.5">¿A quién llamás?</label>
                <div className="grid grid-cols-3 gap-3">
                  {FACTIONS.map((f) => {
                    const Icon = f.icon;
                    const isSelected = faction === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFaction(f.id)}
                        className={`group relative flex flex-col items-center gap-2 pt-4 pb-3 px-2 rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isSelected
                            ? `bg-gradient-to-b from-white/[0.08] to-white/[0.02] border-transparent ring-2 ${f.ring} -translate-y-0.5 shadow-lg ${f.shadow}`
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:-translate-y-0.5'
                        }`}
                      >
                        {isSelected && <span className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${f.grad}`} />}
                        <div className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200 ${isSelected ? `bg-gradient-to-br ${f.grad} scale-110` : `${f.bg} group-hover:scale-105`}`}>
                          {isSelected && <span className="absolute inset-0 rounded-full bg-white/30 animate-ping [animation-duration:2s]" />}
                          <Icon className={`relative w-5 h-5 ${isSelected ? 'text-white' : f.text}`} />
                        </div>
                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-white/60'}`}>{f.label}</span>
                        <span className="text-[10px] text-white/30 text-center leading-tight px-1">{f.blurb}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-widest">Tipo de emergencia</label>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${pStyle.bg} ${pStyle.text} ${pStyle.ring}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pStyle.dot} animate-pulse`} /> PRIORIDAD {pStyle.label}
                  </span>
                </div>
                <div className="relative" ref={typeMenuRef}>
                  <button
                    type="button"
                    onClick={() => setTypeMenuOpen((v) => !v)}
                    aria-expanded={typeMenuOpen}
                    className={`w-full flex items-center justify-between gap-3 bg-white/5 border rounded-xl px-4 py-3 text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/10 ${
                      typeMenuOpen ? 'border-red-500/50' : 'border-white/10 hover:bg-white/[0.07]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${pStyle.dot}`} />
                      {TYPE_LABEL[type]}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-200 ${typeMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {typeMenuOpen && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-2 rounded-xl border border-white/10 bg-[#160b0e]/98 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden py-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                      {TYPES_BY_FACTION[faction].map((t) => {
                        const tStyle = PRIORITY_STYLE[PRIORITY_BY_TYPE[t]];
                        const isActive = t === type;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => { setType(t); setTypeMenuOpen(false); }}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                              isActive ? 'bg-white/[0.08] text-white' : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tStyle.dot}`} />
                              <span className="truncate">{TYPE_LABEL[t]}</span>
                            </span>
                            <span className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tStyle.bg} ${tStyle.text}`}>{tStyle.label}</span>
                              {isActive && <Check className="w-3.5 h-3.5 text-red-400" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-white/50 text-xs font-bold uppercase tracking-widest block mb-2.5">Ubicación</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Calle / intersección / punto de referencia..."
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/50 text-xs font-bold uppercase tracking-widest block mb-2.5">¿Qué está pasando?</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  placeholder="Describí la situación con el mayor detalle posible..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={() => setAnonymous((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors"
              >
                <span className="flex items-center gap-2.5 text-sm text-white/70">
                  {anonymous ? <EyeOff className="w-4 h-4 text-red-300" /> : <Eye className="w-4 h-4 text-white/40" />}
                  Llamar de forma anónima
                </span>
                <span className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 flex-shrink-0 ${anonymous ? 'bg-red-500' : 'bg-white/15'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200 ${anonymous ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                </span>
              </button>

              {error && (
                <p className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </p>
              )}

              {/* Botón de llamada — pieza central */}
              <div className="pt-2 flex flex-col items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`group relative w-24 h-24 rounded-full bg-gradient-to-br ${activeFaction.grad} disabled:opacity-60 flex items-center justify-center shadow-2xl ${activeFaction.shadow} transition-transform duration-150 hover:scale-105 active:scale-95`}
                >
                  {!submitting && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-white/25 animate-ping [animation-duration:1.8s]" />
                      <span className="absolute inset-0 rounded-full bg-white/15 animate-ping [animation-duration:1.8s] [animation-delay:0.4s]" />
                    </>
                  )}
                  {submitting ? <Loader2 className="relative w-8 h-8 text-white animate-spin" /> : <PhoneCall className="relative w-8 h-8 text-white" />}
                </button>
                <span className="text-sm font-bold text-white/80 tracking-wide">
                  {submitting ? 'Enviando llamada...' : `Llamar a ${faction} ahora`}
                </span>
              </div>
            </form>
          )
        ) : (
          <HistoryList calls={calls} loading={loadingHistory} />
        )}
      </div>
    </div>
  );
}

function SuccessScreen({ call, onNewCall, onViewHistory }: { call: EmergencyCall; onNewCall: () => void; onViewHistory: () => void }) {
  const faction = FACTIONS.find((f) => f.id === call.faction);
  const Icon = faction?.icon || Shield;
  return (
    <div className="p-6 max-w-md mx-auto text-center py-14">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping [animation-duration:1.6s]" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-600/50">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-extrabold text-white mb-1.5">Llamada recibida</h2>
      <p className="text-white/50 text-sm mb-6">
        Un despachador de <span className="text-white font-semibold">{call.faction}</span> está viendo tu reporte.
      </p>

      <div className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3.5 mb-8">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${faction?.bg || 'bg-white/10'}`}>
          <Icon className={`w-[18px] h-4 ${faction?.text || 'text-white/60'}`} />
        </div>
        <div className="text-left">
          <div className="text-white/40 text-[10px] uppercase tracking-wide font-bold">Folio</div>
          <div className="text-white font-mono font-bold text-lg tracking-wider">#{call.callNumber}</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        {STATUS_STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-yellow-400 shadow-[0_0_8px_-1px_rgba(250,204,21,0.8)]' : 'bg-white/15'}`} />
            {i < STATUS_STEPS.length - 1 && <div className="w-8 h-0.5 bg-white/10" />}
          </React.Fragment>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={onNewCall} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors">
          Nueva llamada
        </button>
        <button onClick={onViewHistory} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white text-sm font-semibold shadow-lg shadow-red-600/30 transition-all">
          Seguir el estado <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function HistoryList({ calls, loading }: { calls: EmergencyCall[]; loading: boolean }) {
  if (loading) {
    return <div className="py-20 flex items-center justify-center"><Loader2 className="w-6 h-6 text-red-400 animate-spin" /></div>;
  }
  if (calls.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-3.5">
          <History className="w-7 h-7 text-white/20" />
        </div>
        <p className="text-white/40 text-sm">Todavía no reportaste ninguna emergencia</p>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-xl mx-auto space-y-3">
      {calls.map((c) => {
        const faction = FACTIONS.find((f) => f.id === c.faction);
        const Icon = faction?.icon || Shield;
        const priority = c.priority || 'Medium';
        const pStyle = PRIORITY_STYLE[priority];
        const stepIndex = c.status === 'Cancelled' ? -1 : STATUS_STEPS.indexOf(c.status);
        return (
          <div key={c.id} className="relative flex items-start gap-3.5 p-4 pl-5 rounded-xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${pStyle.dot}`} />
            <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-white/10 ${faction?.bg || 'bg-white/10'}`}>
              <Icon className={`w-[18px] h-4 ${faction?.text || 'text-white/60'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-white truncate">{TYPE_LABEL[c.type]}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 flex-shrink-0 ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
              </div>
              <div className="flex items-center gap-1 text-white/40 text-xs mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{c.location}</span>
              </div>

              {stepIndex >= 0 && (
                <div className="flex items-center gap-1 mt-2.5">
                  {STATUS_STEPS.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= stepIndex ? pStyle.dot : 'bg-white/10'}`} />
                      {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-[2px] rounded-full transition-colors ${i < stepIndex ? pStyle.dot : 'bg-white/10'}`} />}
                    </React.Fragment>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mt-2">
                <span className="text-white/25 text-[11px] font-mono">#{c.callNumber}</span>
                <span className="flex items-center gap-1 text-white/30 text-[11px]"><Clock className="w-3 h-3" /> {timeAgo(c.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

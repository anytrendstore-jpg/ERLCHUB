'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';

type CallType =
  | 'Traffic Stop' | 'Suspicious Activity' | 'Robbery' | 'Assault' | 'Shots Fired'
  | 'Welfare Check' | 'Disturbance' | 'Traffic Accident' | 'Cyber Crime' | 'Other';
type CallStatus = 'Pending' | 'En Route' | 'On Scene' | 'Resolved' | 'Cancelled';
type Faction = 'Policía' | 'Sheriff' | 'Bomberos';

interface EmergencyCall {
  id: string;
  callNumber: string;
  type: CallType;
  status: CallStatus;
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
  'Other': 'Otro',
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

const FACTIONS: { id: Faction; label: string; icon: React.ElementType; ring: string; bg: string; text: string }[] = [
  { id: 'Policía', label: 'Policía', icon: Shield, ring: 'ring-blue-400/50', bg: 'bg-blue-500/15', text: 'text-blue-300' },
  { id: 'Sheriff', label: 'Sheriff', icon: Star, ring: 'ring-amber-400/50', bg: 'bg-amber-500/15', text: 'text-amber-300' },
  { id: 'Bomberos', label: 'Bomberos', icon: Flame, ring: 'ring-orange-400/50', bg: 'bg-orange-500/15', text: 'text-orange-300' },
];

const TYPES_BY_FACTION: Record<Faction, CallType[]> = {
  'Policía': ['Robbery', 'Assault', 'Shots Fired', 'Suspicious Activity', 'Disturbance', 'Traffic Stop', 'Cyber Crime', 'Other'],
  'Sheriff': ['Robbery', 'Assault', 'Shots Fired', 'Suspicious Activity', 'Disturbance', 'Welfare Check', 'Other'],
  'Bomberos': ['Traffic Accident', 'Welfare Check', 'Other'],
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
  }, [faction]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const pendingCount = calls.filter((c) => c.status === 'Pending' || c.status === 'En Route').length;

  return (
    <div className="h-full flex flex-col bg-[#0a0508] text-white relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: 'radial-gradient(circle at 20% 0%, rgba(220,38,38,0.16), transparent 55%), radial-gradient(circle at 90% 100%, rgba(220,38,38,0.10), transparent 50%)' }}
      />

      {/* Header */}
      <div className="relative flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/40">
          <PhoneCall className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Central de Emergencias 911</h1>
          <p className="text-white/40 text-xs">Reporta incidentes a Policía, Sheriff o Bomberos</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LÍNEA ABIERTA
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex gap-1 px-6 pt-4">
        <button
          onClick={() => setTab('new')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === 'new' ? 'bg-white/[0.06] text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          <PhoneCall className="w-3.5 h-3.5" /> Nueva llamada
        </button>
        <button
          onClick={() => setTab('history')}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === 'history' ? 'bg-white/[0.06] text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          <History className="w-3.5 h-3.5" /> Mis llamadas
          {pendingCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_8px_-1px_rgba(220,38,38,0.7)]">{pendingCount}</span>
          )}
        </button>
      </div>

      <div className="relative flex-1 overflow-y-auto custom-scrollbar bg-white/[0.02]">
        {tab === 'new' ? (
          lastCall ? (
            <SuccessScreen call={lastCall} onNewCall={() => setLastCall(null)} />
          ) : (
            <form onSubmit={submit} className="p-6 max-w-xl mx-auto space-y-5">
              {/* Faction selector */}
              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wide block mb-2">¿A quién llamás?</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {FACTIONS.map((f) => {
                    const Icon = f.icon;
                    const isSelected = faction === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFaction(f.id)}
                        className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border transition-all duration-150 ${
                          isSelected ? `${f.bg} border-transparent ring-2 ${f.ring}` : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? f.text : 'text-white/50'}`} />
                        <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-white/50'}`}>{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wide block mb-2">Tipo de emergencia</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CallType)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-colors"
                >
                  {TYPES_BY_FACTION[faction].map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                </select>
              </div>

              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wide block mb-2">Ubicación</label>
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
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wide block mb-2">¿Qué está pasando?</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  placeholder="Describí la situación con el mayor detalle posible..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-colors"
                />
              </div>

              <label className="flex items-center gap-2.5 text-sm text-white/60 cursor-pointer select-none">
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="w-4 h-4 rounded accent-red-500" />
                <EyeOff className="w-3.5 h-3.5" /> Llamar de forma anónima
              </label>

              {error && (
                <p className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 disabled:opacity-50 text-white font-bold text-base tracking-wide shadow-lg shadow-red-600/40 transition-all duration-150 hover:-translate-y-px active:translate-y-0 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhoneCall className="w-5 h-5" />}
                {submitting ? 'Enviando...' : `Llamar a ${faction} ahora`}
              </button>
            </form>
          )
        ) : (
          <HistoryList calls={calls} loading={loadingHistory} />
        )}
      </div>
    </div>
  );
}

function SuccessScreen({ call, onNewCall }: { call: EmergencyCall; onNewCall: () => void }) {
  return (
    <div className="p-6 max-w-md mx-auto text-center py-16">
      <div className="w-20 h-20 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_-8px_rgba(16,185,129,0.4)]">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Llamada recibida</h2>
      <p className="text-white/50 text-sm mb-1">Un despachador de {call.faction} está viendo tu reporte.</p>
      <p className="text-white/30 text-xs mb-8">Folio #{call.callNumber}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={onNewCall} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors">
          Nueva llamada
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
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-3">
          <History className="w-6 h-6 text-white/20" />
        </div>
        <p className="text-white/40 text-sm">Todavía no reportaste ninguna emergencia</p>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-xl mx-auto space-y-2.5">
      {calls.map((c) => {
        const faction = FACTIONS.find((f) => f.id === c.faction);
        const Icon = faction?.icon || Shield;
        return (
          <div key={c.id} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${faction?.bg || 'bg-white/10'}`}>
              <Icon className={`w-4 h-4 ${faction?.text || 'text-white/60'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white truncate">{TYPE_LABEL[c.type]}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 flex-shrink-0 ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
              </div>
              <div className="flex items-center gap-1 text-white/40 text-xs mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{c.location}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <span className="text-white/25 text-[11px]">Folio #{c.callNumber}</span>
                <span className="flex items-center gap-1 text-white/30 text-[11px]"><Clock className="w-3 h-3" /> {timeAgo(c.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

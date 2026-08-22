'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Users, UserCheck, UserX, User as UserIcon, UserPlus, Sparkles } from 'lucide-react';

interface Contact { id: string; name: string; avatar?: string }
interface Invitation { connectionId: string; fromId: string; name: string; avatar?: string; message?: string; createdAt: string }
interface Recommendation { discordId: string; displayName: string; avatar?: string; headline: string; reason: string }

export default function NetworkTab({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const [connections, setConnections] = useState<Contact[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'connections' | 'invitations'>('connections');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [connRes, recRes] = await Promise.all([
        fetch('/api/hubcareer/connections', { cache: 'no-store' }),
        fetch('/api/hubcareer/recommendations', { cache: 'no-store' }),
      ]);
      const data = await connRes.json();
      if (data.success) { setConnections(data.connections); setInvitations(data.invitations); }
      const recData = await recRes.json();
      if (recData.success) setRecommendations(recData.recommendations);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const connect = async (userId: string) => {
    setRecommendations((prev) => prev.filter((r) => r.discordId !== userId));
    await fetch('/api/hubcareer/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toId: userId }) });
  };

  const respond = async (connectionId: string, action: 'accept' | 'decline') => {
    await fetch('/api/hubcareer/connections', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ connectionId, action }) });
    await load();
  };

  const removeConnection = async (userId: string) => {
    await fetch(`/api/hubcareer/connections?userId=${userId}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setTab('connections')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'connections' ? 'bg-sky-600 text-white' : 'bg-white/5 text-white/60'}`}>
          Mis contactos ({connections.length})
        </button>
        <button onClick={() => setTab('invitations')} className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'invitations' ? 'bg-sky-600 text-white' : 'bg-white/5 text-white/60'}`}>
          Invitaciones
          {invitations.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{invitations.length}</span>}
        </button>
      </div>

      {loading && <p className="text-white/30 text-sm text-center py-6">Cargando...</p>}

      {!loading && tab === 'connections' && (
        <div className="space-y-2">
          {connections.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <button onClick={() => onOpenProfile(c.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-10 h-10 rounded-full bg-sky-600/30 flex items-center justify-center flex-shrink-0"><UserIcon className="w-4 h-4 text-sky-300" /></div>
                <p className="text-sm font-medium truncate">{c.name}</p>
              </button>
              <button onClick={() => removeConnection(c.id)} className="text-white/30 hover:text-red-400 text-xs">Eliminar</button>
            </div>
          ))}
          {connections.length === 0 && <p className="text-white/30 text-sm text-center py-10 flex flex-col items-center gap-2"><Users className="w-8 h-8" /> Todavía no tienes contactos.</p>}
        </div>
      )}

      {!loading && tab === 'invitations' && (
        <div className="space-y-2">
          {invitations.map((inv) => (
            <div key={inv.connectionId} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <button onClick={() => onOpenProfile(inv.fromId)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-10 h-10 rounded-full bg-sky-600/30 flex items-center justify-center flex-shrink-0"><UserIcon className="w-4 h-4 text-sky-300" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inv.name}</p>
                  {inv.message && <p className="text-white/40 text-xs truncate">{inv.message}</p>}
                </div>
              </button>
              <button onClick={() => respond(inv.connectionId, 'accept')} className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300"><UserCheck className="w-4 h-4" /></button>
              <button onClick={() => respond(inv.connectionId, 'decline')} className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300"><UserX className="w-4 h-4" /></button>
            </div>
          ))}
          {invitations.length === 0 && <p className="text-white/30 text-sm text-center py-10">Sin invitaciones pendientes.</p>}
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-white/60 text-sm font-semibold flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-sky-400" /> Personas que quizás conozcas</h3>
          <div className="space-y-2">
            {recommendations.map((r) => (
              <div key={r.discordId} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <button onClick={() => onOpenProfile(r.discordId)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-10 h-10 rounded-full bg-sky-600/30 flex items-center justify-center flex-shrink-0"><UserIcon className="w-4 h-4 text-sky-300" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.displayName}</p>
                    <p className="text-white/40 text-[11px] truncate">{r.reason}</p>
                  </div>
                </button>
                <button onClick={() => connect(r.discordId)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold transition-colors flex-shrink-0">
                  <UserPlus className="w-3.5 h-3.5" /> Conectar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

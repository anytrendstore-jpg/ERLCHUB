'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Users, Check, X } from 'lucide-react';

interface CareerEvent {
  id: string; companyId: string; companyName: string; name: string; date: string; time?: string;
  location: string; description: string; attending: string[]; notAttending: string[]; isAttending: boolean; isNotAttending: boolean;
}

export default function EventsTab({ onOpenCompany }: { onOpenCompany: (id: string) => void }) {
  const [events, setEvents] = useState<CareerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hubcareer/events', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setEvents(data.events);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rsvp = async (eventId: string, attending: boolean) => {
    setEvents((prev) => prev.map((e) => e.id === eventId ? {
      ...e, isAttending: attending, isNotAttending: !attending,
      attending: attending ? [...e.attending, 'me'] : e.attending.filter((a) => a !== 'me'),
    } : e));
    await fetch('/api/hubcareer/events/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId, attending }) });
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Próximos eventos</h2>

      {loading && <p className="text-white/30 text-sm text-center py-6">Cargando...</p>}

      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <button onClick={() => onOpenCompany(e.companyId)} className="text-sky-400 text-xs hover:underline mb-1">{e.companyName}</button>
            <h3 className="font-semibold text-sm">{e.name}</h3>
            <div className="flex items-center gap-3 mt-2 text-white/40 text-xs">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {e.date}</span>
              {e.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.time}</span>}
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.location}</span>
            </div>
            <p className="text-white/60 text-xs mt-2">{e.description}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-white/40 text-[11px] flex items-center gap-1"><Users className="w-3 h-3" /> {e.attending.length} asistirán</span>
              <div className="flex gap-2">
                <button onClick={() => rsvp(e.id, true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${e.isAttending ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/15 text-white/70'}`}>
                  <Check className="w-3.5 h-3.5" /> Asistir
                </button>
                <button onClick={() => rsvp(e.id, false)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${e.isNotAttending ? 'bg-red-600 text-white' : 'bg-white/10 hover:bg-white/15 text-white/70'}`}>
                  <X className="w-3.5 h-3.5" /> No asistir
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && events.length === 0 && <p className="text-white/30 text-sm text-center py-10">No hay eventos próximos.</p>}
      </div>
    </div>
  );
}

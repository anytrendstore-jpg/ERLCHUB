'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Plus, MapPin } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/os/ui';
import type { SocialEvent } from './types';
import { formatEventDate } from './types';
import CreateEventModal from './CreateEventModal';

export default function EventsTab({ onOpenEvent }: { onOpenEvent: (eventId: string) => void }) {
  const [events, setEvents] = useState<SocialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/social/events', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setEvents(d.events); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-white text-xl font-bold">Eventos</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:shadow-[0_0_18px_-4px_rgba(217,70,239,0.5)] text-white text-xs font-semibold transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" /> Crear evento
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Todavía no hay eventos próximos" text="Creá el primer evento para la comunidad del servidor." />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => onOpenEvent(event.id)}
              className="hs-card hs-card-hover w-full flex items-center gap-4 p-4 rounded-2xl text-left"
            >
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-violet-600/20 flex-shrink-0">
                <span className="text-violet-300 text-[10px] font-semibold uppercase">{formatEventDate(event.date).split(' ')[1]}</span>
                <span className="text-white text-lg font-bold leading-none">{formatEventDate(event.date).split(' ')[0]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-sm truncate">{event.name}</p>
                <p className="text-white/40 text-xs flex items-center gap-1 truncate mt-0.5"><MapPin className="w-3 h-3 flex-shrink-0" /> {event.location}</p>
                <p className="text-white/30 text-[11px] mt-1">
                  {event.attendingCount} confirmado{event.attendingCount === 1 ? '' : 's'}
                  {event.myStatus === 'attending' && <span className="text-violet-400/80"> · Vas a asistir</span>}
                  {event.myStatus === 'interested' && <span className="text-violet-400/80"> · Te interesa</span>}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={(eventId) => { setShowCreate(false); onOpenEvent(eventId); }}
        />
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock, MapPin, Star, Check, X } from 'lucide-react';
import { EmptyState, Skeleton, useToast } from '@/components/os/ui';
import type { EventRsvpStatus, SocialEvent } from './types';
import { formatEventDate } from './types';

const RSVP_OPTIONS: { status: EventRsvpStatus; label: string; icon: typeof Star }[] = [
  { status: 'interested', label: 'Me interesa', icon: Star },
  { status: 'attending', label: 'Voy a asistir', icon: Check },
  { status: 'not_attending', label: 'No puedo ir', icon: X },
];

export default function EventDetail({ eventId, onBack, onOpenProfile }: {
  eventId: string;
  onBack: () => void;
  onOpenProfile: (discordId: string) => void;
}) {
  const toast = useToast();
  const [event, setEvent] = useState<SocialEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/social/events/${eventId}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setEvent(data.event);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const rsvp = async (status: EventRsvpStatus) => {
    if (!event) return;
    const next = event.myStatus === status ? null : status;
    setBusy(true);
    try {
      await fetch('/api/social/events/rsvp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId, status: next }),
      });
      if (next === 'attending') toast.success('Confirmaste tu asistencia');
      else if (next === 'interested') toast.success('Marcado como "me interesa"');
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-6 px-4 space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  if (!event) {
    return <EmptyState icon={CalendarDays} title="No se encontró el evento" />;
  }

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-3 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600/30 to-purple-700/30 relative flex items-center justify-center">
        {event.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <CalendarDays className="w-12 h-12 text-violet-300/50" />
        )}
      </div>

      <div className="mt-4">
        <h1 className="text-white text-xl font-bold">{event.name}</h1>
        <button onClick={() => onOpenProfile(event.organizerId)} className="text-white/40 text-xs mt-1 hover:text-violet-400 transition-colors">
          Organiza {event.organizerName}
        </button>

        <div className="mt-4 space-y-2 text-sm text-white/70">
          <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-violet-400 flex-shrink-0" /> {formatEventDate(event.date)}</p>
          {event.time && <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-violet-400 flex-shrink-0" /> {event.time}</p>}
          <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-violet-400 flex-shrink-0" /> {event.location}</p>
        </div>

        {event.description && <p className="text-white/60 text-sm mt-4 whitespace-pre-wrap leading-relaxed">{event.description}</p>}

        <div className="flex items-center gap-4 mt-4 text-sm">
          <span className="text-white"><b>{event.attendingCount}</b> <span className="text-white/50">van a asistir</span></span>
          <span className="text-white"><b>{event.interestedCount}</b> <span className="text-white/50">interesados</span></span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5">
          {RSVP_OPTIONS.map((opt) => {
            const active = event.myStatus === opt.status;
            return (
              <button
                key={opt.status}
                disabled={busy}
                onClick={() => rsvp(opt.status)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                  active ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <opt.icon className="w-4 h-4" /> {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

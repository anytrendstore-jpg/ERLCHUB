'use client';

import { useState } from 'react';
import { Modal, Button, useToast } from '@/components/os/ui';

const VIOLET_ACCENT = '#8b5cf6';

export default function CreateEventModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (eventId: string) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!name.trim() || !date || !location.trim()) {
      toast.error('Nombre, fecha y lugar son obligatorios');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/social/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), date, time: time || undefined, location: location.trim(), description: description.trim() || undefined, coverImage: coverImage.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.event.name} creado`);
        onCreated(data.event.id);
      } else {
        toast.error(data.error || 'No se pudo crear el evento');
      }
    } finally {
      setCreating(false);
    }
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50';

  return (
    <Modal title="Crear evento" description="Organizá un evento para la comunidad del servidor." onClose={onClose} size="md">
      <div className="space-y-3">
        <div>
          <label className="text-white/50 text-xs mb-1 block">Nombre *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Ej: Carrera de autos en Los Santos" className={inputClass} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-white/50 text-xs mb-1 block">Fecha *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
          </div>
          <div className="flex-1">
            <label className="text-white/50 text-xs mb-1 block">Hora</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
          </div>
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1 block">Lugar *</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} placeholder="Ej: Autopista de Los Santos" className={inputClass} />
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1 block">Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} placeholder="¿De qué se trata el evento?" className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1 block">URL de portada</label>
          <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." className={inputClass} />
        </div>
      </div>
      <Button onClick={submit} loading={creating} accent={VIOLET_ACCENT} className="w-full mt-4">
        Crear evento
      </Button>
    </Modal>
  );
}

'use client';

import { useState } from 'react';
import { Modal, Button, useToast } from '@/components/os/ui';
import ImageUploadButton from '@/components/ImageUploadButton';

const VIOLET_ACCENT = '#8b5cf6';

export default function CreateGroupModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (groupId: string) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/social/groups', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category: category.trim() || undefined, description: description.trim() || undefined, icon: icon.trim() || undefined, privacy }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.group.name} creado`);
        onCreated(data.group.id);
      } else {
        toast.error(data.error || 'No se pudo crear el grupo');
      }
    } finally {
      setCreating(false);
    }
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50';

  return (
    <Modal title="Crear grupo" description="Una comunidad temática dentro de HubSocial." onClose={onClose} size="md">
      <div className="space-y-3">
        <div>
          <label className="text-white/50 text-xs mb-1 block">Nombre *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Ej: Taxistas de Los Santos" className={inputClass} />
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1 block">Categoría</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={40} placeholder="Ej: Oficio, Hobby, Comunidad..." className={inputClass} />
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1 block">Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={3} placeholder="¿De qué se trata este grupo?" className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1 block">URL de ícono</label>
          <div className="flex items-center gap-2">
            <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="https://..." className={`flex-1 min-w-0 ${inputClass}`} />
            <ImageUploadButton aspect={1} shape="rect" onUploaded={setIcon} onError={toast.error} />
          </div>
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1 block">Privacidad</label>
          <select value={privacy} onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')} className={inputClass}>
            <option value="public">Público — cualquiera puede unirse y ver las publicaciones</option>
            <option value="private">Privado — hay que solicitar unirse, un admin aprueba</option>
          </select>
        </div>
      </div>
      <Button onClick={submit} loading={creating} accent={VIOLET_ACCENT} className="w-full mt-4">
        Crear grupo
      </Button>
    </Modal>
  );
}

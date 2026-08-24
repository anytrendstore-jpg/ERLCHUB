'use client';

import { useState } from 'react';
import { Modal, Button, useToast } from '@/components/os/ui';
import ImageUploadButton from '@/components/ImageUploadButton';

const VIOLET_ACCENT = '#8b5cf6';

export default function CreatePageModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (pageId: string) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [location, setLocation] = useState('');
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!name.trim() || !category.trim()) {
      toast.error('Nombre y categoría son obligatorios');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/social/pages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category: category.trim(), bio: bio.trim() || undefined, avatarUrl: avatarUrl.trim() || undefined, location: location.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.page.name} creada`);
        onCreated(data.page.id);
      } else {
        toast.error(data.error || 'No se pudo crear la página');
      }
    } finally {
      setCreating(false);
    }
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10';

  return (
    <Modal title="Crear página" description="Para una empresa, departamento u organización del servidor." onClose={onClose} size="md">
      <div className="space-y-3">
        <div>
          <label className="text-white/50 text-xs mb-1 block">Nombre *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Ej: LSPD - Los Santos Police Dept." className={inputClass} />
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1 block">Categoría *</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={40} placeholder="Ej: Departamento, Empresa, Restaurante..." className={inputClass} />
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1 block">Descripción</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3} placeholder="¿A qué se dedica?" className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1 block">URL de foto de perfil</label>
          <div className="flex items-center gap-2">
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className={`flex-1 min-w-0 ${inputClass}`} />
            <ImageUploadButton aspect={1} shape="rect" onUploaded={setAvatarUrl} onError={toast.error} />
          </div>
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1 block">Ubicación</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} placeholder="Ej: Los Santos" className={inputClass} />
        </div>
      </div>
      <Button onClick={submit} loading={creating} accent={VIOLET_ACCENT} className="w-full mt-4">
        Crear página
      </Button>
    </Modal>
  );
}

'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Modal, Button, useToast } from '@/components/os/ui';
import ImageUploadButton from '@/components/ImageUploadButton';
import type { Profile } from './types';

const VIOLET_ACCENT = '#8b5cf6';
const BIO_MAX = 160;

export default function EditProfileModal({ profile, onClose, onSaved }: {
  profile: Profile;
  onClose: () => void;
  onSaved: (patch: Partial<Profile>) => void;
}) {
  const toast = useToast();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [title, setTitle] = useState(profile.title || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [saving, setSaving] = useState(false);

  const previewAvatar = avatarUrl || profile.avatar;

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/social/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, avatarUrl, website, title }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Perfil actualizado');
        onSaved({ bio, avatarUrl: avatarUrl || undefined, website: website || undefined, title: title || undefined });
        onClose();
      } else {
        toast.error(data.error || 'No se pudo guardar');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Editar perfil" onClose={onClose} size="md">
      <div className="flex flex-col items-center mb-5">
        <div className="relative w-20 h-20">
          <div className="absolute -inset-1.5 rounded-full bg-[conic-gradient(from_0deg,#a78bfa,#d946ef,#67e8f9,#a78bfa)] opacity-50 blur-md" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewAvatar} alt="" className="relative w-20 h-20 rounded-full object-cover border-2 border-[#0a0a0f] shadow-xl" />
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-violet-300 text-xs font-semibold mt-2.5">Cambiar foto de perfil</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-white/50 text-xs mb-1 block">URL de foto de perfil</label>
          <div className="flex items-center gap-2">
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
            />
            <ImageUploadButton aspect={1} shape="circle" onUploaded={setAvatarUrl} onError={toast.error} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-white/50 text-xs">Título o cargo (aparece junto a tu nombre)</label>
            <span className={`text-[10px] ${title.length >= 50 ? 'text-amber-400' : 'text-white/30'}`}>{title.length}/50</span>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 50))}
            placeholder="Ej: CEO of ERLCᴴᵁᴮ"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-white/50 text-xs">Biografía</label>
            <span className={`text-[10px] ${bio.length >= BIO_MAX ? 'text-amber-400' : 'text-white/30'}`}>{bio.length}/{BIO_MAX}</span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            rows={3}
            placeholder="Contale algo de vos a la comunidad..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
          />
        </div>

        <div>
          <label className="text-white/50 text-xs mb-1 block">Sitio web o enlace</label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
          />
        </div>
      </div>

      <Button onClick={submit} loading={saving} accent={VIOLET_ACCENT} className="w-full mt-5">
        Guardar cambios
      </Button>
    </Modal>
  );
}

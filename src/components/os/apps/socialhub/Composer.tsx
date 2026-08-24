'use client';

import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { Profile } from './types';

export default function Composer({ me, onPublish, postingAs }: {
  me: Profile | null;
  onPublish: (text: string, imageUrl?: string) => Promise<void> | void;
  /** Si se pasa, el composer publica con esta identidad (una página) en vez de la del jugador. */
  postingAs?: { name: string; avatarUrl?: string };
}) {
  const [draftText, setDraftText] = useState('');
  const [draftImage, setDraftImage] = useState('');
  const [showImageField, setShowImageField] = useState(false);
  const [posting, setPosting] = useState(false);

  const publish = async () => {
    if (!draftText.trim() && !draftImage.trim()) return;
    setPosting(true);
    try {
      await onPublish(draftText.trim(), draftImage.trim() || undefined);
      setDraftText('');
      setDraftImage('');
      setShowImageField(false);
    } finally {
      setPosting(false);
    }
  };

  const avatar = postingAs ? postingAs.avatarUrl : (me?.avatarUrl || me?.avatar);
  const name = postingAs ? postingAs.name : me?.displayName;

  return (
    <div className="hs-card rounded-2xl p-4 mb-6">
      <div className="flex items-start gap-3">
        {(me || postingAs) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0 ring-1 ring-white/10" />
        )}
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder={name ? `¿Qué estás pensando, ${name}?` : '¿Qué está pasando en ERLC?'}
          maxLength={500}
          rows={2}
          className="w-full bg-transparent text-white placeholder-white/30 text-sm resize-none focus:outline-none pt-2"
        />
      </div>
      {showImageField && (
        <input
          type="text"
          value={draftImage}
          onChange={(e) => setDraftImage(e.target.value)}
          placeholder="URL de imagen..."
          className="w-full mt-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all"
        />
      )}
      {draftImage && (
        <div className="mt-2 rounded-xl overflow-hidden border border-white/10 max-h-48 shadow-lg shadow-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={draftImage} alt="preview" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
        <button
          onClick={() => setShowImageField((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${showImageField ? 'bg-violet-600/15 text-violet-300' : 'text-white/50 hover:bg-white/5 hover:text-white/70'}`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Foto/Video
        </button>
        <button
          onClick={publish}
          disabled={posting || (!draftText.trim() && !draftImage.trim())}
          className="px-5 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:shadow-[0_0_20px_-4px_rgba(217,70,239,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none text-white text-sm font-semibold transition-all duration-200"
        >
          Publicar
        </button>
      </div>
    </div>
  );
}

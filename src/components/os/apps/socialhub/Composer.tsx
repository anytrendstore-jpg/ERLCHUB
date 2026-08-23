'use client';

import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { Profile } from './types';

export default function Composer({ me, onPublish }: {
  me: Profile | null;
  onPublish: (text: string, imageUrl?: string) => Promise<void> | void;
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

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
      <div className="flex items-start gap-3">
        {me && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.avatarUrl || me.avatar} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
        )}
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder={me ? `¿Qué estás pensando, ${me.displayName}?` : '¿Qué está pasando en ERLC?'}
          maxLength={500}
          rows={2}
          className="w-full bg-transparent text-white placeholder-white/30 text-sm resize-none focus:outline-none pt-1.5"
        />
      </div>
      {showImageField && (
        <input
          type="text"
          value={draftImage}
          onChange={(e) => setDraftImage(e.target.value)}
          placeholder="URL de imagen..."
          className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
        />
      )}
      {draftImage && (
        <div className="mt-2 rounded-xl overflow-hidden border border-white/10 max-h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={draftImage} alt="preview" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => setShowImageField((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${showImageField ? 'bg-violet-600/20 text-violet-400' : 'text-white/50 hover:bg-white/5'}`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Foto/Video
        </button>
        <button
          onClick={publish}
          disabled={posting || (!draftText.trim() && !draftImage.trim())}
          className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-opacity"
        >
          Publicar
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Type, Image as ImageIcon } from 'lucide-react';
import { Modal, Button } from '@/components/os/ui';

const VIOLET_ACCENT = '#8b5cf6';

export default function AddStoryModal({ onClose, onPublish }: {
  onClose: () => void;
  onPublish: (type: 'text' | 'image', content: string) => Promise<void> | void;
}) {
  const [storyType, setStoryType] = useState<'text' | 'image'>('text');
  const [storyContent, setStoryContent] = useState('');
  const [publishing, setPublishing] = useState(false);

  const submit = async () => {
    if (!storyContent.trim()) return;
    setPublishing(true);
    try {
      await onPublish(storyType, storyContent.trim());
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal title="Nueva historia" onClose={onClose} size="sm">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setStoryType('text')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-colors ${storyType === 'text' ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/60'}`}
        >
          <Type className="w-3.5 h-3.5" /> Texto
        </button>
        <button
          onClick={() => setStoryType('image')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-colors ${storyType === 'image' ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/60'}`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Imagen
        </button>
      </div>
      {storyType === 'text' ? (
        <textarea
          value={storyContent}
          onChange={(e) => setStoryContent(e.target.value)}
          placeholder="Escribe algo..."
          rows={3}
          maxLength={200}
          className="w-full bg-gradient-to-br from-purple-600 to-violet-700 rounded-lg px-3 py-3 text-sm text-white placeholder-white/60 resize-none focus:outline-none"
        />
      ) : (
        <input
          value={storyContent}
          onChange={(e) => setStoryContent(e.target.value)}
          placeholder="URL de la imagen..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
        />
      )}
      <p className="text-white/30 text-[10px] mt-2">Desaparece automáticamente en 24 horas.</p>
      <Button
        onClick={submit}
        disabled={!storyContent.trim()}
        loading={publishing}
        accent={VIOLET_ACCENT}
        className="w-full mt-3 rounded-lg"
      >
        Publicar historia
      </Button>
    </Modal>
  );
}

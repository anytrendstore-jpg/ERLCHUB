'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/os/ui';

const REASONS = ['Spam', 'Acoso', 'Contenido inapropiado', 'Suplantación', 'Fraude', 'Otro'];
const VIOLET_ACCENT = '#8b5cf6';

export default function ReportModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');

  const finalReason = reason === 'Otro' ? custom.trim() : reason;

  return (
    <Modal title="Reportar publicación" description="Tu reporte llega directo al equipo de moderación." onClose={onClose} size="sm">
      <div className="space-y-1.5">
        {REASONS.map((r) => (
          <button
            key={r}
            onClick={() => setReason(r)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${reason === r ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'text-white/70 hover:bg-white/5 border border-transparent'}`}
          >
            {r}
          </button>
        ))}
        {reason === 'Otro' && (
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Cuéntanos qué pasó..."
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
          />
        )}
      </div>
      <Button
        onClick={() => finalReason && onSubmit(finalReason)}
        disabled={!finalReason}
        accent={VIOLET_ACCENT}
        className="w-full mt-4"
      >
        Enviar reporte
      </Button>
    </Modal>
  );
}

'use client';

import React, { useState } from 'react';
import { X, Flag } from 'lucide-react';
import type { ReportTargetType } from '@/lib/hubCareerServer';

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReportModal({ targetType, targetId, targetLabel, onClose, onSubmitted }: Props) {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/hubcareer/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, targetLabel, reason }),
      });
      const data = await res.json();
      if (data.success) onSubmitted();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2500] p-4" onClick={onClose}>
      <div className="bg-[#0f2536] rounded-xl w-full max-w-sm border border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2"><Flag className="w-4 h-4 text-red-400" /> Reportar</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
        </div>
        <p className="text-white/50 text-xs mb-3">{targetLabel}</p>
        <textarea
          value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Describe el motivo del reporte..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none resize-none"
        />
        <button
          onClick={submit} disabled={sending || !reason.trim()}
          className="w-full mt-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
        >
          {sending ? 'Enviando...' : 'Enviar reporte'}
        </button>
      </div>
    </div>
  );
}

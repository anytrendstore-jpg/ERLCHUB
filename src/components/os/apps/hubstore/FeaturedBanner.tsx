'use client';

import { AppIcon } from '@/components/icons/AppIcons';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useCardTilt } from '@/hooks/useCardTilt';
import type { OSApp } from '@/lib/osTypes';

export default function FeaturedBanner({ app, installed, onSelect }: {
  app: OSApp;
  installed: boolean;
  onSelect: () => void;
}) {
  const tilt = useCardTilt<HTMLButtonElement>();

  return (
    <button
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      onClick={onSelect}
      style={{ transform: 'rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))' }}
      className="group relative w-full text-left rounded-2xl overflow-hidden border border-amber-500/20 [transform-style:preserve-3d] transition-transform duration-300 mb-5"
    >
      <div className="relative bg-gradient-to-br from-amber-500/15 via-[#12121c] to-[#0d0d14] p-6 flex items-center gap-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'radial-gradient(500px circle at var(--glow-x,50%) var(--glow-y,50%), rgba(245,158,11,0.1), transparent 60%)' }}
        />
        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 relative">
          <AppIcon appId={app.id} size={36} />
        </div>
        <div className="min-w-0 flex-1 relative">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
            <Sparkles className="w-3 h-3" /> Destacada
          </span>
          <h3 className="text-white font-bold text-lg truncate">{app.name}</h3>
          <p className="text-white/50 text-sm line-clamp-1 mt-0.5">{app.description}</p>
        </div>
        <div className="flex-shrink-0 relative flex items-center gap-2 text-white/70 text-sm font-medium group-hover:text-white transition-colors">
          {installed ? 'Ver' : 'Obtener'} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}

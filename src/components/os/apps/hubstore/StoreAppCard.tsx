'use client';

import { AppIcon } from '@/components/icons/AppIcons';
import { Check, Clock } from 'lucide-react';
import type { OSApp } from '@/lib/osTypes';
import InstallButton from './InstallButton';

const ACCENT = '#8b5cf6';

/** Tarjeta de catálogo — icono + nombre + descripción + píldora de acción, layout horizontal como el mockup de referencia. */
export default function StoreAppCard({ app, installed, onOpen, onInstall, onBuy }: {
  app: OSApp;
  installed: boolean;
  onOpen: () => void;
  onInstall: () => Promise<boolean>;
  onBuy: () => Promise<boolean>;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className="group flex-shrink-0 w-48 flex flex-col items-start gap-2.5 p-4 rounded-2xl border text-left transition-all duration-200 bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20 hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
        <AppIcon appId={app.id} size={30} />
      </div>
      <div className="min-w-0 w-full">
        <p className="text-white font-semibold text-sm truncate">{app.name}</p>
        <p className="text-white/40 text-xs line-clamp-2 mt-0.5 min-h-[2em]">{app.description}</p>
      </div>
      <div className="w-full">
        {app.comingSoon ? (
          <span className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs font-semibold flex items-center gap-1.5 w-fit">
            <Clock className="w-3 h-3" /> Próximamente
          </span>
        ) : installed ? (
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 w-fit" style={{ background: `${ACCENT}25`, color: ACCENT }}>
            <Check className="w-3 h-3" /> Instalada
          </span>
        ) : (
          <InstallButton compact accent={ACCENT} price={app.priceHubCoins} onInstall={app.priceHubCoins ? onBuy : onInstall} />
        )}
      </div>
    </div>
  );
}

'use client';

import { AppIcon } from '@/components/icons/AppIcons';
import { Check, Coins } from 'lucide-react';
import type { OSApp } from '@/lib/osTypes';

export default function AppCard({ app, categoryLabel, installed, active, onClick }: {
  app: OSApp;
  categoryLabel: string;
  installed: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-start gap-2.5 p-4 rounded-2xl border text-left transition-all duration-200 ${
        active ? 'bg-amber-500/10 border-amber-500/40' : 'bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20 hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
          <AppIcon appId={app.id} size={28} />
        </div>
        {installed && (
          <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
            <Check className="w-3.5 h-3.5" /> Instalada
          </span>
        )}
      </div>
      <div className="min-w-0 w-full">
        <p className="text-white font-semibold text-sm truncate">{app.name}</p>
        <p className="text-white/40 text-xs line-clamp-2 mt-0.5">{app.description}</p>
      </div>
      <div className="flex items-center gap-2 w-full">
        <span className="text-white/30 text-[10px] uppercase tracking-wider font-medium">{categoryLabel}</span>
        {app.priceHubCoins && !installed && (
          <span className="ml-auto flex items-center gap-1 text-amber-400 text-[10px] font-semibold">
            <Coins className="w-3 h-3" /> {app.priceHubCoins}
          </span>
        )}
      </div>
    </button>
  );
}

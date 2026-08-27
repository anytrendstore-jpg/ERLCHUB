'use client';

import { AppIcon } from '@/components/icons/AppIcons';
import type { OSApp } from '@/lib/osTypes';

/** "Mis aplicaciones" del riel derecho — instaladas reales, sin estado de "actualización" inventado (no hay versionado de apps todavía). */
export default function MyAppsPanel({ apps, onOpen, onSeeAll }: { apps: OSApp[]; onOpen: (app: OSApp) => void; onSeeAll: () => void }) {
  const shown = apps.slice(0, 5);

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Mis aplicaciones</h3>
        <button onClick={onSeeAll} className="text-violet-400 text-xs font-medium hover:text-violet-300">Ver todas</button>
      </div>
      {shown.length === 0 ? (
        <p className="text-white/30 text-xs py-2">Todavía no instalaste ninguna app.</p>
      ) : (
        <div className="space-y-2.5">
          {shown.map((app) => (
            <div key={app.id} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <AppIcon appId={app.id} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-medium truncate">{app.name}</p>
                <p className="text-white/30 text-[10px]">Instalada</p>
              </div>
              <button onClick={() => onOpen(app)} className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[11px] font-medium flex-shrink-0">
                Abrir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

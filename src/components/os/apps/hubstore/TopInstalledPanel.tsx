'use client';

import { AppIcon } from '@/components/icons/AppIcons';
import { Flame } from 'lucide-react';
import type { OSApp } from '@/lib/osTypes';

interface RankedApp { app: OSApp; count: number }

/** "Más instaladas" — ranking real por cantidad de instalaciones en toda la comunidad (GET /api/os/apps/top), no un puntaje de reseñas inventado. */
export default function TopInstalledPanel({ ranked }: { ranked: RankedApp[] | null }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Flame className="w-4 h-4 text-orange-400" />
        <h3 className="text-white font-semibold text-sm">Más instaladas</h3>
      </div>
      {ranked === null ? (
        <p className="text-white/30 text-xs py-2">Cargando...</p>
      ) : ranked.length === 0 ? (
        <p className="text-white/30 text-xs py-2">Todavía no hay suficientes instalaciones para armar un ranking.</p>
      ) : (
        <div className="space-y-2.5">
          {ranked.map(({ app, count }, i) => (
            <div key={app.id} className="flex items-center gap-2.5">
              <span className="text-white/30 text-xs font-bold w-3 flex-shrink-0">{i + 1}</span>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <AppIcon appId={app.id} size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-medium truncate">{app.name}</p>
                <p className="text-white/30 text-[10px]">{count} {count === 1 ? 'instalación' : 'instalaciones'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

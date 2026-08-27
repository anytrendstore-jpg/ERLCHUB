'use client';

import { AppIcon } from '@/components/icons/AppIcons';
import type { OSApp } from '@/lib/osTypes';

/** Banner principal — decorativo, arma la grilla de íconos con apps reales del catálogo en vez de una ilustración inventada. */
export default function StoreHero({ apps, onExplore }: { apps: OSApp[]; onExplore: () => void }) {
  const gridApps = apps.slice(0, 9);

  return (
    <div className="relative rounded-2xl overflow-hidden mb-5 bg-gradient-to-br from-violet-900/40 via-[#14101f] to-[#0d0d14] border border-violet-500/20">
      <div className="relative flex items-center gap-6 p-7">
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-extrabold text-3xl leading-tight">
            Más posibilidades<br /><span className="text-violet-400">para tu ciudad.</span>
          </h1>
          <p className="text-white/50 text-sm mt-3 max-w-xs">
            Descubre, instala y vive una experiencia completamente nueva con HubStore.
          </p>
          <button
            onClick={onExplore}
            className="mt-5 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            Explorar apps
          </button>
        </div>

        <div className="hidden md:grid grid-cols-3 gap-3 flex-shrink-0">
          {gridApps.map((app) => (
            <div key={app.id} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <AppIcon appId={app.id} size={28} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

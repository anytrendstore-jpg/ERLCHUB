'use client';

import type { OSApp } from '@/lib/osTypes';
import StoreAppCard from './StoreAppCard';

/** Fila horizontal con scroll propio — mismo patrón para "Destacadas" y "Explorar más". */
export default function AppRow({ title, apps, isAppInstalled, onOpen, onInstall, onBuy }: {
  title: string;
  apps: OSApp[];
  isAppInstalled: (id: string) => boolean;
  onOpen: (app: OSApp) => void;
  onInstall: (id: string) => Promise<boolean>;
  onBuy: (id: string) => Promise<boolean>;
}) {
  if (apps.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-lg">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 -mx-1 px-1">
        {apps.map((app) => (
          <StoreAppCard
            key={app.id}
            app={app}
            installed={isAppInstalled(app.id)}
            onOpen={() => onOpen(app)}
            onInstall={() => onInstall(app.id)}
            onBuy={() => onBuy(app.id)}
          />
        ))}
      </div>
    </div>
  );
}

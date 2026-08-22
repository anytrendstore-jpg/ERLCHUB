'use client';

import React, { useState } from 'react';
import { useOS } from '@/contexts/OSContext';
import { AppIcon } from '@/components/icons/AppIcons';
import { Search, Download, Trash2, ExternalLink, Check, Clock, LayoutGrid, Pin, PinOff } from 'lucide-react';
import type { OSApp } from '@/lib/osTypes';
import { useToast } from '@/components/os/ui';

const CATEGORY_LABELS: Record<OSApp['category'], string> = {
  finance: 'Finanzas',
  roleplay: 'Roleplay',
  social: 'Social',
  system: 'Sistema',
  market: 'Mercado',
  police: 'Policía',
};

const CATEGORIES: (OSApp['category'] | 'todas')[] = ['todas', 'finance', 'market', 'social', 'police', 'system', 'roleplay'];

export default function HubStoreApp() {
  const toast = useToast();
  const { apps, isAppInstalled, installApp, uninstallApp, isAppPinned, togglePinnedApp, openApp } = useOS();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<OSApp['category'] | 'todas'>('todas');
  const [selected, setSelected] = useState<OSApp | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const available = apps.filter((a) => a.id !== 'hubstore' && !a.comingSoon);
  const comingSoon = apps.filter((a) => a.comingSoon);

  const filtered = available.filter((a) =>
    (category === 'todas' || a.category === category) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleInstall = async (app: OSApp) => {
    setBusyId(app.id);
    const ok = await installApp(app.id);
    setBusyId(null);
    if (ok) toast.success(`${app.name} instalada`); else toast.error('No se pudo instalar');
  };

  const handleUninstall = async (app: OSApp) => {
    setBusyId(app.id);
    const ok = await uninstallApp(app.id);
    setBusyId(null);
    if (ok) toast.success(`${app.name} desinstalada`); else toast.error('No se pudo desinstalar');
  };

  return (
    <div className="relative h-full flex flex-col bg-[#0d0d14] text-white text-sm">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-orange-900/30 to-[#0d0d14] flex-shrink-0">
        <div className="flex items-center gap-2">
          <AppIcon appId="hubstore" size={28} />
          <span className="text-white font-bold text-xl">Hub Store</span>
        </div>
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar aplicaciones..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/5 overflow-x-auto flex-shrink-0">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${category === c ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            {c === 'todas' ? 'Todas' : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>


      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-white/30 gap-2">
              <LayoutGrid className="w-8 h-8" />
              <p>Sin resultados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((app) => {
                const installed = isAppInstalled(app.id);
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelected(app)}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-colors ${selected?.id === app.id ? 'bg-orange-500/10 border-orange-500/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <AppIcon appId={app.id} size={26} />
                      </div>
                      {installed && (
                        <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                          <Check className="w-3.5 h-3.5" /> Instalada
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 w-full">
                      <p className="text-white font-medium text-sm truncate">{app.name}</p>
                      <p className="text-white/40 text-xs line-clamp-2">{app.description}</p>
                    </div>
                    <span className="text-white/30 text-[10px] uppercase tracking-wide">{CATEGORY_LABELS[app.category]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {comingSoon.length > 0 && category === 'todas' && !search && (
            <div className="mt-6">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Próximamente</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {comingSoon.map((app) => (
                  <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 opacity-50">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <AppIcon appId={app.id} size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{app.name}</p>
                      <p className="text-white/40 text-xs truncate">{app.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 border-l border-white/10 bg-[#151520] flex-shrink-0 overflow-y-auto custom-scrollbar p-5">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <AppIcon appId={selected.id} size={36} />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">{selected.name}</h3>
            <p className="text-white/30 text-xs uppercase tracking-wide mb-3">{CATEGORY_LABELS[selected.category]}</p>
            <p className="text-white/60 text-sm mb-5">{selected.description}</p>

            {isAppInstalled(selected.id) ? (
              <div className="space-y-2">
                <button
                  onClick={() => openApp(selected.id)}
                  className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Abrir
                </button>
                <button
                  onClick={() => togglePinnedApp(selected.id)}
                  className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isAppPinned(selected.id) ? <><PinOff className="w-4 h-4" /> Desanclar de la barra de tareas</> : <><Pin className="w-4 h-4" /> Anclar a la barra de tareas</>}
                </button>
                {selected.id !== 'hubstore' && (
                  <button
                    onClick={() => handleUninstall(selected)}
                    disabled={busyId === selected.id}
                    className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/50 hover:text-red-400 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" /> {busyId === selected.id ? 'Desinstalando...' : 'Desinstalar'}
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleInstall(selected)}
                disabled={busyId === selected.id}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> {busyId === selected.id ? 'Instalando...' : 'Obtener · Gratis'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

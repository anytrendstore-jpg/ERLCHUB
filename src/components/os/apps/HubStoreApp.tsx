'use client';

import React, { useEffect, useState } from 'react';
import { useOS } from '@/contexts/OSContext';
import { AppIcon } from '@/components/icons/AppIcons';
import { Search, Trash2, ExternalLink, Clock, LayoutGrid, Pin, PinOff, HelpCircle, Coins } from 'lucide-react';
import type { OSApp } from '@/lib/osTypes';
import { useToast } from '@/components/os/ui';
import InstallButton from './hubstore/InstallButton';
import AppCard from './hubstore/AppCard';
import FeaturedBanner from './hubstore/FeaturedBanner';
import TutorialModal, { hasSeenTutorial } from '@/components/os/TutorialModal';

const STORE_ACCENT = '#f59e0b';
const FEATURED_APP_ID = 'socialhub';

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
  const { apps, isAppInstalled, installApp, buyApp, uninstallApp, isAppPinned, togglePinnedApp, openApp, preferences, preferencesLoaded } = useOS();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<OSApp['category'] | 'todas'>('todas');
  const [selected, setSelected] = useState<OSApp | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStart, setTutorialStart] = useState(0);
  const [coins, setCoins] = useState<number | null>(null);

  const refreshCoins = () => {
    fetch('/api/os/apps', { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (d.success) setCoins(d.hubCoinsBalance ?? 0); });
  };
  useEffect(() => { refreshCoins(); }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    // Solo se ofrece sola una vez, y nunca compite con el tour general del OS al primer login.
    if (preferences.onboarding.completed && !hasSeenTutorial()) {
      setTutorialStart(0);
      setTutorialOpen(true);
    }
  }, [preferencesLoaded, preferences.onboarding.completed]);

  const available = apps.filter((a) => a.id !== 'hubstore' && !a.comingSoon);
  const comingSoon = apps.filter((a) => a.comingSoon);
  const featured = available.find((a) => a.id === FEATURED_APP_ID);

  const filtered = available.filter((a) =>
    (category === 'todas' || a.category === category) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUninstall = async (app: OSApp) => {
    setBusyId(app.id);
    const ok = await uninstallApp(app.id);
    setBusyId(null);
    if (ok) toast.success(`${app.name} desinstalada`); else toast.error('No se pudo desinstalar');
  };

  return (
    <div className="relative h-full flex flex-col bg-[#0d0d14] text-white text-sm">
      <div className="flex items-center gap-4 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-amber-900/25 to-[#0d0d14] flex-shrink-0">
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
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
        {coins !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold flex-shrink-0">
            <Coins className="w-4 h-4" /> {coins.toLocaleString('es-ES')}
          </div>
        )}
        <button
          onClick={() => { setTutorialStart(0); setTutorialOpen(true); }}
          title="Cómo funciona Hub Store"
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors flex-shrink-0"
        >
          <HelpCircle className="w-4 h-4" /> Cómo funciona
        </button>
      </div>

      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/5 overflow-x-auto flex-shrink-0">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${category === c ? 'bg-amber-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            {c === 'todas' ? 'Todas' : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {featured && category === 'todas' && !search && (
            <FeaturedBanner app={featured} installed={isAppInstalled(featured.id)} onSelect={() => setSelected(featured)} />
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-white/30 gap-2">
              <LayoutGrid className="w-8 h-8" />
              <p>Sin resultados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  categoryLabel={CATEGORY_LABELS[app.category]}
                  installed={isAppInstalled(app.id)}
                  active={selected?.id === app.id}
                  onClick={() => setSelected(app)}
                />
              ))}
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

        {selected && (
          <div className="w-72 border-l border-white/10 bg-[#151520] flex-shrink-0 overflow-y-auto custom-scrollbar p-5 animate-in slide-in-from-right-4 fade-in duration-200">
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
                  className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02]"
                  style={{ background: STORE_ACCENT }}
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
            ) : selected.priceHubCoins ? (
              <InstallButton
                accent={STORE_ACCENT}
                price={selected.priceHubCoins}
                onInstall={async () => {
                  const result = await buyApp(selected.id);
                  if (result.ok) { refreshCoins(); toast.success(`${selected.name} instalada`); }
                  else toast.error(result.error === 'Saldo de HubCoins insuficiente' ? `Saldo insuficiente — te faltan ${selected.priceHubCoins! - (result.balance ?? 0)} HubCoins` : (result.error || 'No se pudo completar la compra'));
                  return result.ok;
                }}
              />
            ) : (
              <InstallButton accent={STORE_ACCENT} onInstall={() => installApp(selected.id)} />
            )}
          </div>
        )}
      </div>

      {tutorialOpen && <TutorialModal startAt={tutorialStart} onClose={() => setTutorialOpen(false)} />}
    </div>
  );
}

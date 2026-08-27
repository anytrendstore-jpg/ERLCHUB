'use client';

import { useEffect, useState } from 'react';
import { useOS } from '@/contexts/OSContext';
import { AppIcon } from '@/components/icons/AppIcons';
import { Search, Trash2, ExternalLink, Clock, Pin, PinOff, HelpCircle, Coins, X, BadgeCheck } from 'lucide-react';
import type { OSApp } from '@/lib/osTypes';
import { useToast } from '@/components/os/ui';
import InstallButton from './hubstore/InstallButton';
import AppRow from './hubstore/AppRow';
import StoreAppCard from './hubstore/StoreAppCard';
import StoreHero from './hubstore/StoreHero';
import StoreSidebar, { type StoreSection } from './hubstore/StoreSidebar';
import MyAppsPanel from './hubstore/MyAppsPanel';
import TopInstalledPanel from './hubstore/TopInstalledPanel';
import TutorialModal, { hasSeenTutorial } from '@/components/os/TutorialModal';

const STORE_ACCENT = '#8b5cf6';

const CATEGORY_LABELS: Record<OSApp['category'], string> = {
  finance: 'Finanzas', roleplay: 'Roleplay', social: 'Social', system: 'Sistema', market: 'Mercado', police: 'Policía',
};

interface RankedApp { app: OSApp; count: number }

export default function HubStoreApp() {
  const toast = useToast();
  const { apps, user, isAppInstalled, installApp, buyApp, uninstallApp, isAppPinned, togglePinnedApp, openApp, preferences, preferencesLoaded } = useOS();
  const [search, setSearch] = useState('');
  const [section, setSection] = useState<StoreSection>('inicio');
  const [category, setCategory] = useState<OSApp['category'] | 'todas'>('todas');
  const [selected, setSelected] = useState<OSApp | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStart, setTutorialStart] = useState(0);
  const [coins, setCoins] = useState<number | null>(null);
  const [ranking, setRanking] = useState<RankedApp[] | null>(null);

  const refreshCoins = () => {
    fetch('/api/os/apps', { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (d.success) setCoins(d.hubCoinsBalance ?? 0); });
  };
  useEffect(() => { refreshCoins(); }, []);

  useEffect(() => {
    fetch('/api/os/apps/top', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
      if (d.success) {
        const rows: RankedApp[] = d.ranking
          .map((r: { appId: string; count: number }) => ({ app: apps.find((a) => a.id === r.appId), count: r.count }))
          .filter((r: { app?: OSApp }) => r.app);
        setRanking(rows);
      } else setRanking([]);
    }).catch(() => setRanking([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    if (preferences.onboarding.completed && !hasSeenTutorial()) {
      setTutorialStart(0);
      setTutorialOpen(true);
    }
  }, [preferencesLoaded, preferences.onboarding.completed]);

  const available = apps.filter((a) => a.id !== 'hubstore' && !a.comingSoon);
  const comingSoon = apps.filter((a) => a.comingSoon);
  const installedList = apps.filter((a) => a.id !== 'hubstore' && isAppInstalled(a.id));
  const premiumApps = available.filter((a) => a.priceHubCoins);
  const freeApps = available.filter((a) => !a.priceHubCoins);
  const rankedApps = (ranking || []).map((r) => r.app);
  const otherApps = available.filter((a) => !rankedApps.some((r) => r.id === a.id));

  const searchFiltered = (list: OSApp[]) =>
    list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()));

  const exploreFiltered = searchFiltered(available.filter((a) => category === 'todas' || a.category === category));

  const handleUninstall = async (app: OSApp) => {
    setBusyId(app.id);
    const ok = await uninstallApp(app.id);
    setBusyId(null);
    if (ok) toast.success(`${app.name} desinstalada`); else toast.error('No se pudo desinstalar');
  };

  const handleInstall = async (id: string) => {
    const ok = await installApp(id);
    if (ok) { const app = apps.find((a) => a.id === id); toast.success(`${app?.name} instalada`); }
    return ok;
  };

  const handleBuy = async (id: string) => {
    const app = apps.find((a) => a.id === id);
    const result = await buyApp(id);
    if (result.ok) { refreshCoins(); toast.success(`${app?.name} instalada`); }
    else toast.error(result.error === 'Saldo de HubCoins insuficiente' ? `Saldo insuficiente — te faltan ${(app?.priceHubCoins || 0) - (result.balance ?? 0)} HubCoins` : (result.error || 'No se pudo completar la compra'));
    return result.ok;
  };

  return (
    <div className="relative h-full flex flex-col bg-[#0d0d14] text-white text-sm">
      <div className="flex items-center gap-4 px-5 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <AppIcon appId="hubstore" size={26} />
          <span className="text-white font-bold text-lg">HubStore</span>
        </div>
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (e.target.value) setSection('explorar'); }}
            placeholder="Buscar aplicaciones, categorías..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        {coins !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-semibold flex-shrink-0">
            <Coins className="w-4 h-4" /> {coins.toLocaleString('es-ES')}
          </div>
        )}
        <button
          onClick={() => { setTutorialStart(0); setTutorialOpen(true); }}
          title="Cómo funciona HubStore"
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors flex-shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        {user && (
          <div className="flex items-center gap-2 flex-shrink-0 pl-2 border-l border-white/10">
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            <div className="hidden lg:block">
              <p className="text-white text-xs font-semibold leading-tight">{user.displayName}</p>
              <p className="text-white/40 text-[10px] flex items-center gap-0.5"><BadgeCheck className="w-2.5 h-2.5" /> Cuenta verificada</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <StoreSidebar section={section} onSection={(s) => { setSection(s); setSearch(''); }} category={category} onCategory={setCategory} />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 min-w-0">
          {section === 'inicio' && (
            <>
              <StoreHero apps={available} onExplore={() => setSection('explorar')} />
              <AppRow title="Aplicaciones destacadas" apps={rankedApps.slice(0, 6).length ? rankedApps.slice(0, 6) : available.slice(0, 6)} isAppInstalled={isAppInstalled} onOpen={setSelected} onInstall={handleInstall} onBuy={handleBuy} />
              <AppRow title="Explorar más" apps={otherApps.slice(0, 8)} isAppInstalled={isAppInstalled} onOpen={setSelected} onInstall={handleInstall} onBuy={handleBuy} />
              {comingSoon.length > 0 && (
                <div className="mt-2">
                  <h2 className="text-white font-bold text-lg mb-3">Próximamente</h2>
                  <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                    {comingSoon.map((app) => (
                      <div key={app.id} className="flex-shrink-0 w-48 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 opacity-50">
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
            </>
          )}

          {section === 'explorar' && (
            <>
              <h2 className="text-white font-bold text-xl mb-4">{category === 'todas' ? 'Explorar' : CATEGORY_LABELS[category]}</h2>
              {exploreFiltered.length === 0 ? (
                <EmptyState text="Sin resultados." />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {exploreFiltered.map((app) => (
                    <StoreAppCard key={app.id} app={app} installed={isAppInstalled(app.id)} onOpen={() => setSelected(app)} onInstall={() => handleInstall(app.id)} onBuy={() => handleBuy(app.id)} />
                  ))}
                </div>
              )}
            </>
          )}

          {section === 'top' && (
            <>
              <h2 className="text-white font-bold text-xl mb-4">Top aplicaciones</h2>
              {ranking === null ? <p className="text-white/30 text-sm">Cargando...</p> : rankedApps.length === 0 ? (
                <EmptyState text="Todavía no hay suficientes instalaciones para armar un ranking." />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {rankedApps.map((app) => (
                    <StoreAppCard key={app.id} app={app} installed={isAppInstalled(app.id)} onOpen={() => setSelected(app)} onInstall={() => handleInstall(app.id)} onBuy={() => handleBuy(app.id)} />
                  ))}
                </div>
              )}
            </>
          )}

          {section === 'nuevas' && (
            <>
              <h2 className="text-white font-bold text-xl mb-4">Nuevas apps</h2>
              {comingSoon.length === 0 ? (
                <EmptyState text="No hay aplicaciones nuevas anunciadas por ahora." />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {comingSoon.map((app) => (
                    <div key={app.id} className="flex flex-col items-start gap-2.5 p-4 rounded-2xl border border-white/5 bg-white/5 opacity-60">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"><AppIcon appId={app.id} size={30} /></div>
                      <div className="min-w-0 w-full">
                        <p className="text-white font-semibold text-sm truncate">{app.name}</p>
                        <p className="text-white/40 text-xs line-clamp-2 mt-0.5">{app.description}</p>
                      </div>
                      <span className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3 h-3" /> Próximamente</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {section === 'premium' && (
            <>
              <h2 className="text-white font-bold text-xl mb-4">Apps premium</h2>
              {premiumApps.length === 0 ? (
                <EmptyState text="Todavía no hay aplicaciones premium disponibles." />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {premiumApps.map((app) => (
                    <StoreAppCard key={app.id} app={app} installed={isAppInstalled(app.id)} onOpen={() => setSelected(app)} onInstall={() => handleInstall(app.id)} onBuy={() => handleBuy(app.id)} />
                  ))}
                </div>
              )}
            </>
          )}

          {section === 'gratis' && (
            <>
              <h2 className="text-white font-bold text-xl mb-4">Apps gratuitas</h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {freeApps.map((app) => (
                  <StoreAppCard key={app.id} app={app} installed={isAppInstalled(app.id)} onOpen={() => setSelected(app)} onInstall={() => handleInstall(app.id)} onBuy={() => handleBuy(app.id)} />
                ))}
              </div>
            </>
          )}

          {section === 'mias' && (
            <>
              <h2 className="text-white font-bold text-xl mb-4">Mis aplicaciones</h2>
              {installedList.length === 0 ? (
                <EmptyState text="Todavía no instalaste ninguna app." />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {installedList.map((app) => (
                    <StoreAppCard key={app.id} app={app} installed onOpen={() => setSelected(app)} onInstall={() => handleInstall(app.id)} onBuy={() => handleBuy(app.id)} />
                  ))}
                </div>
              )}
            </>
          )}

          {section === 'actualizaciones' && (
            <>
              <h2 className="text-white font-bold text-xl mb-4">Actualizaciones</h2>
              <EmptyState text="No hay actualizaciones disponibles." />
            </>
          )}
        </div>

        <div className="w-72 flex-shrink-0 border-l border-white/10 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-[#0a0a10]">
          <MyAppsPanel apps={installedList} onOpen={(app) => openApp(app.id)} onSeeAll={() => setSection('mias')} />
          <TopInstalledPanel ranked={ranking} />
        </div>
      </div>

      {selected && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-6" onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm bg-[#151520] border border-white/10 rounded-2xl p-6 relative animate-in zoom-in-95 fade-in duration-150" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <AppIcon appId={selected.id} size={36} />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">{selected.name}</h3>
            <p className="text-white/30 text-xs uppercase tracking-wide mb-3">{CATEGORY_LABELS[selected.category]}</p>
            <p className="text-white/60 text-sm mb-5">{selected.description}</p>

            {isAppInstalled(selected.id) ? (
              <div className="space-y-2">
                <button
                  onClick={() => { openApp(selected.id); setSelected(null); }}
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
            ) : selected.comingSoon ? (
              <div className="w-full py-2.5 rounded-lg bg-white/5 text-white/40 text-sm font-medium flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4" /> Próximamente
              </div>
            ) : selected.priceHubCoins ? (
              <InstallButton accent={STORE_ACCENT} price={selected.priceHubCoins} onInstall={() => handleBuy(selected.id)} />
            ) : (
              <InstallButton accent={STORE_ACCENT} onInstall={() => handleInstall(selected.id)} />
            )}
          </div>
        </div>
      )}

      {tutorialOpen && <TutorialModal startAt={tutorialStart} onClose={() => setTutorialOpen(false)} />}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-white/30 gap-2">
      <p>{text}</p>
    </div>
  );
}

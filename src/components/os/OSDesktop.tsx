'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { OSProvider, useOS } from '@/contexts/OSContext';
import Desktop from './Desktop';
import Taskbar from './Taskbar';
import StartMenu from './StartMenu';
import NotificationPanel from './NotificationPanel';
import Window from './Window';
import HubPayApp from './apps/HubPayApp';
import HubChatApp from './apps/HubChatApp';
import Emergency911App from './apps/Emergency911App';
import MDTApp from './apps/MDTApp';
import { DepartmentProvider } from '@/contexts/DepartmentContext';
import { DEPARTMENTS, getDepartment, type DepartmentConfig } from '@/lib/departments';
import { getStoredSystemChoice, rememberPersonalChoice } from '@/lib/systemChoice';
import InstitutionalTransition from './InstitutionalTransition';
import SystemSelectScreen from './SystemSelectScreen';
import AmazonApp from './apps/AmazonApp';
import DeepWebApp from './apps/DeepWebApp';
import SettingsApp from './apps/SettingsApp';
import ProfileApp from './apps/ProfileApp';
import SocialHubApp from './apps/SocialHubApp';
import DealerApp from './apps/DealerApp';
import AmmuNationApp from './apps/AmmuNationApp';
import RealEstateApp from './apps/RealEstateApp';
import CasinoApp from './apps/CasinoApp';
import GoogleBrowserApp from './apps/GoogleBrowserApp';
import ArchivosApp from './apps/ArchivosApp';
import HubStoreApp from './apps/HubStoreApp';
import VPSManagerApp from './apps/VPSManagerApp';
import CryptoWalletApp from './apps/CryptoWalletApp';
import HubCareerApp from './apps/hubcareer/HubCareerApp';
import OnboardingFlow from './OnboardingFlow';
import CharacterSelectScreen from './CharacterSelectScreen';
import { Shield, UserCircle, Loader2, ArrowRightLeft } from 'lucide-react';
import { wallpaperPresetById } from '@/lib/wallpaperPresets';
import { ToastProvider } from './ui';

const FIT_TO_BACKGROUND_SIZE: Record<string, string> = {
  fill: 'cover',
  fit: 'contain',
  stretch: '100% 100%',
  center: 'auto',
  tile: 'auto',
};

// Profile Switch Loading Screen Component
function ProfileSwitchScreen() {
  const { isSwitchingProfile, activeProfile, user } = useOS();

  if (!isSwitchingProfile) return null;

  // Get the profile being switched to
  const targetProfile = user.profiles.find(p => p.id !== user.activeProfileId);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0A0F] flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/30 via-blue-600/20 to-transparent rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Avatar with loading ring */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/10 animate-pulse">
            <img
              src={targetProfile?.avatar || user.avatar}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Spinning loader ring */}
          <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />

          {/* Profile type badge */}
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full flex items-center gap-2 ${
            targetProfile?.type === 'admin'
              ? 'bg-yellow-500/20 border border-yellow-500/30'
              : 'bg-blue-500/20 border border-blue-500/30'
          }`}>
            {targetProfile?.type === 'admin' ? (
              <>
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">Admin</span>
              </>
            ) : (
              <>
                <UserCircle className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">Personaje</span>
              </>
            )}
          </div>
        </div>

        {/* Profile name */}
        <h2 className="text-white text-2xl font-bold mb-2">{targetProfile?.displayName || 'Cargando...'}</h2>

        {/* Subtitle */}
        <p className="text-white/50 text-sm mb-8">
          {targetProfile?.type === 'admin'
            ? 'Cambiando a modo Administrador...'
            : `Cambiando a ${targetProfile?.characterJob || 'Personaje'}...`
          }
        </p>

        {/* Loading indicator */}
        <div className="flex items-center gap-3 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Preparando entorno...</span>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-8">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function OSContent() {
  const { windows, preferences, suspendedNotice, deepWebSessionActive, user, charactersLoaded } = useOS();
  const router = useRouter();

  // Arranque del OS, en orden: 1) elegir personaje (siempre, como un connect
  // screen) — 2) si la cuenta es miembro activo de algún departamento con
  // terminal propia, elegir qué ordenador abrir (todavía a nivel cuenta, no
  // por personaje, mientras no exista un vínculo personaje↔facción) — 3)
  // escritorio. Elegir "personal" se recuerda por esta sesión de navegador,
  // así F6 desde la terminal, o volver a cargar /dashboard, no interrumpe de nuevo.
  const [boot, setBoot] = React.useState<'checking' | 'characters' | 'systems' | 'transitioning' | 'done'>('checking');
  const [institutionalDept, setInstitutionalDept] = React.useState<DepartmentConfig | null>(null);
  React.useEffect(() => {
    if (!charactersLoaded) return;
    let cancelled = false;

    // Un solo reintento ante un hiccup de red/DB — sin esto, una falla transitoria del
    // check institucional degrada silenciosamente a "cuenta personal" para toda la sesión,
    // aunque la cuenta sí sea miembro de un departamento.
    const checkWhoami = (attempt = 0): void => {
      fetch('/api/terminal/whoami', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (!data.success && attempt === 0) {
            setTimeout(() => checkWhoami(1), 800);
            return;
          }
          const dept = data.success && data.department ? getDepartment(data.department) : null;
          setInstitutionalDept(dept);
          setBoot('characters');
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt === 0) { setTimeout(() => checkWhoami(1), 800); return; }
          setBoot('characters');
        });
    };
    checkWhoami();

    return () => { cancelled = true; };
  }, [charactersLoaded]);

  const finishCharacterPick = () => {
    if (institutionalDept && getStoredSystemChoice() !== 'personal') {
      setBoot('systems');
    } else {
      setBoot('done');
    }
  };

  if (boot === 'checking') {
    return (
      <div className="fixed inset-0 bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  if (boot === 'characters') {
    return <CharacterSelectScreen onDone={finishCharacterPick} institutionalDept={institutionalDept} />;
  }

  if (boot === 'systems' && institutionalDept) {
    return (
      <SystemSelectScreen
        displayName={user.displayName}
        avatar={user.avatar}
        department={institutionalDept}
        onChoosePersonal={() => { rememberPersonalChoice(); setBoot('done'); }}
        onChooseInstitutional={() => setBoot('transitioning')}
      />
    );
  }

  if (boot === 'transitioning' && institutionalDept) {
    return (
      <InstitutionalTransition
        direction="to-institutional"
        department={institutionalDept}
        onComplete={() => router.replace(`/terminal/${institutionalDept.slug}`)}
      />
    );
  }

  const wallpaperStyle: React.CSSProperties = preferences.wallpaper.type === 'custom'
    ? {
        backgroundImage: `url(${preferences.wallpaper.value})`,
        backgroundSize: FIT_TO_BACKGROUND_SIZE[preferences.wallpaper.fit] || 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: preferences.wallpaper.fit === 'tile' ? 'repeat' : 'no-repeat',
      }
    : { background: wallpaperPresetById(preferences.wallpaper.value).css };

  const themeVars = {
    '--os-accent': preferences.theme.accent,
    '--os-taskbar': preferences.theme.taskbar,
    '--os-start-menu': preferences.theme.startMenu,
    '--os-border': preferences.theme.windowBorder,
    '--os-selection': preferences.theme.selection,
    '--os-transparency': String(preferences.theme.transparency),
  } as React.CSSProperties;

  const renderAppContent = (appId: string) => {
    switch (appId) {
      case 'hubpay':
        return <HubPayApp />;
      case 'hubchat':
        return <HubChatApp />;
      case 'emergency911':
        return <Emergency911App />;
      case 'mdt':
        return <DepartmentProvider department={DEPARTMENTS.lspd}><MDTApp /></DepartmentProvider>;
      case 'amazon':
        return <AmazonApp />;
      case 'deepweb':
        return <DeepWebApp />;
      case 'socialhub':
        return <SocialHubApp />;
      case 'dealer':
        return <DealerApp />;
      case 'marketplace':
        return <AmmuNationApp />;
      case 'realestate':
        return <RealEstateApp />;
      case 'casino':
        return <CasinoApp />;
      case 'browser':
        return <GoogleBrowserApp />;
      case 'settings':
        return <SettingsApp />;
      case 'profile':
        return <ProfileApp />;
      case 'archivos':
        return <ArchivosApp />;
      case 'hubstore':
        return <HubStoreApp />;
      case 'vps':
        return <VPSManagerApp />;
      case 'crypto':
        return <CryptoWalletApp />;
      case 'hubcareer':
        return <HubCareerApp />;
      default:
        return (
          <div className="h-full flex items-center justify-center text-white/40">
            <p>Aplicación no disponible</p>
          </div>
        );
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={themeVars}>
    <ToastProvider>
      {/* Profile Switch Loading Screen */}
      <ProfileSwitchScreen />

      {/* Wallpaper (preset o imagen personalizada, según Configuración) */}
      <div className="absolute inset-0" style={wallpaperStyle}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />

        {/* Animated accent orbs */}
        <div className="absolute top-20 right-40 w-2 h-2 rounded-full animate-pulse opacity-60" style={{ background: 'var(--os-accent)' }} />
        <div className="absolute bottom-40 left-60 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse opacity-30" style={{ animationDelay: '2s' }} />
      </div>

      {/* Desktop Area */}
      <Desktop />

      {/* Acceso permanente a la terminal institucional — sin esto, elegir "personal" una
          vez en esta pestaña dejaba a la cuenta sin forma de volver a la pantalla de elegir
          ordenador (se recuerda por sesión de navegador a propósito, para no interrumpir en
          cada carga). Este botón es la vía de vuelta real, siempre visible. */}
      {institutionalDept && (
        <button
          onClick={() => setBoot('transitioning')}
          className="fixed bottom-16 sm:bottom-20 left-3 z-[890] flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full backdrop-blur-xl border border-white/10 bg-black/40 hover:bg-black/60 hover:border-blue-500/40 transition-all shadow-lg group"
          title={`Abrir terminal de ${institutionalDept.name}`}
        >
          <img src={institutionalDept.badge} alt="" className="w-6 h-6 object-contain" />
          <span className="text-white/70 group-hover:text-white text-xs font-medium transition-colors">Terminal {institutionalDept.factionAbbreviation}</span>
          <ArrowRightLeft className="w-3 h-3 text-white/30 group-hover:text-blue-400 transition-colors" />
        </button>
      )}

      {/* Windows */}
      {windows.map((window) => (
        <Window key={window.id} window={window}>
          {renderAppContent(window.appId)}
        </Window>
      ))}

      {/* Start Menu */}
      <StartMenu />

      {/* Notification Panel */}
      <NotificationPanel />

      {/* Taskbar */}
      <Taskbar />

      {/* Primer arranque: bienvenida + configuración inicial + tutorial */}
      <OnboardingFlow />

      {/* Aviso de modo aislado activo + toast de app suspendida */}
      {deepWebSessionActive && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[4000] flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/90 border border-red-500/40 text-red-300 text-xs font-semibold backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Modo aislado activo — Deep Web en sesión protegida
        </div>
      )}
      {suspendedNotice && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[4000] bg-black/90 text-white px-4 py-2 rounded-lg text-sm shadow-xl border border-white/10">
          {suspendedNotice}
        </div>
      )}
    </ToastProvider>
    </div>
  );
}

interface OSDesktopProps {
  discordSession?: any;
}

export default function OSDesktop({ discordSession }: OSDesktopProps) {
  return (
    <OSProvider discordSession={discordSession}>
      <OSContent />
    </OSProvider>
  );
}

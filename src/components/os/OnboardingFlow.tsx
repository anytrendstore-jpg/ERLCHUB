'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useOS } from '@/contexts/OSContext';
import { AppIcon } from '@/components/icons/AppIcons';
import { WALLPAPER_PRESETS } from '@/lib/wallpaperPresets';
import { Check, ChevronRight, Sparkles, LayoutGrid, Package, Bell } from 'lucide-react';

const ACCENT_SWATCHES = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

interface TourStep {
  id: string;
  selector: string;
  title: string;
  body: string;
}

const TOUR_STEPS: TourStep[] = [
  { id: 'desktop', selector: '[data-tour="desktop"]', title: 'Este es tu escritorio', body: 'Aquí encontrarás tus aplicaciones instaladas, accesos directos y archivos.' },
  { id: 'start-button', selector: '[data-tour="start-button"]', title: 'Menú Inicio', body: 'Desde aquí puedes acceder a tus aplicaciones instaladas, configuraciones y herramientas del sistema.' },
  { id: 'taskbar', selector: '[data-tour="taskbar"]', title: 'Barra de tareas', body: 'Aquí aparecerán tus aplicaciones abiertas, la hora, las notificaciones y el estado del sistema.' },
  { id: 'app-hubstore', selector: '[data-tour="app-hubstore"]', title: 'Hub Store', body: '¿Quieres utilizar Banco, HubChat, MercadoLibre, Casino u otras aplicaciones? No vienen instaladas por defecto: descárgalas desde Hub Store. Algunas son gratuitas y otras requieren un pago.' },
  { id: 'app-settings', selector: '[data-tour="app-settings"]', title: 'Settings', body: 'Desde aquí puedes personalizar tu Windows: fondo de pantalla, color de acento, tema y más.' },
  { id: 'app-archivos', selector: '[data-tour="app-archivos"]', title: 'Archivos', body: 'Aquí encontrarás tus documentos, compras, propiedades, vehículos, armas y demás elementos que poseas. Es el inventario digital de tu personaje.' },
  { id: 'notifications-button', selector: '[data-tour="notifications-button"]', title: 'Notificaciones', body: 'Aquí recibirás información sobre tus aplicaciones, compras, mensajes, operaciones bancarias y otros eventos.' },
];

type Stage = 'boot' | 'setup' | 'tour' | 'finish';

function useTargetRect(selector: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!selector) { setRect(null); return; }
    const measure = () => {
      const el = document.querySelector(selector);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    const id = setInterval(measure, 200);
    window.addEventListener('resize', measure);
    return () => { clearInterval(id); window.removeEventListener('resize', measure); };
  }, [selector]);

  return rect;
}

function BootScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1400);
    const t2 = setTimeout(() => setPhase(2), 2600);
    const t3 = setTimeout(onDone, 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0A0A0F] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-blue-600/20 via-purple-600/15 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-8 shadow-2xl shadow-blue-600/30 animate-in zoom-in duration-500">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        {phase === 0 && (
          <div className="flex items-center gap-3 animate-in fade-in duration-300">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-white/70 text-lg">Cargando Windows...</span>
          </div>
        )}
        {phase >= 1 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h1 className="text-white text-3xl font-light mb-2">Bienvenido a tu nuevo PC</h1>
            {phase >= 2 && (
              <p className="text-white/50 text-sm animate-in fade-in duration-500">Estamos preparando tu experiencia...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SetupScreen({ onDone }: { onDone: () => void }) {
  const { user, preferences, updatePreferences } = useOS();

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0A0A0F] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[var(--card-bg)] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <img src={user.avatar} alt={user.displayName} className="w-16 h-16 rounded-full ring-2 ring-white/10" />
          <div className="min-w-0">
            <h2 className="text-white text-xl font-bold truncate">{user.displayName}</h2>
            <p className="text-white/40 text-sm truncate">@{user.username} · ID {user.discordId}</p>
          </div>
        </div>

        <p className="text-white/60 text-sm mb-6">Personaliza tu Windows antes de empezar. Podrás cambiar todo esto luego desde Settings.</p>

        <div className="mb-5">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Fondo de pantalla</p>
          <div className="grid grid-cols-4 gap-2">
            {WALLPAPER_PRESETS.map((wp) => (
              <button
                key={wp.id}
                onClick={() => updatePreferences({ wallpaper: { type: 'preset', value: wp.id, fit: 'fill' } })}
                className={`h-14 rounded-lg border-2 transition-all ${preferences.wallpaper.value === wp.id ? 'border-white' : 'border-transparent hover:border-white/30'}`}
                style={{ background: wp.css }}
                title={wp.label}
              />
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Color de acento</p>
          <div className="flex gap-2">
            {ACCENT_SWATCHES.map((color) => (
              <button
                key={color}
                onClick={() => updatePreferences({ theme: { accent: color, selection: color } })}
                className={`w-9 h-9 rounded-full ring-2 transition-all ${preferences.theme.accent === color ? 'ring-white scale-110' : 'ring-transparent hover:ring-white/40'}`}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>

        <div className="mb-7">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Tema</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updatePreferences({ theme: { mode: 'dark' } })}
              className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${preferences.theme.mode === 'dark' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
            >
              Oscuro
            </button>
            <button disabled className="py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/30 text-sm font-medium cursor-not-allowed">
              Claro · Próximamente
            </button>
          </div>
        </div>

        <button
          onClick={onDone}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          Continuar <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TourOverlay({ stepIndex, onNext, onBack, onSkip }: { stepIndex: number; onNext: () => void; onBack: () => void; onSkip: () => void }) {
  const step = TOUR_STEPS[stepIndex];
  const rect = useTargetRect(step.selector);
  const pad = 10;

  const box = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  const cardAbove = box ? box.top > window.innerHeight * 0.55 : false;
  const cardTop = box ? (cardAbove ? Math.max(16, box.top - 190) : Math.min(window.innerHeight - 210, box.top + box.height + 16)) : window.innerHeight / 2 - 100;
  const cardLeft = box ? Math.min(Math.max(16, box.left), window.innerWidth - 336) : window.innerWidth / 2 - 160;

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* Overlay con recorte alrededor del elemento resaltado */}
      {box ? (
        <>
          <div className="absolute bg-black/70 transition-all duration-300" style={{ top: 0, left: 0, right: 0, height: Math.max(0, box.top) }} />
          <div className="absolute bg-black/70 transition-all duration-300" style={{ top: box.top + box.height, left: 0, right: 0, bottom: 0 }} />
          <div className="absolute bg-black/70 transition-all duration-300" style={{ top: box.top, left: 0, width: Math.max(0, box.left), height: box.height }} />
          <div className="absolute bg-black/70 transition-all duration-300" style={{ top: box.top, left: box.left + box.width, right: 0, height: box.height }} />
          <div
            className="absolute rounded-xl ring-2 pointer-events-none transition-all duration-300 animate-pulse"
            style={{ top: box.top, left: box.left, width: box.width, height: box.height, boxShadow: '0 0 0 2px var(--os-accent, #3b82f6)' }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Tarjeta */}
      <div
        className="absolute w-80 bg-[#151520] border border-white/10 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ top: cardTop, left: cardLeft }}
      >
        <p className="text-white/30 text-[11px] font-medium mb-1">Paso {stepIndex + 1} de {TOUR_STEPS.length}</p>
        <h3 className="text-white text-lg font-bold mb-2">{step.title}</h3>
        <p className="text-white/60 text-sm mb-5">{step.body}</p>
        <div className="flex items-center justify-between">
          <button onClick={onSkip} className="text-white/40 hover:text-white text-xs transition-colors">Saltar tutorial</button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button onClick={onBack} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors">Atrás</button>
            )}
            <button onClick={onNext} className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
              {stepIndex === TOUR_STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinishScreen({ onDone }: { onDone: () => void }) {
  return (
    <div className="fixed inset-0 z-[10000] bg-[#0A0A0F] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
        <Check className="w-8 h-8 text-emerald-400" />
      </div>
      <h1 className="text-white text-3xl font-bold mb-2 text-center">¡Todo listo!</h1>
      <p className="text-white/50 text-base mb-1 text-center">Tu PC está preparado.</p>
      <p className="text-white/40 text-sm mb-8 text-center max-w-sm">Explora Hub Store y descarga las aplicaciones que quieras utilizar.</p>
      <button
        onClick={onDone}
        className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
      >
        EMPEZAR
      </button>
    </div>
  );
}

export default function OnboardingFlow() {
  const { preferences, preferencesLoaded, completeOnboarding } = useOS();
  const [stage, setStage] = useState<Stage>('boot');
  const [tourStep, setTourStep] = useState(0);

  const goToSetup = useCallback(() => setStage('setup'), []);
  const goToTour = useCallback(() => setStage('tour'), []);
  const goToFinish = useCallback(() => setStage('finish'), []);

  if (!preferencesLoaded || preferences.onboarding.completed) return null;

  if (stage === 'boot') return <BootScreen onDone={goToSetup} />;
  if (stage === 'setup') return <SetupScreen onDone={goToTour} />;
  if (stage === 'tour') {
    return (
      <TourOverlay
        stepIndex={tourStep}
        onNext={() => setTourStep((s) => {
          if (s < TOUR_STEPS.length - 1) return s + 1;
          goToFinish();
          return s;
        })}
        onBack={() => setTourStep((s) => Math.max(0, s - 1))}
        onSkip={goToFinish}
      />
    );
  }
  return <FinishScreen onDone={completeOnboarding} />;
}

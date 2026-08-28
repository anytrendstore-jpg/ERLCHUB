'use client';

import { useEffect, useState } from 'react';
import {
  X, ChevronLeft, ChevronRight, Store, Search, Download, Pin, Sparkles,
  Users, ThumbsUp, type LucideIcon,
} from 'lucide-react';

interface TutorialStep {
  icon: LucideIcon;
  color: string;
  title: string;
  body: string;
}

const STEPS: TutorialStep[] = [
  {
    icon: Store, color: '#f59e0b',
    title: 'Bienvenido a Hub Store',
    body: 'Acá encontrás todas las aplicaciones del sistema: Fleeca Bank, HubSocial, HubChat, Marketplace y más. Es tu punto de entrada para instalar lo que quieras usar.',
  },
  {
    icon: Search, color: '#f59e0b',
    title: 'Buscá y filtrá',
    body: 'Usá el buscador o las categorías (Finanzas, Mercado, Social, Sistema, Roleplay) para encontrar rápido la app que necesitás.',
  },
  {
    icon: Download, color: '#f59e0b',
    title: 'Instalá con un clic',
    body: 'Tocá una app para ver su detalle, y "Obtener" para instalarla. Vas a ver una barra de progreso mientras se instala de verdad.',
  },
  {
    icon: Pin, color: '#f59e0b',
    title: 'Organizá tu escritorio',
    body: 'Una vez instalada, podés abrirla, anclarla a la barra de tareas para acceso rápido, o desinstalarla cuando quieras.',
  },
  {
    icon: Sparkles, color: '#8b5cf6',
    title: 'HubSocial: tu red social',
    body: 'Dentro de HubSocial podés publicar texto e imágenes, ver el feed de "Para ti" o "Siguiendo", y compartir historias que duran 24 horas.',
  },
  {
    icon: ThumbsUp, color: '#8b5cf6',
    title: 'Reacciones y comentarios',
    body: 'Pasá el mouse sobre "Me gusta" para elegir entre 5 reacciones distintas. Los comentarios admiten respuestas, indentadas debajo del comentario original.',
  },
  {
    icon: Users, color: '#8b5cf6',
    title: 'Gente, chat y más',
    body: 'El panel derecho te sugiere personas reales para seguir según amigos en común, y un panel de chats te muestra tus conversaciones sin salir de HubSocial. Grupos, Páginas, Eventos y Marketplace ya están en el menú — llegan pronto con datos reales.',
  },
];

const STORAGE_KEY = 'os_tutorial_seen_v1';

export function hasSeenTutorial(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

export function markTutorialSeen(): void {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* localStorage no disponible */ }
}

export default function TutorialModal({ startAt = 0, onClose }: { startAt?: number; onClose: () => void }) {
  const [step, setStep] = useState(startAt);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const finish = () => { markTutorialSeen(); onClose(); };
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={finish}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#0A0A0F]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="relative h-32 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${current.color}25, transparent)` }}>
          <button onClick={finish} className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${current.color}20` }}>
            <Icon className="w-8 h-8" style={{ color: current.color }} />
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-white font-bold text-lg mb-2">{current.title}</h3>
          <p className="text-white/60 text-sm leading-relaxed">{current.body}</p>

          <div className="flex items-center justify-center gap-1.5 mt-6 mb-5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === step ? '20px' : '6px', background: i === step ? current.color : 'rgba(255,255,255,0.15)' }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
            )}
            <button onClick={finish} className="text-white/40 hover:text-white/70 text-xs transition-colors ml-1">
              Saltar
            </button>
            <button
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-transform hover:scale-[1.02]"
              style={{ background: current.color }}
            >
              {isLast ? 'Entendido' : 'Siguiente'} {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const HUBSOCIAL_TUTORIAL_START = 4;

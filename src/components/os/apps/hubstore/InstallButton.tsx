'use client';

import { useRef, useState } from 'react';
import { Download, Check, Coins } from 'lucide-react';

type Phase = 'idle' | 'confirm' | 'installing' | 'done';

/**
 * Animación de instalación: la barra de progreso corre mientras la promesa real de
 * instalar (PATCH /api/os/apps) está en vuelo, con un mínimo de 700ms para que el
 * feedback se sienta real en vez de parpadear — no es un tiempo inventado, es el
 * mismo trabajo real esperando a completarse, solo con un piso de duración visible.
 *
 * Cuando `price` está definido, agrega un paso de confirmación antes de cobrar
 * (una compra real de HubCoins no debería dispararse con un solo click accidental).
 * El caller es responsable de mostrar el motivo del error (ej. saldo insuficiente)
 * antes de que `onInstall` resuelva en false — este botón solo vuelve a "idle".
 */
export default function InstallButton({ label, onInstall, accent, price }: {
  label?: string;
  onInstall: () => Promise<boolean>;
  accent: string;
  price?: number;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = async () => {
    setPhase('installing');
    setProgress(6);
    tickRef.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.random() * 16 + 6));
    }, 140);

    const [ok] = await Promise.all([
      onInstall(),
      new Promise<void>((resolve) => setTimeout(resolve, 700)),
    ]);

    if (tickRef.current) clearInterval(tickRef.current);
    setProgress(100);

    if (ok) {
      setTimeout(() => setPhase('done'), 200);
    } else {
      setTimeout(() => { setPhase('idle'); setProgress(0); }, 400);
    }
  };

  const start = () => {
    if (phase !== 'idle') return;
    if (price) { setPhase('confirm'); return; }
    run();
  };

  if (phase === 'installing') {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-white/60 text-xs font-medium">Instalando...</span>
          <span className="text-white/40 text-xs tabular-nums">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, ${accent}cc)` }}
          />
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div
        className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-1.5 animate-in zoom-in-95 duration-200"
        style={{ background: `${accent}30`, color: accent }}
      >
        <Check className="w-4 h-4" /> Instalada
      </div>
    );
  }

  if (phase === 'confirm') {
    return (
      <div className="w-full space-y-1.5">
        <button
          onClick={run}
          className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: accent }}
        >
          <Coins className="w-4 h-4" /> Confirmar compra · {price}
        </button>
        <button
          onClick={() => setPhase('idle')}
          className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-xs font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={start}
      className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: accent }}
    >
      {price ? <><Coins className="w-4 h-4" /> Comprar · {price}</> : <><Download className="w-4 h-4" /> {label || 'Obtener · Gratis'}</>}
    </button>
  );
}

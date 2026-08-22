'use client';

import React, { useEffect, useRef, useState } from 'react';

const RANDOM_SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '🍉', '🍇'];
const REEL_STOP_DELAY_MS = [0, 350, 700];

function Reel({ finalSymbol, spinning, stopDelay }: { finalSymbol: string | null; spinning: boolean; stopDelay: number }) {
  const [symbol, setSymbol] = useState(RANDOM_SYMBOLS[0]);
  const [locked, setLocked] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (spinning) {
      setLocked(false);
      intervalRef.current = setInterval(() => {
        setSymbol(RANDOM_SYMBOLS[Math.floor(Math.random() * RANDOM_SYMBOLS.length)]);
      }, 70);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
    if (!spinning && finalSymbol) {
      const t = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setSymbol(finalSymbol);
        setLocked(true);
      }, stopDelay);
      return () => clearTimeout(t);
    }
  }, [spinning, finalSymbol, stopDelay]);

  return (
    <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
      <span
        className={`text-3xl ${spinning && !locked ? 'blur-[1.5px] scale-110' : locked ? 'animate-[reel-stop_0.3s_ease-out]' : ''}`}
      >
        {symbol}
      </span>
      <style jsx>{`
        @keyframes reel-stop {
          0% { transform: scale(1.4); }
          60% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

interface SlotReelsProps {
  spinning: boolean;
  symbols: string[] | null;
}

export default function SlotReels({ spinning, symbols }: SlotReelsProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-b from-zinc-800 to-black border-2 border-yellow-600/40">
        {[0, 1, 2].map((i) => (
          <Reel key={i} spinning={spinning} finalSymbol={symbols ? symbols[i] : null} stopDelay={REEL_STOP_DELAY_MS[i]} />
        ))}
      </div>
      <div className="h-8" />
    </div>
  );
}

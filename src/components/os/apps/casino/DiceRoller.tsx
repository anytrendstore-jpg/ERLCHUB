'use client';

import React, { useEffect, useState } from 'react';

const PIP_POSITIONS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({ value, spinning }: { value: number; spinning: boolean }) {
  const pips = PIP_POSITIONS[value] || [];
  return (
    <div
      className={`w-16 h-16 rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.4)] grid grid-cols-3 grid-rows-3 gap-1 p-2.5 ${spinning ? 'animate-[dice-roll_0.5s_ease-in-out_infinite]' : 'animate-[dice-land_0.35s_ease-out]'}`}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className={`w-full h-full rounded-full ${pips.includes(i) ? 'bg-zinc-900' : ''}`} />
      ))}
      <style jsx>{`
        @keyframes dice-roll {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(0.92); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes dice-land {
          0% { transform: scale(1.3) rotate(-8deg); }
          60% { transform: scale(0.95) rotate(4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

interface DiceRollerProps {
  spinning: boolean;
  d1: number | null;
  d2: number | null;
}

export default function DiceRoller({ spinning, d1, d2 }: DiceRollerProps) {
  const [face1, setFace1] = useState(4);
  const [face2, setFace2] = useState(5);

  useEffect(() => {
    if (!spinning) return;
    const t = setInterval(() => {
      setFace1(1 + Math.floor(Math.random() * 6));
      setFace2(1 + Math.floor(Math.random() * 6));
    }, 90);
    return () => clearInterval(t);
  }, [spinning]);

  const shownD1 = spinning ? face1 : d1 ?? face1;
  const shownD2 = spinning ? face2 : d2 ?? face2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4 py-4">
        <Die value={shownD1} spinning={spinning} />
        <Die value={shownD2} spinning={spinning} />
      </div>
      <div className="h-8 flex items-center justify-center">
        {!spinning && d1 !== null && d2 !== null && (
          <span className="px-4 py-1 rounded-full text-sm font-bold bg-white/10 text-white">
            {d1} + {d2} = {d1 + d2}
          </span>
        )}
      </div>
    </div>
  );
}

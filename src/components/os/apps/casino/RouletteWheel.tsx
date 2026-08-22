'use client';

import React, { useMemo, useRef } from 'react';

/** Orden real de una ruleta europea (0-36, un solo cero), en sentido horario desde arriba. */
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const SEG_ANGLE = 360 / WHEEL_ORDER.length;
const SIZE = 240;
const RADIUS = SIZE / 2;
const LABEL_RADIUS = RADIUS - 20;

function colorOf(n: number): 'green' | 'red' | 'black' {
  if (n === 0) return 'green';
  return RED_NUMBERS.has(n) ? 'red' : 'black';
}

const WHEEL_HEX: Record<'green' | 'red' | 'black', string> = {
  green: '#059669',
  red: '#dc2626',
  black: '#18181b',
};

const CONIC_GRADIENT = WHEEL_ORDER
  .map((n, i) => `${WHEEL_HEX[colorOf(n)]} ${(i * SEG_ANGLE).toFixed(3)}deg ${((i + 1) * SEG_ANGLE).toFixed(3)}deg`)
  .join(', ');

interface RouletteWheelProps {
  spinning: boolean;
  targetNumber: number | null;
}

export default function RouletteWheel({ spinning, targetNumber }: RouletteWheelProps) {
  const rotationRef = useRef(0);

  const rotation = useMemo(() => {
    if (targetNumber === null) return rotationRef.current;
    const idx = WHEEL_ORDER.indexOf(targetNumber);
    const angleAtTop = idx * SEG_ANGLE + SEG_ANGLE / 2;
    const extraSpins = 5;
    const base = Math.floor(rotationRef.current / 360) * 360;
    const next = base + extraSpins * 360 + (360 - angleAtTop);
    rotationRef.current = next;
    return next;
  }, [targetNumber]);

  const resultColor = targetNumber !== null ? colorOf(targetNumber) : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* Bola decorativa: gira continuamente mientras spinning=true */}
        <div
          className={`absolute inset-0 rounded-full pointer-events-none ${spinning ? 'animate-[ball-spin_0.9s_linear_infinite]' : ''}`}
          style={{ opacity: spinning ? 1 : 0, transition: 'opacity 0.4s' }}
        >
          <div className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" style={{ top: 2, left: '50%', marginLeft: -5 }} />
        </div>

        {/* Puntero fijo */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-10" style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '14px solid #fbbf24' }} />

        {/* Disco giratorio */}
        <div
          className="absolute inset-0 rounded-full border-4 border-yellow-600/60 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          style={{
            background: `conic-gradient(from 0deg, ${CONIC_GRADIENT})`,
            transform: `rotate(${rotation}deg)`,
            transition: targetNumber !== null ? 'transform 3.2s cubic-bezier(0.15,0.65,0.15,1)' : 'none',
          }}
        >
          {WHEEL_ORDER.map((n, i) => {
            const angle = i * SEG_ANGLE + SEG_ANGLE / 2;
            return (
              <span
                key={n}
                className="absolute text-white font-bold pointer-events-none"
                style={{
                  fontSize: 9,
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%,-50%) rotate(${angle}deg) translateY(-${LABEL_RADIUS}px)`,
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                }}
              >
                {n}
              </span>
            );
          })}
          <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-yellow-700/80 border-2 border-yellow-500/70" style={{ top: 0, bottom: 0, left: 0, right: 0 }} />
        </div>
      </div>

      <div className="h-8 flex items-center justify-center">
        {targetNumber !== null && !spinning && resultColor && (
          <span
            className={`px-4 py-1 rounded-full text-sm font-bold ${resultColor === 'red' ? 'bg-red-600' : resultColor === 'black' ? 'bg-zinc-800 border border-white/20' : 'bg-emerald-600'} text-white`}
          >
            {targetNumber} · {resultColor === 'red' ? 'Rojo' : resultColor === 'black' ? 'Negro' : 'Verde'}
          </span>
        )}
      </div>

      <style jsx>{`
        @keyframes ball-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

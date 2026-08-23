import { useRef } from 'react';

/**
 * Inclinación 3D sutil que sigue el cursor — el mismo truco de las tarjetas
 * "premium" (glow que sigue el mouse + perspectiva). Puro CSS vars, sin
 * re-render por movimiento (todo pasa por refs), así no cuesta nada mientras
 * el usuario pasa el mouse entre varias tarjetas.
 */
export function useCardTilt<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  const onMouseMove = (e: React.MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 10;
    const rotateX = (0.5 - py) * 10;
    el.style.setProperty('--tilt-x', `${rotateX}deg`);
    el.style.setProperty('--tilt-y', `${rotateY}deg`);
    el.style.setProperty('--glow-x', `${px * 100}%`);
    el.style.setProperty('--glow-y', `${py * 100}%`);
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  };

  return { ref, onMouseMove, onMouseLeave };
}

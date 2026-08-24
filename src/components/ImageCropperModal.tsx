'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

const VIEWPORT_WIDTH = 320;
const OUTPUT_SIZE = 640;

interface ImageCropperModalProps {
  file: File;
  /** Ancho/alto del recorte final — 1 para avatar cuadrado, 3 para portada apaisada, etc. */
  aspect: number;
  shape?: 'circle' | 'rect';
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

/** Recortador mínimo sin dependencias externas: arrastrar para mover, slider para zoom,
 * siempre cubriendo el marco (estilo "cover"), y exporta el recorte final vía canvas. */
export default function ImageCropperModal({ file, aspect, shape = 'circle', onCancel, onConfirm }: ImageCropperModalProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const viewportH = VIEWPORT_WIDTH / aspect;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = useMemo(() => {
    if (!natural) return 1;
    return Math.max(VIEWPORT_WIDTH / natural.w, viewportH / natural.h);
  }, [natural, viewportH]);

  const displayed = useMemo(() => {
    if (!natural) return { w: 0, h: 0 };
    const s = baseScale * zoom;
    return { w: natural.w * s, h: natural.h * s };
  }, [natural, baseScale, zoom]);

  const clampOffset = (x: number, y: number) => {
    const minX = Math.min(0, VIEWPORT_WIDTH - displayed.w);
    const minY = Math.min(0, viewportH - displayed.h);
    return { x: Math.max(minX, Math.min(0, x)), y: Math.max(minY, Math.min(0, y)) };
  };

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  };

  useEffect(() => {
    if (!natural) return;
    setOffset(clampOffset((VIEWPORT_WIDTH - displayed.w) / 2, (viewportH - displayed.h) / 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural]);

  useEffect(() => {
    setOffset((prev) => clampOffset(prev.x, prev.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const startDrag = (clientX: number, clientY: number) => {
    dragRef.current = { startX: clientX, startY: clientY, startOffsetX: offset.x, startOffsetY: offset.y };
  };
  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    setOffset(clampOffset(dragRef.current.startOffsetX + dx, dragRef.current.startOffsetY + dy));
  };
  const endDrag = () => { dragRef.current = null; };

  const confirm = async () => {
    if (!natural || !imgRef.current) return;
    setSaving(true);
    try {
      const s = baseScale * zoom;
      const sx = -offset.x / s;
      const sy = -offset.y / s;
      const sw = VIEWPORT_WIDTH / s;
      const sh = viewportH / s;

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE / aspect;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        setSaving(false);
        if (blob) onConfirm(blob);
      }, 'image/jpeg', 0.92);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[#0A0A0F]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Ajustar imagen</h3>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div
          ref={containerRef}
          style={{ width: VIEWPORT_WIDTH, height: viewportH }}
          className={`relative mx-auto overflow-hidden bg-black/40 border border-white/10 cursor-move select-none ${shape === 'circle' ? 'rounded-full' : 'rounded-xl'}`}
          onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
          onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
          onTouchMove={(e) => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
          onTouchEnd={endDrag}
        >
          {imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={imgUrl}
              alt=""
              onLoad={onImgLoad}
              draggable={false}
              style={{ position: 'absolute', left: offset.x, top: offset.y, width: displayed.w, height: displayed.h, maxWidth: 'none' }}
            />
          )}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <ZoomIn className="w-4 h-4 text-white/40 flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>

        <div className="flex items-center gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold transition-colors">
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={saving || !natural}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold transition-opacity"
          >
            {saving ? 'Guardando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

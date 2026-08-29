"use client";

import { useEffect, useRef, useState } from "react";
import { LABEL_GAP, type DocumentLayout } from "@/lib/documentLayouts";
import type { DocumentFieldValues } from "./buildDocumentTexture";
import { drawLicenseBack, drawResidenceBack } from "./cardArt";
import { RotateCw } from "lucide-react";

function formatValue(raw: string | undefined, uppercase?: boolean) {
  if (!raw) return "";
  return uppercase ? raw.toUpperCase() : raw;
}

export default function DocumentCard2D({
  layout,
  values,
  photoUrl,
  documentNumber,
}: {
  layout: DocumentLayout;
  values: DocumentFieldValues;
  photoUrl?: string;
  documentNumber?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = backCanvasRef.current;
    if (!canvas) return;
    const SCALE = 3;
    const w = 500 * SCALE;
    const h = 350 * SCALE;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    if (layout.artKey === "residence_card") drawResidenceBack(ctx, w, h);
    else drawLicenseBack(ctx, w, h, layout.artKey);

    if (documentNumber) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.font = `700 ${h * 0.026}px monospace`;
      ctx.textAlign = "left";
      ctx.fillText(documentNumber, w * 0.06, h * 0.24);
      ctx.restore();
    }
  }, [layout, documentNumber]);

  const values_: Record<string, string | undefined> = values;

  return (
    <div className="w-full">
      <div
        className="w-full"
        style={{ perspective: "1800px" }}
      >
        <button
          type="button"
          onClick={() => setFlipped((v) => !v)}
          className="relative w-full aspect-[500/350] block rounded-xl shadow-2xl"
          style={{
            containerType: "inline-size",
            transformStyle: "preserve-3d",
            transition: "transform 0.7s cubic-bezier(0.4,0.2,0.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
          aria-label="Voltear documento"
        >
          {/* Frente: la imagen real, sin retocar */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* La plantilla de Los Santos trae un margen blanco de fábrica alrededor de la
                tarjeta (medido en píxeles reales: ~9% arriba, ~6-7% en los otros lados) — se
                recorta agrandando la imagen para que la tarjeta llene el marco entero, sin
                ningún borde blanco visible. Las otras plantillas ya vienen a sangre y tienen
                texto propio impreso en coordenadas fijas, así que no se tocan. */}
            <img
              src={layout.image}
              alt="Documento"
              className="absolute inset-0 w-full h-full object-cover select-none"
              style={layout.artKey === "los_santos" ? { transform: "scale(1.22)", transformOrigin: "center" } : undefined}
              draggable={false}
            />

            {layout.panel && (
              <div
                className="absolute rounded-xl backdrop-blur-[2px]"
                style={{
                  left: `${layout.panel.x * 100}%`,
                  top: `${layout.panel.y * 100}%`,
                  width: `${layout.panel.w * 100}%`,
                  height: `${layout.panel.h * 100}%`,
                  background: "rgba(255,255,255,0.74)",
                  border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              />
            )}

            {layout.photo && (
              <div
                className="absolute overflow-hidden"
                style={{
                  left: `${(layout.photo.x - layout.photo.w / 2) * 100}%`,
                  top: `${(layout.photo.y - layout.photo.h / 2) * 100}%`,
                  width: `${layout.photo.w * 100}%`,
                  height: `${layout.photo.h * 100}%`,
                  borderRadius: layout.photo.shape === "circle" ? "50%" : "6px",
                }}
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-[26%] h-[26%] text-black/25" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <span
                      className="text-black/35 font-semibold tracking-wide"
                      style={{ fontSize: "5.5cqw", fontFamily: "Arial, sans-serif" }}
                    >
                      SIN FOTO
                    </span>
                  </div>
                )}
              </div>
            )}

            {layout.artKey === "los_santos" && layout.photo && (values_.firstName || values_.lastName) && (() => {
              const sigLeft = (layout.photo!.x - layout.photo!.w / 2) * 100;
              const sigWidth = layout.photo!.w * 100;
              return (
                <>
                  <span
                    className="absolute whitespace-nowrap overflow-hidden text-ellipsis text-center"
                    style={{
                      left: `${sigLeft}%`,
                      width: `${sigWidth}%`,
                      top: `${(layout.photo!.y + layout.photo!.h / 2) * 100 + 5.5}%`,
                      transform: "translateY(-50%)",
                      fontFamily: "var(--font-signature), cursive",
                      fontSize: "3.3cqw",
                      color: "#1a1a2e",
                      lineHeight: 1,
                    }}
                  >
                    {`${values_.firstName || ""} ${values_.lastName || ""}`.trim()}
                  </span>
                  <span
                    className="absolute whitespace-nowrap uppercase tracking-wide text-center"
                    style={{
                      left: `${sigLeft}%`,
                      width: `${sigWidth}%`,
                      top: `${(layout.photo!.y + layout.photo!.h / 2) * 100 + 11}%`,
                      transform: "translateY(-50%)",
                      fontFamily: "Arial, sans-serif",
                      fontSize: "2.6cqw",
                      color: "#4b5563",
                      opacity: 0.8,
                    }}
                  >
                    Firma del titular
                  </span>
                </>
              );
            })()}

            {layout.fields.map((f) => {
              const raw = values_[f.key];
              if (!raw) return null;
              return (
                <span key={f.key}>
                  {f.label && (
                    <span
                      className="absolute whitespace-nowrap uppercase tracking-wide"
                      style={{
                        left: `${f.x * 100}%`,
                        top: `${(f.y - LABEL_GAP) * 100}%`,
                        transform: "translateY(-50%)",
                        fontSize: `${(7.5 / 500) * 100}cqw`,
                        lineHeight: 1,
                        fontWeight: 700,
                        color: "#4b5563",
                        opacity: 0.9,
                        fontFamily: "Arial, sans-serif",
                        textShadow: layout.panel ? undefined : "0 0 3px #fff, 0 0 3px #fff, 0 0 6px rgba(255,255,255,0.7)",
                      }}
                    >
                      {f.label}
                    </span>
                  )}
                  <span
                    className="absolute whitespace-nowrap"
                    style={{
                      left: `${f.x * 100}%`,
                      top: `${f.y * 100}%`,
                      transform: "translateY(-50%)",
                      fontSize: `${(f.size / 500) * 100}cqw`,
                      lineHeight: 1,
                      fontWeight: f.weight || 600,
                      color: f.color,
                      textShadow: layout.panel ? undefined : "0 0 3px #fff, 0 0 3px #fff, 0 0 6px rgba(255,255,255,0.7)",
                      maxWidth: f.maxWidth ? `${(f.maxWidth / 500) * 100}%` : undefined,
                      overflow: f.maxWidth ? "hidden" : undefined,
                      textOverflow: f.maxWidth ? "ellipsis" : undefined,
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    {formatValue(raw, f.uppercase)}
                  </span>
                </span>
              );
            })}
          </div>

          {/* Reverso: dibujado (sin foto de referencia para esta cara) */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <canvas ref={backCanvasRef} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </button>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[var(--text-faint)] mt-2">
        <RotateCw className="h-3.5 w-3.5" /> Toca el documento para ver el reverso
      </p>
    </div>
  );
}

"use client";

import { PASSPORT_COVER_IMAGE, PASSPORT_DATA_LAYOUT } from "@/lib/documentLayouts";
import type { DocumentFieldValues } from "./buildDocumentTexture";

function formatValue(raw: string | undefined, uppercase?: boolean) {
  if (!raw) return "";
  return uppercase ? raw.toUpperCase() : raw;
}

/**
 * El pasaporte son literalmente tus 2 imágenes de referencia, una por
 * página, apiladas verticalmente (página 1 arriba, página 2 abajo) y
 * siempre visibles — sin tapa inventada ni interacción de apertura.
 */
export default function PassportBook2D({
  values,
  photoUrl,
}: {
  values: DocumentFieldValues;
  photoUrl?: string;
}) {
  const values_: Record<string, string | undefined> = values;

  return (
    <div className="w-full">
      <div
        className="relative w-full max-w-md mx-auto overflow-hidden rounded-xl shadow-2xl bg-[#0a0a12]"
        style={{ aspectRatio: "500 / 700" }}
      >
        {/* Doble página, apiladas verticalmente, siempre en su tamaño final */}
        <div className="absolute inset-0 flex flex-col">
          <div className="relative w-full overflow-hidden" style={{ height: "50%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PASSPORT_COVER_IMAGE} alt="Página 1 del pasaporte" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          </div>
          <div className="relative w-full overflow-hidden" style={{ height: "50%", containerType: "inline-size" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PASSPORT_DATA_LAYOUT.image}
              alt="Página 2 del pasaporte"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "translateY(-5px)" }}
              draggable={false}
            />

            {PASSPORT_DATA_LAYOUT.photo && (
              <div
                className="absolute overflow-hidden bg-black/10"
                style={{
                  left: `${(PASSPORT_DATA_LAYOUT.photo.x - PASSPORT_DATA_LAYOUT.photo.w / 2) * 100}%`,
                  top: `${(PASSPORT_DATA_LAYOUT.photo.y - PASSPORT_DATA_LAYOUT.photo.h / 2) * 100}%`,
                  width: `${PASSPORT_DATA_LAYOUT.photo.w * 100}%`,
                  height: `${PASSPORT_DATA_LAYOUT.photo.h * 100}%`,
                  borderRadius: PASSPORT_DATA_LAYOUT.photo.shape === "circle" ? "50%" : "3px",
                }}
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/15">
                    <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 text-black/35" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
            )}

            {PASSPORT_DATA_LAYOUT.fields.map((f) => {
              const raw = values_[f.key];
              if (!raw) return null;
              return (
                <span
                  key={f.key}
                  className="absolute whitespace-nowrap"
                  style={{
                    left: `${f.x * 100}%`,
                    top: `${f.y * 100}%`,
                    transform: "translateY(-50%)",
                    fontSize: `${(f.size / 500) * 100}cqw`,
                    lineHeight: 1,
                    fontWeight: f.weight || 600,
                    color: f.color,
                    maxWidth: f.maxWidth ? `${(f.maxWidth / 500) * 100}%` : undefined,
                    overflow: f.maxWidth ? "hidden" : undefined,
                    textOverflow: f.maxWidth ? "ellipsis" : undefined,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {formatValue(raw, f.uppercase)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Sombra de pliegue central: hace que las 2 páginas se lean como una sola hoja abierta */}
        <div
          className="absolute inset-x-0 pointer-events-none"
          style={{
            top: "50%",
            height: "18px",
            transform: "translateY(-50%)",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.22), rgba(0,0,0,0) 35%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.22))",
          }}
        />
      </div>
    </div>
  );
}

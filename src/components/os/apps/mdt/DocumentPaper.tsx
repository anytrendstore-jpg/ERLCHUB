"use client";

import { Oswald, Courier_Prime } from "next/font/google";
import { useDepartment } from "@/contexts/DepartmentContext";

const oswald = Oswald({ subsets: ["latin"], weight: ["600"] });
const courierPrime = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"] });

export interface DocumentField {
  label: string;
  value: string;
  full?: boolean;
}

export interface DocumentTable {
  headers: string[];
  rows: string[][];
}

export interface DocumentPaperProps {
  formTitle: string;
  agencySub?: string;
  fileNo: string;
  date: string;
  stamp?: string;
  photoLabel?: string;
  fields: DocumentField[];
  table?: DocumentTable;
  sectionLabel?: string;
  sectionText?: string;
  officerName: string;
  officerBadge?: string;
  signed?: boolean;
  /** Modo edición inline — se ignora si `locked` es true. */
  editable?: boolean;
  /** Documento finalizado como PDF: siempre de solo lectura, con sello de "final". */
  locked?: boolean;
  onFieldChange?: (label: string, value: string) => void;
  onSectionTextChange?: (text: string) => void;
}

/**
 * Formulario impreso real: la misma pieza visual del boceto aprobado,
 * alimentada con datos reales de Reportes/Arrestos/Multas/Órdenes/BOLOs.
 * Admite edición inline de los campos y la narrativa (mismo look tipográfico,
 * solo con cursor editable) mientras no esté bloqueado como PDF.
 */
export default function DocumentPaper({
  formTitle, agencySub = "Bureau of Records", fileNo, date, stamp, photoLabel,
  fields, table, sectionLabel, sectionText, officerName, officerBadge, signed,
  editable, locked, onFieldChange, onSectionTextChange,
}: DocumentPaperProps) {
  const department = useDepartment();
  const canEdit = editable && !locked;
  return (
    <div className="bg-[#f2ecda] text-[#2c2618] w-full h-full overflow-y-auto relative" style={{ backgroundImage: "radial-gradient(ellipse at 25% 15%, rgba(0,0,0,0.045), transparent 55%)" }}>
      {locked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-10">
          <span className={`${oswald.className} text-[#a4453b]/15 font-black text-[92px] tracking-widest -rotate-[22deg] select-none whitespace-nowrap`}>
            PDF — FINAL
          </span>
        </div>
      )}
      <div className="p-6 sm:p-8 max-w-2xl mx-auto relative">
        {/* Encabezado: escudo + dependencia + título del formulario */}
        <div className="flex items-center gap-3 mb-4">
          <img src={department.badge} alt={department.factionAbbreviation} className="h-14 w-auto flex-shrink-0" />
          <div className="leading-tight flex-1">
            <div className="font-extrabold text-sm tracking-wide">{department.name}</div>
            <div className="font-mono text-[10px] tracking-widest text-[#6b6448] uppercase">{agencySub}</div>
            <div className={`${oswald.className} font-semibold text-lg tracking-wide uppercase mt-0.5`}>{formTitle}</div>
          </div>
          {locked && (
            <span className="flex-shrink-0 border border-[#a4453b] text-[#a4453b] px-2 py-1 text-[9px] font-mono tracking-widest rounded-sm">
              PDF<br />BLOQUEADO
            </span>
          )}
        </div>

        {/* Línea superior: expediente / fecha / sello */}
        <div className="flex items-center justify-between border-t-2 border-b border-[#2c2618] py-1.5 mb-4 font-mono text-[10px] text-[#6b6448]">
          <span>FILE NO <b className="text-[#2c2618] font-bold">{fileNo}</b></span>
          <span>DATE <b className="text-[#2c2618] font-bold">{date}</b></span>
          {stamp && <span className="border border-[#a4453b] text-[#a4453b] px-2 py-0.5 tracking-widest rounded-sm">{stamp}</span>}
        </div>

        {/* Campos */}
        <div className="flex gap-3">
          {photoLabel && (
            <div
              className="w-16 h-20 border border-[#2c2618] flex-shrink-0 flex items-center justify-center text-center font-mono text-[8px] text-[#948c6c] tracking-wide"
              style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(44,38,24,0.05) 4px, rgba(44,38,24,0.05) 5px)" }}
            >
              {photoLabel}
            </div>
          )}
          <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-2 content-start">
            {fields.map((f, i) => (
              <div key={i} className={f.full ? "col-span-2" : ""}>
                <label className="block font-mono text-[8px] tracking-wide uppercase text-[#6b6448] mb-0.5">{f.label}</label>
                {canEdit ? (
                  <input
                    value={f.value}
                    onChange={(e) => onFieldChange?.(f.label, e.target.value)}
                    className={`${courierPrime.className} w-full bg-transparent text-sm border-b border-[#2c2618] pb-0.5 min-h-[18px] focus:outline-none focus:bg-[#e8dfc2]`}
                  />
                ) : (
                  <div className={`${courierPrime.className} text-sm border-b border-[#2c2618] pb-0.5 min-h-[18px] break-words`}>{f.value || "—"}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tabla (cargos, personas involucradas, etc.) */}
        {table && table.rows.length > 0 && (
          <div className="mt-4">
            <div className="font-mono text-[9px] tracking-widest uppercase text-[#6b6448] mb-1.5 pt-3 border-t border-dashed border-[#b8b19a]">Detalle</div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {table.headers.map((h, i) => (
                    <th key={i} className="font-mono text-[8px] tracking-wide uppercase text-[#6b6448] border-b border-[#2c2618] pb-1 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-[#c3bda5]">
                    {row.map((cell, ci) => (
                      <td key={ci} className={`${courierPrime.className} text-xs py-1.5 pr-3 align-top`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Narrativa */}
        {sectionLabel && (
          <div className="mt-4">
            <div className="font-mono text-[9px] tracking-widest uppercase text-[#6b6448] mb-1.5 pt-3 border-t border-dashed border-[#b8b19a]">{sectionLabel}</div>
            {canEdit ? (
              <textarea
                value={sectionText || ""}
                onChange={(e) => onSectionTextChange?.(e.target.value)}
                rows={5}
                className={`${courierPrime.className} w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none focus:bg-[#e8dfc2]`}
              />
            ) : (
              <p className={`${courierPrime.className} text-sm leading-relaxed whitespace-pre-wrap`}>{sectionText || "Sin datos."}</p>
            )}
          </div>
        )}

        {/* Firma */}
        <div className="mt-6 pt-3 flex items-end justify-between font-mono text-[9px] text-[#6b6448]">
          <div>OFFICER <b className="text-[#2c2618] font-bold">{officerName}</b>{officerBadge ? <> · BADGE <b className="text-[#2c2618] font-bold">{officerBadge}</b></> : null}</div>
          <div className="w-32 border-t border-[#2c2618] pt-1 text-center">
            {signed ? <span className={`${courierPrime.className} text-[#2c2618]`}>{officerName}</span> : "SIGNATURE"}
          </div>
        </div>
      </div>
    </div>
  );
}

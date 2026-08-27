"use client";

import { useState } from "react";
import { Plus, FileText, X } from "lucide-react";
import { useFD } from "@/contexts/FDContext";
import type { FireReportType } from "@/lib/fdTypes";

const REPORT_TYPES: FireReportType[] = ["Structure Fire", "Medical", "Hazmat", "Rescue", "Vehicle Fire", "Investigation", "Training", "Other"];

const STATUS_STYLE: Record<string, string> = {
  Draft: "text-[#867e70]",
  "Pending Review": "text-amber-300",
  Approved: "text-emerald-300",
  Rejected: "text-red-400",
};

/** Reportes de incidente de LSFD — espejo simplificado de MDTReports.tsx. */
export default function FDReports() {
  const { state, createReport } = useFD();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ type: "Structure Fire" as FireReportType, title: "", location: "", narrative: "" });
  const firefighter = state.currentFirefighter;

  const submit = () => {
    if (!firefighter || !form.title.trim() || !form.narrative.trim()) return;
    createReport({
      type: form.type,
      status: "Draft",
      title: form.title.trim(),
      narrative: form.narrative.trim(),
      firefighterId: firefighter.id,
      firefighterName: `${firefighter.firstName} ${firefighter.lastName}`,
      location: form.location.trim(),
      dateTime: new Date(),
      unitsInvolved: firefighter.callsign ? [firefighter.callsign] : [],
    });
    setForm({ type: "Structure Fire", title: "", location: "", narrative: "" });
    setShowNew(false);
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-end px-2.5 border-b border-[#2a2620] flex-shrink-0">
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[#c1975a] hover:text-[#e5e3de] transition-colors">
          <Plus className="w-3 h-3" /> Nuevo reporte
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew && (
          <div className="mb-3 bg-[#141312] border border-[#2a2620] rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nuevo reporte de incidente</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FireReportType })} className="w-full bg-[#0e0d0c] border border-[#2a2620] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[#c1975a]">
              {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-[#0e0d0c] border border-[#2a2620] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[#c1975a]" />
            <input placeholder="Ubicación" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-[#0e0d0c] border border-[#2a2620] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[#c1975a]" />
            <textarea placeholder="Narrativa" value={form.narrative} onChange={(e) => setForm({ ...form, narrative: e.target.value })} rows={4} className="w-full bg-[#0e0d0c] border border-[#2a2620] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[#c1975a] resize-none" />
            <button disabled={!form.title.trim() || !form.narrative.trim()} onClick={submit} className="w-full bg-[#c1975a] disabled:opacity-40 text-[#0a0a0c] font-semibold rounded py-1.5">
              Guardar borrador
            </button>
          </div>
        )}

        {state.reports.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <FileText className="w-8 h-8" />
            <p>Sin reportes registrados.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {state.reports.map((r) => (
              <div key={r.id} className="px-3 py-2 rounded bg-[#141312] border border-[#2a2620]">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[#e5e3de] font-medium truncate">{r.title}</span>
                  <span className={`text-[9.5px] font-bold flex-shrink-0 ${STATUS_STYLE[r.status] || "text-[#867e70]"}`}>{r.status}</span>
                </div>
                <p className="text-[#867e70] text-[10px]">{r.reportNumber} · {r.type} · {r.firefighterName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

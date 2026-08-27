"use client";

import { useState } from "react";
import { Settings, Power } from "lucide-react";
import { useFD } from "@/contexts/FDContext";
import type { FireUnitStatus, FireUnitType } from "@/lib/fdTypes";

const UNIT_OPTIONS: FireUnitType[] = ["Engine", "Truck", "Rescue", "EMS", "Battalion"];
const STATUS_OPTIONS: FireUnitStatus[] = ["Available", "Dispatched", "En Route", "On Scene", "Transporting", "Out of Service"];

/** Autoservicio del bombero — unidad/callsign/estado propios, ver updateSelf() en FDContext (PATCH /api/fd/firefighter). */
export default function FDSettings() {
  const { state, updateSelf } = useFD();
  const ff = state.currentFirefighter;
  const [unit, setUnit] = useState<FireUnitType | "">(ff?.unit || "");
  const [callsign, setCallsign] = useState(ff?.callsign || "");

  if (!ff) return null;

  const saveUnit = () => updateSelf({ unit: unit || undefined, callsign: callsign.trim() || undefined });

  return (
    <div className="h-full overflow-y-auto p-3 text-[11px] space-y-4">
      <div>
        <div className="flex items-center gap-1.5 text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-2">
          <Settings className="w-3 h-3" /> Estado de servicio
        </div>
        <div className="flex items-center justify-between px-3 py-2.5 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
          <div>
            <p className="text-[#e5e3de] font-medium">{ff.onDuty ? "En servicio" : "Fuera de servicio"}</p>
            <p className="text-[#867e70] text-[10px]">{ff.rankName} · #{ff.badgeNumber}</p>
          </div>
          <button
            onClick={() => updateSelf({ onDuty: !ff.onDuty })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-[10px] transition-colors ${ff.onDuty ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"}`}
          >
            <Power className="w-3.5 h-3.5" /> {ff.onDuty ? "Salir de servicio" : "Entrar en servicio"}
          </button>
        </div>
      </div>

      <div>
        <div className="text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-2">Unidad asignada</div>
        <div className="space-y-2 px-3 py-2.5 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
          <select value={unit} onChange={(e) => setUnit(e.target.value as FireUnitType)} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]">
            <option value="">Sin unidad</option>
            {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <input placeholder="Callsign (ej. E12)" value={callsign} onChange={(e) => setCallsign(e.target.value)} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
          <button onClick={saveUnit} className="w-full bg-[var(--dept-accent,#d4af37)] text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
            Guardar
          </button>
        </div>
      </div>

      <div>
        <div className="text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-2">Estado operativo</div>
        <select
          value={ff.status}
          onChange={(e) => updateSelf({ status: e.target.value as FireUnitStatus })}
          className="w-full bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded px-3 py-2 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

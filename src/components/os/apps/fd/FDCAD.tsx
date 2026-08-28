"use client";

import { useEffect, useState } from "react";
import { Flame, MapPin, Clock, Plus, X, History } from "lucide-react";
import { useFD } from "@/contexts/FDContext";
import type { CallStatus } from "@/lib/mdtTypes";

interface TimelineEntry { id: string; event: string; description: string; actorName: string; timestamp: string }

function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const PRIORITY_STYLE: Record<string, { label: string; text: string; dot: string }> = {
  Emergency: { label: "CRÍTICA", text: "text-red-400", dot: "bg-red-500" },
  High: { label: "ALTA", text: "text-[#d4af37]", dot: "bg-[#d4af37]" },
  Medium: { label: "MEDIA", text: "text-amber-300", dot: "bg-amber-400" },
  Low: { label: "BAJA", text: "text-emerald-300", dot: "bg-emerald-400" },
};

const STATUS_OPTIONS: CallStatus[] = ["Pending", "En Route", "On Scene", "Resolved", "Cancelled"];

function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

/** Despacho de LSFD — lista los incidentes filtrados a Bomberos (vía /api/fd/calls), sin BOLOs/arrestos/citaciones. */
export default function FDCAD() {
  const { state, updateCall, assignUnitToCall } = useFD();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unitInput, setUnitInput] = useState("");
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);

  const active = state.calls.filter((c) => c.status !== "Resolved" && c.status !== "Cancelled");
  const selected = state.calls.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    if (!selectedId) { setTimeline(null); return; }
    setTimeline(null);
    fetch(`/api/fd/timeline?callId=${selectedId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTimeline(d.success ? d.entries : []))
      .catch(() => setTimeline([]));
  }, [selectedId]);

  return (
    <div className="h-full flex text-[11px]">
      <div className="w-64 flex-shrink-0 border-r border-[#2a2620] overflow-y-auto">
        <div className="px-3 py-2 text-[9px] font-semibold tracking-widest text-[#57534a] uppercase border-b border-[#2a2620]">
          Incidentes activos ({active.length})
        </div>
        {active.length === 0 ? (
          <p className="text-[#57534a] p-3">Sin incidentes activos.</p>
        ) : (
          active.map((c) => {
            const style = PRIORITY_STYLE[c.priority] || PRIORITY_STYLE.Medium;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-[#1a1917] transition-colors ${selectedId === c.id ? "bg-[#181715]" : "hover:bg-[#141312]"}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <span className={`text-[9.5px] font-bold ${style.text}`}>{style.label}</span>
                  <span className="text-[#57534a] text-[9.5px] ml-auto font-mono">{fmtTime(c.createdAt)}</span>
                </div>
                <p className="text-[#e5e3de] font-medium truncate">{c.title || c.type}</p>
                <p className="text-[#867e70] truncate flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{c.scene || c.location}</p>
              </button>
            );
          })
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2">
            <Flame className="w-8 h-8" />
            <p>Seleccioná un incidente para ver el detalle.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold ${(PRIORITY_STYLE[selected.priority] || PRIORITY_STYLE.Medium).text}`}>
                  {(PRIORITY_STYLE[selected.priority] || PRIORITY_STYLE.Medium).label}
                </span>
                <span className="text-[#57534a] font-mono text-[10px]">#{selected.callNumber}</span>
              </div>
              <h2 className="text-[#e5e3de] text-lg font-bold">{selected.title || selected.type}</h2>
              <p className="text-[#867e70] flex items-center gap-1.5 mt-1"><MapPin className="w-3.5 h-3.5" />{selected.scene || selected.location}</p>
              <p className="text-[#867e70] flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{fmtTime(selected.createdAt)}</p>
            </div>

            {selected.description && (
              <div>
                <div className="text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-1">Descripción</div>
                <p className="text-[#c7c2b6]">{selected.description}</p>
              </div>
            )}

            <div>
              <div className="text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-1.5">Estado</div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateCall(selected.id, { status: s })}
                    className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${selected.status === s ? "bg-[#d4af37] text-[#0a0a0c]" : "bg-[#1a1917] border border-[#2a2620] text-[#867e70] hover:text-[#e5e3de]"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-1.5">Unidades asignadas</div>
              {selected.assignedUnits.length === 0 ? (
                <p className="text-[#57534a]">Sin unidades asignadas.</p>
              ) : (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selected.assignedUnits.map((u) => (
                    <span key={u} className="px-1.5 py-0.5 rounded bg-[#1a1917] border border-[#2a2620] text-[#d4af37] font-mono text-[10px]">{u}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <input
                  value={unitInput}
                  onChange={(e) => setUnitInput(e.target.value)}
                  placeholder="ej. E12, T3, R5"
                  className="flex-1 min-w-0 bg-[#141312] border border-[#2a2620] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[#d4af37]"
                />
                <button
                  disabled={!unitInput.trim()}
                  onClick={() => { assignUnitToCall(selected.id, unitInput.trim()); setUnitInput(""); }}
                  className="flex items-center gap-1 px-2.5 rounded bg-[#d4af37] disabled:opacity-40 text-[#0a0a0c] font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <div className="text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-1.5 flex items-center gap-1.5">
                <History className="w-3 h-3" /> Timeline
              </div>
              {timeline === null ? (
                <p className="text-[#57534a]">Cargando...</p>
              ) : timeline.length === 0 ? (
                <p className="text-[#57534a]">Sin eventos registrados todavía.</p>
              ) : (
                <div className="space-y-1.5">
                  {timeline.map((e) => (
                    <div key={e.id} className="flex items-start gap-2 text-[#867e70]">
                      <span className="font-mono text-[9.5px] text-[#57534a] w-24 flex-shrink-0">{fmtDateTime(e.timestamp)}</span>
                      <div className="min-w-0">
                        <span className="text-[#d4af37] font-semibold">{e.event}:</span> {e.description}
                        <span className="text-[#57534a]"> — {e.actorName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setSelectedId(null)} className="flex items-center gap-1 text-[#57534a] hover:text-[#e5e3de] text-[10px]">
              <X className="w-3.5 h-3.5" /> Cerrar detalle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

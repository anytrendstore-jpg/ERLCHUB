"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, Radio as RadioIcon, ClipboardList, Package, HeartPulse, Lock, MapPin } from "lucide-react";
import { useFD } from "@/contexts/FDContext";
import type { CommandAssignment, CommandRoleKey } from "@/lib/fdTypes";

const ROLES: { key: CommandRoleKey; label: string; icon: typeof Shield }[] = [
  { key: "commander", label: "Comandante del Incidente", icon: Shield },
  { key: "operations", label: "Operaciones", icon: RadioIcon },
  { key: "planning", label: "Planificación", icon: ClipboardList },
  { key: "logistics", label: "Logística", icon: Package },
  { key: "safety", label: "Seguridad", icon: HeartPulse },
];

/** Sistema de Comando de Incidentes — organigrama estándar atado a un incidente puntual. Concepto sin análogo en el MDT de policía. */
export default function FDIncidentCommand() {
  const { state, isCommand } = useFD();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<CommandAssignment[] | null>(null);
  const [saving, setSaving] = useState<CommandRoleKey | null>(null);

  const active = state.calls.filter((c) => c.status !== "Resolved" && c.status !== "Cancelled");
  const selected = state.calls.find((c) => c.id === selectedId) || null;
  const onDutyPersonnel = state.personnel.filter((p) => p.onDuty);

  const load = useCallback(async (callId: string) => {
    const res = await fetch(`/api/fd/command?callId=${callId}`, { cache: "no-store" });
    const data = await res.json();
    setAssignments(data.success && data.command ? data.command.assignments : []);
  }, []);

  useEffect(() => {
    if (selectedId) load(selectedId);
    else setAssignments(null);
  }, [selectedId, load]);

  const assign = async (role: CommandRoleKey, firefighterId: string) => {
    if (!selectedId) return;
    const person = onDutyPersonnel.find((p) => p.id === firefighterId);
    setSaving(role);
    try {
      const res = await fetch("/api/fd/command", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: selectedId,
          role,
          firefighterId: person?.id,
          firefighterName: person ? `${person.firstName} ${person.lastName}` : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) setAssignments(data.command.assignments);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="h-full flex text-[11px]">
      <div className="w-56 flex-shrink-0 border-r border-[var(--dept-window-border,#2a2620)] overflow-y-auto">
        <div className="px-3 py-2 text-[9px] font-semibold tracking-widest text-[#57534a] uppercase border-b border-[var(--dept-window-border,#2a2620)]">
          Incidentes activos ({active.length})
        </div>
        {active.length === 0 ? (
          <p className="text-[#57534a] p-3">Sin incidentes activos.</p>
        ) : (
          active.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-[#1a1917] transition-colors ${selectedId === c.id ? "bg-[#181715]" : "hover:bg-[#141312]"}`}
            >
              <p className="text-[#e5e3de] font-medium truncate">{c.title || c.type}</p>
              <p className="text-[#867e70] truncate flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{c.scene || c.location}</p>
            </button>
          ))
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2">
            <Shield className="w-8 h-8" />
            <p>Seleccioná un incidente para gestionar el comando.</p>
          </div>
        ) : (
          <div className="max-w-md space-y-3">
            <div>
              <h2 className="text-[#e5e3de] text-lg font-bold">{selected.title || selected.type}</h2>
              <p className="text-[#867e70]">{selected.scene || selected.location}</p>
            </div>

            {!isCommand && (
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)] text-[#867e70]">
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                Solo lectura — necesitás jerarquía de mando (nivel 4+) para asignar roles.
              </div>
            )}

            {assignments === null ? (
              <p className="text-[#57534a]">Cargando...</p>
            ) : (
              <div className="space-y-2">
                {ROLES.map(({ key, label, icon: Icon }) => {
                  const current = assignments.find((a) => a.role === key);
                  return (
                    <div key={key} className="flex items-center gap-2.5 px-3 py-2 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
                      <Icon className="w-4 h-4 text-[var(--dept-accent,#d4af37)] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-semibold tracking-wide text-[#57534a] uppercase">{label}</p>
                        {isCommand ? (
                          <select
                            value={current?.firefighterId || ""}
                            onChange={(e) => assign(key, e.target.value)}
                            disabled={saving === key}
                            className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-1.5 py-1 text-[#e5e3de] text-[10.5px] focus:outline-none focus:border-[var(--dept-accent,#d4af37)] mt-0.5"
                          >
                            <option value="">Sin asignar</option>
                            {onDutyPersonnel.map((p) => (
                              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}{p.callsign ? ` (${p.callsign})` : ""}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-[#e5e3de] mt-0.5">{current?.firefighterName || "Sin asignar"}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

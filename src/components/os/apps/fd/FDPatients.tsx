"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, HeartPulse, X, Search } from "lucide-react";
import type { FDPatient, FDPatientStatus, FDVitals } from "@/lib/fdTypes";

const STATUS_OPTIONS: FDPatientStatus[] = ["Treated on Scene", "Transported", "Refused Care", "DOA"];
const STATUS_STYLE: Record<FDPatientStatus, string> = {
  "Treated on Scene": "text-emerald-300",
  Transported: "text-[var(--dept-accent,#d4af37)]",
  "Refused Care": "text-[#867e70]",
  DOA: "text-red-400",
};

const EMPTY_FORM = { name: "", ageEstimate: "", chiefComplaint: "", bp: "", hr: "", rr: "", spo2: "", gcs: "" };

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Atención prehospitalaria (EMS/PCR) — registro del paciente, separado del reporte de incidente (FDReports). */
export default function FDPatients() {
  const [items, setItems] = useState<FDPatient[] | null>(null);
  const [selected, setSelected] = useState<FDPatient | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [treatmentDraft, setTreatmentDraft] = useState("");
  const [hospitalDraft, setHospitalDraft] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fd/patients", { cache: "no-store" });
      const data = await res.json();
      setItems(data.success ? data.patients : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setTreatmentDraft(selected?.treatment || ""); setHospitalDraft(selected?.hospital || ""); }, [selected?.id]);

  const submit = async () => {
    if (!form.name.trim() || !form.chiefComplaint.trim()) return;
    const vitals: FDVitals = { bp: form.bp || undefined, hr: form.hr || undefined, rr: form.rr || undefined, spo2: form.spo2 || undefined, gcs: form.gcs || undefined };
    const res = await fetch("/api/fd/patients", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, ageEstimate: form.ageEstimate, chiefComplaint: form.chiefComplaint, vitals }),
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => (prev ? [data.patient, ...prev] : [data.patient]));
      setForm(EMPTY_FORM);
      setShowNew(false);
    }
  };

  const update = async (id: string, updates: Partial<FDPatient>) => {
    setItems((prev) => prev && prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
    const res = await fetch("/api/fd/patients", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => prev && prev.map((p) => (p.id === id ? data.patient : p)));
      setSelected((prev) => (prev && prev.id === id ? data.patient : prev));
    }
  };

  return (
    <div className="h-full flex text-[11px]">
      <div className="w-64 flex-shrink-0 border-r border-[var(--dept-window-border,#2a2620)] flex flex-col">
        <div className="h-8 flex items-center justify-end px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[var(--dept-accent,#d4af37)] hover:text-[#e5e3de] transition-colors">
            <Plus className="w-3 h-3" /> Registrar paciente
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items === null ? (
            <p className="text-[#57534a] p-3">Cargando...</p>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8 px-3">
              <HeartPulse className="w-8 h-8" />
              <p>Sin pacientes registrados.</p>
            </div>
          ) : (
            items.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`w-full text-left px-3 py-2 border-b border-[var(--dept-window-border,#1e1c19)] transition-colors ${selected?.id === p.id ? "bg-[#181715]" : "hover:bg-[#141312]"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#e5e3de] font-medium truncate">{p.name}</span>
                  <span className={`text-[9px] font-bold flex-shrink-0 ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                </div>
                <p className="text-[#867e70] text-[10px] truncate">{p.chiefComplaint}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew ? (
          <div className="bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded p-3 space-y-2 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nuevo paciente</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <div className="flex gap-2">
              <input placeholder="Nombre (o 'Desconocido')" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="flex-1 min-w-0 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
              <input placeholder="Edad aprox." value={form.ageEstimate} onChange={(e) => setForm({ ...form, ageEstimate: e.target.value })} className="w-24 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            </div>
            <input placeholder="Motivo de consulta" value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="TA" value={form.bp} onChange={(e) => setForm({ ...form, bp: e.target.value })} className="bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
              <input placeholder="FC" value={form.hr} onChange={(e) => setForm({ ...form, hr: e.target.value })} className="bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
              <input placeholder="FR" value={form.rr} onChange={(e) => setForm({ ...form, rr: e.target.value })} className="bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
              <input placeholder="SpO2" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} className="bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
              <input placeholder="GCS" value={form.gcs} onChange={(e) => setForm({ ...form, gcs: e.target.value })} className="col-span-2 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            </div>
            <button disabled={!form.name.trim() || !form.chiefComplaint.trim()} onClick={submit} className="w-full bg-[var(--dept-accent,#d4af37)] disabled:opacity-40 text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
              Registrar
            </button>
          </div>
        ) : selected ? (
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[#e5e3de] font-semibold text-[13px]">{selected.name}{selected.ageEstimate ? ` · ${selected.ageEstimate}` : ""}</h3>
                <p className="text-[#867e70] text-[10px]">{fmtDateTime(selected.createdAt as unknown as string)} · {selected.treatedByName}</p>
              </div>
              <select
                value={selected.status}
                onChange={(e) => update(selected.id, { status: e.target.value as FDPatientStatus })}
                className={`bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1 text-[10px] font-semibold focus:outline-none ${STATUS_STYLE[selected.status]}`}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <span className="text-[#57534a] text-[10px] uppercase tracking-wide">Motivo de consulta</span>
              <p className="text-[#e5e3de] mt-1">{selected.chiefComplaint}</p>
            </div>

            <div>
              <span className="text-[#57534a] text-[10px] uppercase tracking-wide">Signos vitales</span>
              <div className="grid grid-cols-5 gap-2 mt-1 text-center">
                {(["bp", "hr", "rr", "spo2", "gcs"] as const).map((k) => (
                  <div key={k} className="bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded py-1.5">
                    <p className="text-[#57534a] text-[9px] uppercase">{k}</p>
                    <p className="text-[#e5e3de] font-mono">{selected.vitals[k] || "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[#57534a] text-[10px] uppercase tracking-wide">Tratamiento</span>
              <textarea
                rows={3} placeholder="Sin tratamiento registrado todavía."
                value={treatmentDraft} onChange={(e) => setTreatmentDraft(e.target.value)}
                onBlur={() => { if (treatmentDraft !== (selected.treatment || "")) update(selected.id, { treatment: treatmentDraft }); }}
                className="w-full mt-1 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] resize-none focus:outline-none focus:border-[var(--dept-accent,#d4af37)]"
              />
            </div>

            <div>
              <span className="text-[#57534a] text-[10px] uppercase tracking-wide">Hospital de destino</span>
              <input
                placeholder="Sin destino registrado."
                value={hospitalDraft} onChange={(e) => setHospitalDraft(e.target.value)}
                onBlur={() => { if (hospitalDraft !== (selected.hospital || "")) update(selected.id, { hospital: hospitalDraft }); }}
                className="w-full mt-1 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]"
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2">
            <Search className="w-8 h-8" />
            <p>Seleccioná un paciente para ver el detalle.</p>
          </div>
        )}
      </div>
    </div>
  );
}

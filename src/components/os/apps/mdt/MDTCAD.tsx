"use client";

import { useEffect, useMemo, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import type { Call, CallPriority, CallType, CallSuspect } from "@/lib/mdtTypes";
import {
  Plus,
  Search,
  MapPin,
  Clock,
  RotateCcw,
  Pencil,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Car,
} from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function fmtDateTime(d?: Date | string) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    ", " + date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function toInputDateTime(d?: Date | string) {
  if (!d) return "";
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const PRIORITY_DOT: Record<CallPriority, string> = {
  Low: "bg-blue-400",
  Medium: "bg-yellow-400",
  High: "bg-orange-400",
  Emergency: "bg-red-500",
};

export function MDTCADContent() {
  const { state, addCall, updateCall, deleteCall } = useMDT();
  const { calls, currentOfficer } = state;

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showNewCall, setShowNewCall] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return calls;
    return calls.filter((c) =>
      (c.title || c.type).toLowerCase().includes(q) ||
      c.callNumber.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
    );
  }, [calls, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageCalls = filtered.slice(page * pageSize, page * pageSize + pageSize);

  useEffect(() => { setPage(0); }, [search, pageSize]);
  useEffect(() => {
    if (!selectedId && calls.length > 0) setSelectedId(calls[0].id);
  }, [calls, selectedId]);

  const selected = calls.find((c) => c.id === selectedId) || null;

  return (
    <>
      <div className="h-full flex bg-[#05070d] text-slate-200 text-sm">
        {/* Lista de incidentes */}
        <div className="w-[300px] flex-shrink-0 border-r border-[#151d31] flex flex-col">
          <div className="p-3 border-b border-[#151d31] flex items-center gap-2">
            <span className="text-slate-400 text-xs font-bold tracking-wide">INCIDENTES</span>
            <button onClick={() => setShowNewCall(true)} className="ml-auto w-6 h-6 rounded bg-[#1c2b4d] hover:bg-[#3c68c9] flex items-center justify-center text-white transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-3 border-b border-[#151d31]">
            <div className="relative">
              <input
                value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Búsqueda"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9]"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {pageCalls.length === 0 && (
              <p className="text-slate-600 text-xs text-center py-8 px-4">Sin incidentes.</p>
            )}
            {pageCalls.map((call) => {
              const isActive = call.id === selectedId;
              return (
                <button
                  key={call.id}
                  onClick={() => setSelectedId(call.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-[#111a2c] transition-colors ${isActive ? "bg-[#1c2b4d]" : "hover:bg-[#0f1729]"}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[call.priority]}`} />
                      <span className="text-white text-xs font-bold uppercase truncate">{call.title || call.type}</span>
                      {call.source === "citizen" && (
                        <span className="flex-shrink-0 text-[9px] font-bold text-red-300 bg-red-500/15 ring-1 ring-red-500/30 rounded px-1 py-0.5">911</span>
                      )}
                    </span>
                    <span className="text-slate-500 text-[10px] flex-shrink-0">#{call.callNumber.replace(/\D/g, "").slice(-4) || call.callNumber}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate uppercase">{call.scene || call.location}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 min-w-0">
                      <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{fmtDateTime(call.incidentStart || call.createdAt)}{call.incidentEnd ? ` - ${fmtDateTime(call.incidentEnd)}` : ""}</span>
                    </span>
                    {call.assignedUnits[0] && (
                      <span className="flex items-center gap-1 text-slate-400 flex-shrink-0 bg-[#121a2e] border border-[#1e2a45] rounded-full px-1.5 py-0.5">
                        <Car className="w-2.5 h-2.5" /> {call.assignedUnits[0]}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2.5 border-t border-[#151d31] flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>En página:</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="bg-[#121a2e] border border-[#1e2a45] rounded px-1 py-0.5 text-slate-300">
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span>{filtered.length === 0 ? "0" : `${page * pageSize + 1}-${Math.min(filtered.length, (page + 1) * pageSize)}`} / {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#111a2c] disabled:opacity-30">
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#111a2c] disabled:opacity-30">
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Datos */}
        {selected ? (
          <DataPanel key={selected.id} call={selected} onSave={(updates) => updateCall(selected.id, updates)} onDelete={() => { deleteCall(selected.id); setSelectedId(null); }} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">Selecciona un incidente</div>
        )}

        {/* Información adicional */}
        {selected && (
          <ExtraInfoPanel key={selected.id + "-extra"} call={selected} currentOfficer={currentOfficer} onSave={(updates) => updateCall(selected.id, updates)} />
        )}
      </div>

      {showNewCall && <NewCallModal onClose={() => setShowNewCall(false)} onCreated={(id) => setSelectedId(id)} />}
    </>
  );
}

export default function MDTCAD() {
  return (
    <MDTLayout title="Incidentes" subtitle="CAD / Despacho — Panel de incidentes activos" fullBleed>
      <MDTCADContent />
    </MDTLayout>
  );
}

/* ------------------------------------------------------------------ */

function DataPanel({ call, onSave, onDelete }: { call: Call; onSave: (updates: Partial<Call>) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [title, setTitle] = useState(call.title || call.type);
  const [scene, setScene] = useState(call.scene || call.location);
  const [start, setStart] = useState(toInputDateTime(call.incidentStart || call.createdAt));
  const [end, setEnd] = useState(toInputDateTime(call.incidentEnd));
  const [details, setDetails] = useState(call.details || call.description);
  const [dirty, setDirty] = useState(false);

  const mark = (setter: (v: string) => void) => (v: string) => { setter(v); setDirty(true); };

  const reset = () => {
    setTitle(call.title || call.type);
    setScene(call.scene || call.location);
    setStart(toInputDateTime(call.incidentStart || call.createdAt));
    setEnd(toInputDateTime(call.incidentEnd));
    setDetails(call.details || call.description);
    setDirty(false);
    setEditing(false);
  };

  const save = () => {
    onSave({
      title, scene, details,
      location: scene,
      description: details,
      incidentStart: start ? new Date(start) : undefined,
      incidentEnd: end ? new Date(end) : undefined,
    });
    setDirty(false);
    setEditing(false);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col border-r border-[#151d31]">
      <div className="px-4 py-2.5 border-b border-[#151d31] flex items-center gap-2">
        <span className="text-slate-400 text-xs font-bold tracking-wide">DATOS</span>
        <span className="text-slate-500 text-xs">#{call.callNumber}</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={reset} title="Descartar cambios" className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-[#111a2c] hover:text-slate-200"><RotateCcw className="w-3.5 h-3.5" /></button>
          <button onClick={() => setEditing((v) => !v)} title="Editar" className={`w-6 h-6 rounded flex items-center justify-center hover:bg-[#111a2c] ${editing ? "text-[#6f93d6]" : "text-slate-500 hover:text-slate-200"}`}><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={save} disabled={!dirty} title="Guardar" className="w-6 h-6 rounded flex items-center justify-center text-emerald-500 hover:bg-[#111a2c] disabled:opacity-30 disabled:hover:bg-transparent"><Save className="w-3.5 h-3.5" /></button>
          <button onClick={() => setConfirmDelete(true)} title="Eliminar incidente" className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        <Field label="Título" editing={editing}>
          {editing ? (
            <input value={title} onChange={(e) => mark(setTitle)(e.target.value)} className="w-full bg-transparent text-sm text-white focus:outline-none" />
          ) : <span className="text-sm text-white uppercase">{title}</span>}
        </Field>
        <Field label="Escena" editing={editing}>
          {editing ? (
            <input value={scene} onChange={(e) => mark(setScene)(e.target.value)} className="w-full bg-transparent text-sm text-white focus:outline-none" />
          ) : <span className="text-sm text-white uppercase">{scene}</span>}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tiempo de inicio del incidente" editing={editing} icon>
            {editing ? (
              <input type="datetime-local" value={start} onChange={(e) => mark(setStart)(e.target.value)} className="w-full bg-transparent text-xs text-white focus:outline-none" />
            ) : <span className="text-xs text-white">{fmtDateTime(start)}</span>}
          </Field>
          <Field label="Tiempo de fin del incidente" editing={editing} icon>
            {editing ? (
              <input type="datetime-local" value={end} onChange={(e) => mark(setEnd)(e.target.value)} className="w-full bg-transparent text-xs text-white focus:outline-none" />
            ) : <span className="text-xs text-white">{end ? fmtDateTime(end) : "—"}</span>}
          </Field>
        </div>
        <Field label="Detalles" editing={editing} grow>
          {editing ? (
            <textarea value={details} onChange={(e) => mark(setDetails)(e.target.value)} rows={12} placeholder="Descripción más detallada..." className="w-full bg-transparent text-sm text-white placeholder-slate-600 resize-none focus:outline-none" />
          ) : <p className="text-sm text-slate-300 whitespace-pre-wrap">{details || "Sin datos"}</p>}
        </Field>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-[#0d1424] border border-[#1e2a45] rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold mb-2">Eliminar incidente</h2>
            <p className="text-slate-400 text-sm mb-5">Esta acción no se puede deshacer. ¿Eliminar el incidente #{call.callNumber}?</p>
            <div className="flex gap-2">
              <button onClick={onDelete} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-semibold text-sm">Eliminar</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 bg-[#111a2c] hover:bg-[#151d31] text-white py-2 rounded-lg font-semibold text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, editing, grow, icon }: { label: string; children: React.ReactNode; editing?: boolean; grow?: boolean; icon?: boolean }) {
  return (
    <div className={`bg-[#121a2e] border rounded-lg px-3 py-2.5 relative ${editing ? "border-[#3c68c9]" : "border-[#151d31]"} ${grow ? "flex-1 min-h-[200px]" : ""}`}>
      <label className="block text-[#6f93d6]/80 text-[10px] font-semibold uppercase tracking-wide mb-1">{label}</label>
      {children}
      {icon && !editing && <Clock className="w-3.5 h-3.5 text-slate-600 absolute right-3 top-2.5" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Accordion({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="bg-[#121a2e] border border-[#151d31] rounded-lg mb-2 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-[#111a2c] transition-colors">
        <span className="text-slate-300 text-xs font-semibold">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>
      {open && <div className="px-3.5 pb-3 pt-0.5">{children}</div>}
    </div>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#121a2e] border border-[#1e2a45] text-slate-200 text-[11px] px-2 py-1 rounded-md mr-1.5 mb-1.5">
      {children}
      {onRemove && <button onClick={onRemove} className="text-slate-500 hover:text-red-400"><X className="w-2.5 h-2.5" /></button>}
    </span>
  );
}

function TagListEditor({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!draft.trim()) return;
    onChange([...values, draft.trim()]);
    setDraft("");
  };
  return (
    <div>
      <div className="mb-1.5">
        {values.length === 0 && <span className="text-slate-600 text-xs">Sin datos</span>}
        {values.map((v, i) => <Chip key={i} onRemove={() => onChange(values.filter((_, idx) => idx !== i))}>{v}</Chip>)}
      </div>
      <div className="flex gap-1.5">
        <input
          value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          className="flex-1 bg-[#121a2e] border border-[#1e2a45] rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]"
        />
        <button onClick={add} className="px-2 rounded bg-[#1c2b4d] hover:bg-[#3c68c9] text-white text-xs">+</button>
      </div>
    </div>
  );
}

function ExtraInfoPanel({ call, currentOfficer, onSave }: { call: Call; currentOfficer: any; onSave: (updates: Partial<Call>) => void }) {
  const [editing, setEditing] = useState(false);
  const [officersInvolved, setOfficersInvolved] = useState(call.officersInvolved || []);
  const [victims, setVictims] = useState(call.victims || []);
  const [suspects, setSuspects] = useState<CallSuspect[]>(call.suspects || []);
  const [suspectPlate, setSuspectPlate] = useState("");
  const [suspectName, setSuspectName] = useState("");
  const [witnesses, setWitnesses] = useState(call.witnesses || []);
  const [boloSuspect, setBoloSuspect] = useState(call.boloSuspect || "");
  const [boloVehicle, setBoloVehicle] = useState(call.boloVehicle || "");
  const [vehicleImpound, setVehicleImpound] = useState(call.vehicleImpound || "");
  const [citizenStatement, setCitizenStatement] = useState(call.citizenStatement || "");
  const [forensicsReport, setForensicsReport] = useState(call.forensicsReport || "");
  const [evidenceLogged, setEvidenceLogged] = useState(call.evidenceLogged || []);

  const addSuspect = () => {
    if (!suspectPlate.trim() && !suspectName.trim()) return;
    setSuspects((prev) => [...prev, { plate: suspectPlate.trim(), name: suspectName.trim() }]);
    setSuspectPlate(""); setSuspectName("");
  };

  const save = () => {
    onSave({ officersInvolved, victims, suspects, witnesses, boloSuspect, boloVehicle, vehicleImpound, citizenStatement, forensicsReport, evidenceLogged });
    setEditing(false);
  };

  return (
    <div className="w-[300px] flex-shrink-0 flex flex-col">
      <div className="px-4 py-2.5 border-b border-[#151d31] flex items-center gap-2">
        <span className="text-slate-400 text-xs font-bold tracking-wide">INFORMACIÓN ADICIONAL</span>
        <button
          onClick={() => (editing ? save() : setEditing(true))}
          title={editing ? "Guardar" : "Editar"}
          className={`ml-auto w-6 h-6 rounded flex items-center justify-center transition-colors ${editing ? "text-emerald-500 hover:bg-[#111a2c]" : "text-slate-500 hover:bg-[#111a2c] hover:text-slate-200"}`}
        >
          {editing ? <Save className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <Accordion title="Registrado por" defaultOpen>
          {currentOfficer ? (
            <span className="inline-flex items-center gap-1.5 bg-[#121a2e] border border-[#1e2a45] rounded-full pl-2.5 pr-3 py-1">
              <Car className="w-3 h-3 text-[#6f93d6]" />
              <span className="text-white text-[11px] font-medium">#{currentOfficer.badgeNumber} {currentOfficer.firstName[0]}. {currentOfficer.lastName}</span>
            </span>
          ) : <span className="text-slate-600 text-xs">—</span>}
        </Accordion>

        <Accordion title="Actualizado" defaultOpen>
          <span className="text-slate-400 text-xs">{fmtDateTime(call.updatedAt)}</span>
        </Accordion>

        <Accordion title="Oficiales involucrados">
          {editing ? <TagListEditor values={officersInvolved} onChange={setOfficersInvolved} placeholder="Placa / nombre..." /> : (
            officersInvolved.length ? officersInvolved.map((o, i) => <Chip key={i}>{o}</Chip>) : <span className="text-slate-600 text-xs">Sin datos</span>
          )}
        </Accordion>

        <Accordion title="Heridos / Víctimas">
          {editing ? <TagListEditor values={victims} onChange={setVictims} placeholder="Nombre..." /> : (
            victims.length ? victims.map((v, i) => <Chip key={i}>{v}</Chip>) : <span className="text-slate-600 text-xs">Sin datos</span>
          )}
        </Accordion>

        <Accordion title="Sospechosos" defaultOpen={suspects.length > 0}>
          <div className="mb-1.5">
            {suspects.length === 0 && <span className="text-slate-600 text-xs">Sin datos</span>}
            {suspects.map((s, i) => (
              <Chip key={i} onRemove={editing ? () => setSuspects((prev) => prev.filter((_, idx) => idx !== i)) : undefined}>
                {s.plate ? `${s.plate} / ` : ""}{s.name}
              </Chip>
            ))}
          </div>
          {editing && (
            <div className="flex gap-1.5">
              <input value={suspectPlate} onChange={(e) => setSuspectPlate(e.target.value)} placeholder="Placa" className="w-16 bg-[#121a2e] border border-[#1e2a45] rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" />
              <input value={suspectName} onChange={(e) => setSuspectName(e.target.value)} placeholder="Nombre" className="flex-1 bg-[#121a2e] border border-[#1e2a45] rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" />
              <button onClick={addSuspect} className="px-2 rounded bg-[#1c2b4d] hover:bg-[#3c68c9] text-white text-xs">+</button>
            </div>
          )}
        </Accordion>

        <Accordion title="Testigos">
          {editing ? <TagListEditor values={witnesses} onChange={setWitnesses} placeholder="Nombre..." /> : (
            witnesses.length ? witnesses.map((w, i) => <Chip key={i}>{w}</Chip>) : <span className="text-slate-600 text-xs">Sin datos</span>
          )}
        </Accordion>

        <Accordion title="BOLO Sospechoso">
          {editing ? (
            <textarea value={boloSuspect} onChange={(e) => setBoloSuspect(e.target.value)} rows={2} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded px-2 py-1.5 text-xs text-white resize-none focus:outline-none focus:border-[#3c68c9]" />
          ) : <span className="text-slate-400 text-xs whitespace-pre-wrap">{boloSuspect || "Sin datos"}</span>}
        </Accordion>

        <Accordion title="BOLO Vehículo">
          {editing ? (
            <textarea value={boloVehicle} onChange={(e) => setBoloVehicle(e.target.value)} rows={2} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded px-2 py-1.5 text-xs text-white resize-none focus:outline-none focus:border-[#3c68c9]" />
          ) : <span className="text-slate-400 text-xs whitespace-pre-wrap">{boloVehicle || "Sin datos"}</span>}
        </Accordion>

        <Accordion title="Confiscación / evacuación de vehículo">
          {editing ? (
            <textarea value={vehicleImpound} onChange={(e) => setVehicleImpound(e.target.value)} rows={2} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded px-2 py-1.5 text-xs text-white resize-none focus:outline-none focus:border-[#3c68c9]" />
          ) : <span className="text-slate-400 text-xs whitespace-pre-wrap">{vehicleImpound || "Sin datos"}</span>}
        </Accordion>

        <Accordion title="Declaración del ciudadano">
          {editing ? (
            <textarea value={citizenStatement} onChange={(e) => setCitizenStatement(e.target.value)} rows={3} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded px-2 py-1.5 text-xs text-white resize-none focus:outline-none focus:border-[#3c68c9]" />
          ) : <span className="text-slate-400 text-xs whitespace-pre-wrap">{citizenStatement || "Sin datos"}</span>}
        </Accordion>

        <Accordion title="Reporte de criminalística">
          {editing ? (
            <textarea value={forensicsReport} onChange={(e) => setForensicsReport(e.target.value)} rows={3} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded px-2 py-1.5 text-xs text-white resize-none focus:outline-none focus:border-[#3c68c9]" />
          ) : <span className="text-slate-400 text-xs whitespace-pre-wrap">{forensicsReport || "Sin datos"}</span>}
        </Accordion>

        <Accordion title="Evidencias registradas">
          {editing ? <TagListEditor values={evidenceLogged} onChange={setEvidenceLogged} placeholder="Evidencia..." /> : (
            evidenceLogged.length ? evidenceLogged.map((e, i) => <Chip key={i}>{e}</Chip>) : <span className="text-slate-600 text-xs">Sin datos</span>
          )}
        </Accordion>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function NewCallModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { addCall, state } = useMDT();
  const [formData, setFormData] = useState({
    type: "Other" as CallType,
    priority: "Medium" as CallPriority,
    location: "",
    description: "",
    caller: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCall({ ...formData, status: "Pending", assignedUnits: [], notes: [] });
    const created = [...state.calls].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    onClose();
    if (created) onCreated(created.id);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0d1424] border border-[#1e2a45] rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-5">Nuevo incidente</h2>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as CallType })} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]" required>
                {["Traffic Stop", "Suspicious Activity", "Robbery", "Assault", "Shots Fired", "Welfare Check", "Disturbance", "Traffic Accident", "Cyber Crime", "Other"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Prioridad">
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as CallPriority })} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]" required>
                {["Low", "Medium", "High", "Emergency"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Ubicación">
            <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Calle / intersección..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" required />
          </Field>
          <Field label="Reportante (opcional)">
            <input value={formData.caller} onChange={(e) => setFormData({ ...formData, caller: e.target.value })} placeholder="Nombre o anónimo" className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" />
          </Field>
          <Field label="Descripción">
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-[#3c68c9]" required />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-[#3c68c9] hover:bg-[#4d78d6] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Crear incidente</button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#111a2c] hover:bg-[#151d31] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

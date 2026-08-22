"use client";

import { useMemo, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import DocumentViewerModal from "./DocumentViewerModal";
import type { BOLO, BOLOType, CallPriority } from "@/lib/mdtTypes";
import { boloToDocument } from "@/lib/documentMappers";
import { Search, Plus, AlertTriangle, X, CheckCircle, XCircle, Clock, MapPin, ScrollText } from "lucide-react";

const BOLO_TYPE_LABEL: Record<BOLOType, string> = { Person: "Persona", Vehicle: "Vehículo", Other: "Otro" };

function fmtDate(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

const PRIORITY_STYLE: Record<CallPriority, string> = {
  Low: "bg-blue-500/15 text-blue-400",
  Medium: "bg-yellow-500/15 text-yellow-400",
  High: "bg-orange-500/15 text-orange-400",
  Emergency: "bg-red-500/15 text-red-400",
};

export function MDTBOLOsContent({
  showNew,
  setShowNew,
}: {
  showNew: boolean;
  setShowNew: (v: boolean) => void;
}) {
  const { state, updateBOLO } = useMDT();
  const { bolos, currentOfficer } = state;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"active" | "resolved" | "all">("active");
  const [viewDoc, setViewDoc] = useState<BOLO | null>(null);

  const filtered = useMemo(() => {
    return bolos.filter((b) => {
      if (filter === "active" && b.status !== "Active") return false;
      if (filter === "resolved" && b.status === "Active") return false;
      if (query.trim() && !`${b.title} ${b.subject} ${b.boloNumber}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [bolos, filter, query]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título, sujeto o número..."
            className="w-full bg-[#0d1424] border border-[#151d31] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9]"
          />
        </div>
        <div className="flex gap-2">
          {([{ id: "active", label: "Activos" }, { id: "resolved", label: "Cerrados" }, { id: "all", label: "Todos" }] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${filter === f.id ? "bg-[#3c68c9] text-white" : "bg-[#0d1424] text-slate-400 border border-[#151d31] hover:text-white"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-10 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No hay BOLOs que coincidan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="bg-[#0d1424] border border-[#151d31] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${PRIORITY_STYLE[b.priority]}`}>{b.priority}</span>
                    <span className="text-slate-500 text-xs">{b.boloNumber}</span>
                    <span className="text-slate-500 text-xs">· {BOLO_TYPE_LABEL[b.type]}</span>
                  </div>
                  <p className="text-white font-bold">{b.title}</p>
                  <p className="text-slate-400 text-sm">{b.subject}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {b.status === "Active" ? (
                    <>
                      <button onClick={() => updateBOLO(b.id, { status: "Resolved" })} title="Marcar resuelto" className="p-1.5 rounded-lg text-emerald-400 hover:bg-white/5"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => updateBOLO(b.id, { status: "Cancelled" })} title="Cancelar" className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5"><XCircle className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${b.status === "Resolved" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                      {b.status === "Resolved" ? "RESUELTO" : "CANCELADO"}
                    </span>
                  )}
                  <button onClick={() => setViewDoc(b)} title="Ver documento" className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 hover:text-white"><ScrollText className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-slate-300 text-sm mb-2">{b.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {b.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {b.location}</span>}
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {fmtDate(b.createdAt)}</span>
                <span>Por {b.issuedBy}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && <NewBoloModal onClose={() => setShowNew(false)} issuedBy={currentOfficer ? `${currentOfficer.firstName} ${currentOfficer.lastName}` : "Staff"} />}

      {viewDoc && (
        <DocumentViewerModal onClose={() => setViewDoc(null)} sourceType="bolo" sourceId={viewDoc.id} {...boloToDocument(viewDoc)} />
      )}
    </>
  );
}

export default function MDTBOLOs() {
  const [showNew, setShowNew] = useState(false);

  return (
    <MDTLayout
      title="BOLOs"
      subtitle="Be On the LookOut — Alertas activas"
      actions={
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nuevo BOLO
        </button>
      }
    >
      <MDTBOLOsContent showNew={showNew} setShowNew={setShowNew} />
    </MDTLayout>
  );
}

function NewBoloModal({ onClose, issuedBy }: { onClose: () => void; issuedBy: string }) {
  const { createBOLO } = useMDT();
  const [type, setType] = useState<BOLOType>("Person");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<CallPriority>("Medium");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) return;
    createBOLO({ type, title: title.trim(), subject: subject.trim(), description: description.trim(), location: location.trim() || undefined, issuedBy, status: "Active", priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0d1424] border border-[#151d31] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Nuevo BOLO</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as BOLOType)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]">
                <option value="Person">Persona</option>
                <option value="Vehicle">Vehículo</option>
                <option value="Other">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as CallPriority)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]">
                <option value="Low">Baja</option>
                <option value="Medium">Media</option>
                <option value="High">Alta</option>
                <option value="Emergency">Emergencia</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sospechoso de robo a mano armada" className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" required />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Sujeto / vehículo</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Nombre, placa, descripción..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" required />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Última ubicación (opcional)</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#3c68c9]" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-[#3c68c9] hover:bg-[#4d78d6] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Publicar BOLO</button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#111a2c] hover:bg-[#151d31] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

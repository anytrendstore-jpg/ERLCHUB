"use client";

import { useMemo, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import DocumentViewerModal from "./DocumentViewerModal";
import type { Warrant } from "@/lib/mdtTypes";
import { warrantToDocument } from "@/lib/documentMappers";
import { Search, Plus, FileWarning, X, ShieldCheck, ShieldOff, Calendar, DollarSign, ScrollText } from "lucide-react";

const WARRANT_TYPE_LABEL: Record<Warrant["type"], string> = {
  Arrest: "Arresto",
  Search: "Búsqueda",
  Bench: "Comparecencia",
};

function fmtDate(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function MDTWarrantsContent({
  showNew,
  setShowNew,
}: {
  showNew: boolean;
  setShowNew: (v: boolean) => void;
}) {
  const { state, updateWarrant } = useMDT();
  const { warrants, currentOfficer } = state;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [viewDoc, setViewDoc] = useState<Warrant | null>(null);

  const filtered = useMemo(() => {
    return warrants.filter((w) => {
      if (filter === "active" && !w.isActive) return false;
      if (filter === "inactive" && w.isActive) return false;
      if (query.trim() && !`${w.personName} ${w.warrantNumber}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [warrants, filter, query]);

  const toggleActive = (w: Warrant) => updateWarrant(w.id, { isActive: !w.isActive });

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o número de orden..."
            className="w-full bg-[#0d1424] border border-[#151d31] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9]"
          />
        </div>
        <div className="flex gap-2">
          {([{ id: "active", label: "Activas" }, { id: "inactive", label: "Cerradas" }, { id: "all", label: "Todas" }] as const).map((f) => (
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
          <FileWarning className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No hay órdenes que coincidan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <div key={w.id} className="bg-[#0d1424] border border-[#151d31] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${w.isActive ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                      {w.isActive ? "ACTIVA" : "CERRADA"}
                    </span>
                    <span className="text-slate-500 text-xs">{w.warrantNumber}</span>
                    <span className="text-slate-500 text-xs">· {WARRANT_TYPE_LABEL[w.type]}</span>
                  </div>
                  <p className="text-white font-bold">{w.personName}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(w)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${w.isActive ? "bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25" : "bg-white/5 text-slate-400 hover:text-white"}`}
                  >
                    {w.isActive ? <><ShieldOff className="w-3.5 h-3.5" /> Cerrar</> : <><ShieldCheck className="w-3.5 h-3.5" /> Reabrir</>}
                  </button>
                  <button onClick={() => setViewDoc(w)} title="Ver documento" className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-slate-400 hover:text-white transition-colors">
                    <ScrollText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {w.charges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {w.charges.map((c, i) => <span key={i} className="px-2 py-0.5 bg-[#121a2e] border border-[#1e2a45] text-slate-300 text-[11px] rounded">{c}</span>)}
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Emitida {fmtDate(w.issuedDate)}</span>
                {w.expiryDate && <span>Vence {fmtDate(w.expiryDate)}</span>}
                {w.bailAmount ? <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Fianza ${w.bailAmount.toLocaleString()}</span> : null}
                <span>Por {w.issuedBy}</span>
              </div>
              {w.notes && <p className="text-slate-400 text-xs mt-2">{w.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showNew && <NewWarrantModal onClose={() => setShowNew(false)} issuedBy={currentOfficer ? `${currentOfficer.firstName} ${currentOfficer.lastName}` : "Staff"} />}

      {viewDoc && (
        <DocumentViewerModal onClose={() => setViewDoc(null)} sourceType="warrant" sourceId={viewDoc.id} {...warrantToDocument(viewDoc)} />
      )}
    </>
  );
}

export default function MDTWarrants() {
  const [showNew, setShowNew] = useState(false);

  return (
    <MDTLayout
      title="Órdenes Judiciales"
      subtitle="Órdenes de arresto, búsqueda y comparecencia"
      actions={
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nueva orden
        </button>
      }
    >
      <MDTWarrantsContent showNew={showNew} setShowNew={setShowNew} />
    </MDTLayout>
  );
}

function NewWarrantModal({ onClose, issuedBy }: { onClose: () => void; issuedBy: string }) {
  const { createWarrant } = useMDT();
  const [personName, setPersonName] = useState("");
  const [type, setType] = useState<Warrant["type"]>("Arrest");
  const [chargesText, setChargesText] = useState("");
  const [bailAmount, setBailAmount] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;
    createWarrant({
      personId: "",
      personName: personName.trim(),
      type,
      charges: chargesText.split(",").map((c) => c.trim()).filter(Boolean),
      issuedBy,
      isActive: true,
      bailAmount: bailAmount ? Number(bailAmount) : undefined,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0d1424] border border-[#151d31] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Nueva orden judicial</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Nombre del ciudadano</label>
            <input value={personName} onChange={(e) => setPersonName(e.target.value)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]" required />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Tipo de orden</label>
            <select value={type} onChange={(e) => setType(e.target.value as Warrant["type"])} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]">
              <option value="Arrest">Arresto</option>
              <option value="Search">Búsqueda</option>
              <option value="Bench">Comparecencia</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Cargos (separados por coma)</label>
            <input value={chargesText} onChange={(e) => setChargesText(e.target.value)} placeholder="Robo, Resistencia al arresto..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Fianza (opcional)</label>
            <input type="number" value={bailAmount} onChange={(e) => setBailAmount(e.target.value)} placeholder="5000" className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#3c68c9]" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-[#3c68c9] hover:bg-[#4d78d6] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Emitir orden</button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#111a2c] hover:bg-[#151d31] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

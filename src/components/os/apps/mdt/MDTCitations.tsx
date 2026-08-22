"use client";

import { useMemo, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import DocumentViewerModal from "./DocumentViewerModal";
import type { Citation, ViolationType, CitationStatus } from "@/lib/mdtTypes";
import { citationToDocument } from "@/lib/documentMappers";
import { Search, Plus, Receipt, X, DollarSign, Calendar, Car, FileText } from "lucide-react";

function fmtDate(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_STYLE: Record<CitationStatus, string> = {
  Issued: "bg-blue-500/15 text-blue-400",
  Paid: "bg-emerald-500/15 text-emerald-400",
  Overdue: "bg-red-500/15 text-red-400",
  Contested: "bg-yellow-500/15 text-yellow-400",
  Dismissed: "bg-slate-500/15 text-slate-400",
};

const VIOLATION_LABEL: Record<ViolationType, string> = {
  Moving: "Tránsito",
  Parking: "Estacionamiento",
  Equipment: "Equipamiento",
  Administrative: "Administrativa",
};

export function MDTCitationsContent({
  showNew,
  setShowNew,
}: {
  showNew: boolean;
  setShowNew: (v: boolean) => void;
}) {
  const { state, updateCitation } = useMDT();
  const { citations, currentOfficer } = state;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CitationStatus | "all">("all");
  const [viewDoc, setViewDoc] = useState<Citation | null>(null);

  const filtered = useMemo(() => {
    return citations.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (query.trim() && !`${c.personName} ${c.citationNumber} ${c.violation}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [citations, filter, query]);

  const totalOutstanding = useMemo(() => citations.filter((c) => c.status === "Issued" || c.status === "Overdue").reduce((s, c) => s + c.fineAmount, 0), [citations]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total emitidas", value: citations.length },
          { label: "Pendientes", value: citations.filter((c) => c.status === "Issued").length },
          { label: "Vencidas", value: citations.filter((c) => c.status === "Overdue").length },
          { label: "Monto pendiente", value: `$${totalOutstanding.toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} className="bg-[#0d1424] border border-[#151d31] rounded-xl p-3.5">
            <p className="text-white font-bold text-lg">{s.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, número o infracción..."
            className="w-full bg-[#0d1424] border border-[#151d31] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9]"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as CitationStatus | "all")} className="bg-[#0d1424] border border-[#151d31] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3c68c9]">
          <option value="all">Todos los estados</option>
          <option value="Issued">Emitidas</option>
          <option value="Paid">Pagadas</option>
          <option value="Overdue">Vencidas</option>
          <option value="Contested">Impugnadas</option>
          <option value="Dismissed">Anuladas</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-10 text-center">
          <Receipt className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No hay multas que coincidan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-[#0d1424] border border-[#151d31] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                    <span className="text-slate-500 text-xs">{c.citationNumber}</span>
                    <span className="text-slate-500 text-xs">· {VIOLATION_LABEL[c.violationType]}</span>
                  </div>
                  <p className="text-white font-bold">{c.personName}</p>
                  <p className="text-slate-400 text-sm">{c.violation}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-emerald-400 font-bold text-lg">${c.fineAmount.toLocaleString()}</p>
                  <div className="flex gap-1.5 mt-1.5 justify-end">
                    {c.status === "Issued" && (
                      <>
                        <button onClick={() => updateCitation(c.id, { status: "Paid" })} className="px-2 py-1 rounded bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 text-[11px] font-semibold transition-colors">Pagar</button>
                        <button onClick={() => updateCitation(c.id, { status: "Dismissed" })} className="px-2 py-1 rounded bg-white/5 text-slate-400 hover:text-white text-[11px] font-semibold transition-colors">Anular</button>
                      </>
                    )}
                    <button onClick={() => setViewDoc(c)} title="Ver documento" className="w-6 h-6 rounded flex items-center justify-center bg-white/5 text-slate-400 hover:text-white transition-colors">
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {c.vehiclePlate && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {c.vehiclePlate}</span>}
                <span>{c.location}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Vence {fmtDate(c.dueDate)}</span>
                <span>Por {c.issuedBy}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && <NewCitationModal onClose={() => setShowNew(false)} issuedBy={currentOfficer ? `${currentOfficer.rank} ${currentOfficer.lastName}` : "Staff"} />}

      {viewDoc && (
        <DocumentViewerModal onClose={() => setViewDoc(null)} sourceType="citation" sourceId={viewDoc.id} {...citationToDocument(viewDoc)} />
      )}
    </>
  );
}

export default function MDTCitations() {
  const [showNew, setShowNew] = useState(false);

  return (
    <MDTLayout
      title="Multas"
      subtitle="Sistema de citaciones electrónicas"
      actions={
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nueva multa
        </button>
      }
    >
      <MDTCitationsContent showNew={showNew} setShowNew={setShowNew} />
    </MDTLayout>
  );
}

function NewCitationModal({ onClose, issuedBy }: { onClose: () => void; issuedBy: string }) {
  const { state, issueCitation } = useMDT();
  const [personQuery, setPersonQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<{ id: string; name: string } | null>(null);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<{ id: string; plate: string } | null>(null);
  const [violationType, setViolationType] = useState<ViolationType>("Moving");
  const [violation, setViolation] = useState("");
  const [location, setLocation] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [notes, setNotes] = useState("");

  // Filtrado local: evita invocar los `search*` del contexto (registran auditoría vía setState) durante el render.
  const personResults = useMemo(() => {
    const q = personQuery.trim().toLowerCase();
    if (!q) return [];
    return state.persons.filter((p) => p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q));
  }, [state.persons, personQuery]);

  const vehicleResults = useMemo(() => {
    const q = vehicleQuery.trim().toLowerCase();
    if (!q) return [];
    return state.vehicles.filter((v) => v.plate.toLowerCase().includes(q) || `${v.make} ${v.model}`.toLowerCase().includes(q));
  }, [state.vehicles, vehicleQuery]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !violation.trim() || !location.trim() || !fineAmount) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    issueCitation({
      violationType, violation: violation.trim(),
      personId: selectedPerson.id, personName: selectedPerson.name,
      vehicleId: selectedVehicle?.id, vehiclePlate: selectedVehicle?.plate,
      location: location.trim(), fineAmount: Number(fineAmount), dueDate,
      status: "Issued", issuedBy, notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0d1424] border border-[#151d31] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Nueva multa</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Ciudadano</label>
            {selectedPerson ? (
              <div className="flex items-center justify-between bg-[#121a2e] border border-[#3c68c9] rounded-lg px-3 py-2">
                <span className="text-white text-sm">{selectedPerson.name}</span>
                <button type="button" onClick={() => setSelectedPerson(null)} className="text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <>
                <input value={personQuery} onChange={(e) => setPersonQuery(e.target.value)} placeholder="Buscar por nombre..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" />
                {personResults.length > 0 && (
                  <div className="mt-1.5 space-y-1 max-h-32 overflow-y-auto">
                    {personResults.map((p) => (
                      <button key={p.id} type="button" onClick={() => setSelectedPerson({ id: p.id, name: `${p.firstName} ${p.lastName}` })} className="w-full text-left bg-[#121a2e] hover:bg-[#151d31] border border-[#1e2a45] rounded-lg px-3 py-1.5 text-xs text-white transition-colors">
                        {p.firstName} {p.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Vehículo (opcional)</label>
            {selectedVehicle ? (
              <div className="flex items-center justify-between bg-[#121a2e] border border-[#3c68c9] rounded-lg px-3 py-2">
                <span className="text-white text-sm">{selectedVehicle.plate}</span>
                <button type="button" onClick={() => setSelectedVehicle(null)} className="text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <>
                <input value={vehicleQuery} onChange={(e) => setVehicleQuery(e.target.value)} placeholder="Buscar por placa o modelo..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" />
                {vehicleResults.length > 0 && (
                  <div className="mt-1.5 space-y-1 max-h-32 overflow-y-auto">
                    {vehicleResults.map((v) => (
                      <button key={v.id} type="button" onClick={() => setSelectedVehicle({ id: v.id, plate: v.plate })} className="w-full text-left bg-[#121a2e] hover:bg-[#151d31] border border-[#1e2a45] rounded-lg px-3 py-1.5 text-xs text-white transition-colors">
                        {v.plate} · {v.make} {v.model}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Tipo</label>
              <select value={violationType} onChange={(e) => setViolationType(e.target.value as ViolationType)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]">
                <option value="Moving">Tránsito</option>
                <option value="Parking">Estacionamiento</option>
                <option value="Equipment">Equipamiento</option>
                <option value="Administrative">Administrativa</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Monto</label>
              <input type="number" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} placeholder="250" className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" required />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Infracción</label>
            <input value={violation} onChange={(e) => setViolation(e.target.value)} placeholder="Exceso de velocidad..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" required />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Ubicación</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]" required />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={!selectedPerson} className="flex-1 bg-[#3c68c9] hover:bg-[#4d78d6] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Emitir multa</button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#111a2c] hover:bg-[#151d31] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

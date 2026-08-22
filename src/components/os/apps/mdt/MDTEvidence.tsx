"use client";

import { useMemo, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import type { Evidence, EvidenceType, CustodyStatus } from "@/lib/mdtTypes";
import { Search, Plus, Package, X, Clock, MapPin, ArrowRightLeft } from "lucide-react";

function fmtDateTime(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    ", " + new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLE: Record<CustodyStatus, string> = {
  Collected: "bg-blue-500/15 text-blue-400",
  "In Storage": "bg-slate-500/15 text-slate-400",
  "In Analysis": "bg-yellow-500/15 text-yellow-400",
  Released: "bg-emerald-500/15 text-emerald-400",
  Destroyed: "bg-red-500/15 text-red-400",
};

const TYPE_LABEL: Record<EvidenceType, string> = {
  Photo: "Fotografía", Video: "Video", Document: "Documento", Physical: "Física", Digital: "Digital", Testimony: "Testimonio",
};

const CUSTODY_ACTIONS = ["Moved to storage", "Sent for analysis", "Returned from analysis", "Released", "Destroyed"];

export function MDTEvidenceContent({
  showNew,
  setShowNew,
}: {
  showNew: boolean;
  setShowNew: (v: boolean) => void;
}) {
  const { state, updateEvidenceCustody } = useMDT();
  const { evidence, currentOfficer } = state;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Evidence | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return evidence;
    return evidence.filter((e) => `${e.description} ${e.evidenceNumber} ${e.caseNumber}`.toLowerCase().includes(q));
  }, [evidence, query]);

  return (
    <>
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por descripción, número o caso..." className="w-full bg-[#0d1424] border border-[#151d31] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9]" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-10 text-center">
          <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No hay evidencias que coincidan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className="bg-[#0d1424] border border-[#151d31] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${STATUS_STYLE[e.custodyStatus]}`}>{e.custodyStatus}</span>
                    <span className="text-slate-500 text-xs">{e.evidenceNumber}</span>
                    <span className="text-slate-500 text-xs">· {TYPE_LABEL[e.type]} · Caso {e.caseNumber}</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{e.description}</p>
                </div>
                <button onClick={() => setSelected(selected?.id === e.id ? null : e)} className="text-slate-400 hover:text-white text-xs flex items-center gap-1 flex-shrink-0">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Custodia
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {e.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {fmtDateTime(e.collectedAt)}</span>
                <span>Por {e.collectedBy}</span>
              </div>

              {selected?.id === e.id && (
                <div className="mt-3 pt-3 border-t border-[#151d31]">
                  <p className="text-slate-400 text-xs font-bold mb-2">Cadena de custodia</p>
                  <div className="space-y-1.5 mb-3">
                    {e.chainOfCustody.map((c, i) => (
                      <div key={i} className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="text-white">{c.action}</span>
                        <span>· {c.officerName}</span>
                        <span>· {fmtDateTime(c.timestamp)}</span>
                        {c.notes && <span className="text-slate-500">({c.notes})</span>}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CUSTODY_ACTIONS.map((action) => (
                      <button
                        key={action}
                        onClick={() => updateEvidenceCustody(e.id, action)}
                        className="px-2.5 py-1 rounded-lg bg-[#121a2e] hover:bg-[#151d31] border border-[#1e2a45] text-slate-300 text-[11px] transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && <NewEvidenceModal onClose={() => setShowNew(false)} collectedBy={currentOfficer ? `${currentOfficer.rank} ${currentOfficer.lastName}` : "Staff"} />}
    </>
  );
}

export default function MDTEvidence() {
  const [showNew, setShowNew] = useState(false);

  return (
    <MDTLayout
      title="Evidencias"
      subtitle="Gestión de evidencias y cadena de custodia"
      actions={
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> Registrar evidencia
        </button>
      }
    >
      <MDTEvidenceContent showNew={showNew} setShowNew={setShowNew} />
    </MDTLayout>
  );
}

function NewEvidenceModal({ onClose, collectedBy }: { onClose: () => void; collectedBy: string }) {
  const { addEvidence } = useMDT();
  const [type, setType] = useState<EvidenceType>("Physical");
  const [caseNumber, setCaseNumber] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [tagsText, setTagsText] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !location.trim() || !caseNumber.trim()) return;
    addEvidence({
      type, caseNumber: caseNumber.trim(), description: description.trim(), location: location.trim(),
      collectedBy, custodyStatus: "Collected",
      tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0d1424] border border-[#151d31] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Registrar evidencia</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as EvidenceType)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]">
                {(["Physical", "Photo", "Video", "Document", "Digital", "Testimony"] as EvidenceType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Número de caso</label>
              <input value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="CASE-1001" className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" required />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Descripción</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Arma recuperada en la escena..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" required />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Ubicación de almacenamiento</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Evidencia - Estantería 4B" className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" required />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Etiquetas (separadas por coma)</label>
            <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="arma, huellas..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-[#3c68c9] hover:bg-[#4d78d6] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Registrar</button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#111a2c] hover:bg-[#151d31] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

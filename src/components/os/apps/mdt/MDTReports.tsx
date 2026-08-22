"use client";

import { useMemo, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import DocumentViewerModal from "./DocumentViewerModal";
import type { Report, ReportType } from "@/lib/mdtTypes";
import { reportToDocument } from "@/lib/documentMappers";
import { Plus, Search, FileText, X, PenLine, CheckCircle, XCircle, Users, Car, ScrollText } from "lucide-react";

function fmtDateTime(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    ", " + new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLE: Record<Report["status"], string> = {
  Draft: "bg-slate-500/15 text-slate-400",
  "Pending Review": "bg-yellow-500/15 text-yellow-400",
  Approved: "bg-emerald-500/15 text-emerald-400",
  Rejected: "bg-red-500/15 text-red-400",
};

const TYPE_LABEL: Record<ReportType, string> = {
  Incident: "Incidente",
  Arrest: "Arresto",
  Traffic: "Tránsito",
  Investigation: "Investigación",
  "Use of Force": "Uso de fuerza",
};

export function MDTReportsContent({
  showNew,
  setShowNew,
}: {
  showNew: boolean;
  setShowNew: (v: boolean) => void;
}) {
  const { state, signReport } = useMDT();
  const { reports, currentOfficer } = state;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [viewDoc, setViewDoc] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => `${r.title} ${r.reportNumber} ${r.officerName}`.toLowerCase().includes(q));
  }, [reports, query]);

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar reportes..." className="w-full bg-[#0d1424] border border-[#151d31] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9]" />
          </div>

          {filtered.length === 0 && (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-6 text-center">
              <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Sin reportes.</p>
            </div>
          )}

          <div className="space-y-2.5 max-h-[70vh] overflow-y-auto">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelected(r); setViewDoc(false); }}
                className={`w-full text-left bg-[#0d1424] border rounded-lg p-3.5 transition-colors ${selected?.id === r.id ? "border-[#3c68c9]" : "border-[#151d31] hover:border-[#1e2a45]"}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  <span className="text-slate-500 text-[10px]">{r.reportNumber}</span>
                </div>
                <p className="text-white font-semibold text-sm truncate">{r.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{TYPE_LABEL[r.type]} · {fmtDateTime(r.dateTime)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-10 text-center">
              <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Selecciona un reporte para ver los detalles.</p>
            </div>
          ) : (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-0.5">{selected.title}</h2>
                  <p className="text-slate-500 text-sm">{selected.reportNumber} · {TYPE_LABEL[selected.type]}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLE[selected.status]}`}>{selected.status}</span>
                  <button onClick={() => setViewDoc(true)} title="Ver documento" className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#121a2e] border border-[#1e2a45] text-slate-400 hover:text-white transition-colors">
                    <ScrollText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><span className="text-slate-500">Oficial:</span><span className="text-white">{selected.officerName}</span></div>
                <div className="flex items-center gap-2"><span className="text-slate-500">Fecha:</span><span className="text-white">{fmtDateTime(selected.dateTime)}</span></div>
                <div className="flex items-center gap-2 sm:col-span-2"><span className="text-slate-500">Ubicación:</span><span className="text-white">{selected.location}</span></div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-[#151d31] pb-2 mb-2">Narrativa</h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selected.narrative}</p>
              </div>

              {(selected.involvedPersons.length > 0 || selected.involvedVehicles.length > 0) && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {selected.involvedPersons.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Personas involucradas</h4>
                      <div className="flex flex-wrap gap-1.5">{selected.involvedPersons.map((p, i) => <span key={i} className="px-2 py-0.5 bg-[#121a2e] border border-[#1e2a45] text-slate-300 text-xs rounded">{p}</span>)}</div>
                    </div>
                  )}
                  {selected.involvedVehicles.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Vehículos involucrados</h4>
                      <div className="flex flex-wrap gap-1.5">{selected.involvedVehicles.map((v, i) => <span key={i} className="px-2 py-0.5 bg-[#121a2e] border border-[#1e2a45] text-slate-300 text-xs rounded">{v}</span>)}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-[#151d31]">
                {selected.signature ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Firmado digitalmente el {fmtDateTime(selected.signedAt)}
                  </div>
                ) : selected.officerId === currentOfficer?.id ? (
                  <button
                    onClick={() => { signReport(selected.id, `${currentOfficer?.firstName} ${currentOfficer?.lastName}`); setSelected({ ...selected, signature: `${currentOfficer?.firstName} ${currentOfficer?.lastName}`, status: "Pending Review" }); }}
                    className="flex items-center gap-2 bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <PenLine className="w-4 h-4" /> Firmar y enviar a revisión
                  </button>
                ) : (
                  <p className="text-slate-500 text-sm flex items-center gap-2"><XCircle className="w-4 h-4" /> Sin firmar</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewReportModal
          onClose={() => setShowNew(false)}
          officer={currentOfficer}
          onCreated={(r) => setSelected(r)}
        />
      )}

      {viewDoc && selected && (
        <DocumentViewerModal onClose={() => setViewDoc(false)} sourceType="report" sourceId={selected.id} {...reportToDocument(selected)} />
      )}
    </>
  );
}

export default function MDTReports() {
  const [showNew, setShowNew] = useState(false);

  return (
    <MDTLayout
      title="Reportes"
      subtitle="Sistema de gestión de expedientes"
      actions={
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nuevo reporte
        </button>
      }
    >
      <MDTReportsContent showNew={showNew} setShowNew={setShowNew} />
    </MDTLayout>
  );
}

function NewReportModal({ onClose, officer, onCreated }: { onClose: () => void; officer: any; onCreated: (r: Report) => void }) {
  const { state, createReport } = useMDT();
  const [type, setType] = useState<ReportType>("Incident");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [narrative, setNarrative] = useState("");
  const [personQuery, setPersonQuery] = useState("");
  const [involvedPersons, setInvolvedPersons] = useState<string[]>([]);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [involvedVehicles, setInvolvedVehicles] = useState<string[]>([]);

  const personResults = useMemo(() => {
    const q = personQuery.trim().toLowerCase();
    if (!q) return [];
    return state.persons.filter((p) => p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q)).slice(0, 5);
  }, [state.persons, personQuery]);

  const vehicleResults = useMemo(() => {
    const q = vehicleQuery.trim().toLowerCase();
    if (!q) return [];
    return state.vehicles.filter((v) => v.plate.toLowerCase().includes(q)).slice(0, 5);
  }, [state.vehicles, vehicleQuery]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !narrative.trim() || !location.trim() || !officer) return;
    createReport({
      type, title: title.trim(), status: "Draft", narrative: narrative.trim(),
      officerId: officer.id, officerName: `${officer.rank} ${officer.lastName}`,
      location: location.trim(), dateTime: new Date(),
      involvedPersons, involvedVehicles, evidence: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0d1424] border border-[#151d31] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Nuevo reporte</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as ReportType)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]">
                <option value="Incident">Incidente</option>
                <option value="Arrest">Arresto</option>
                <option value="Traffic">Tránsito</option>
                <option value="Investigation">Investigación</option>
                <option value="Use of Force">Uso de fuerza</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Ubicación</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]" required />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Robo a mano armada en Main St..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" required />
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Personas involucradas (opcional)</label>
            <input value={personQuery} onChange={(e) => setPersonQuery(e.target.value)} placeholder="Buscar ciudadano..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" />
            {personResults.length > 0 && (
              <div className="mt-1.5 space-y-1">
                {personResults.map((p) => (
                  <button key={p.id} type="button" onClick={() => { setInvolvedPersons((prev) => Array.from(new Set([...prev, `${p.firstName} ${p.lastName}`]))); setPersonQuery(""); }} className="w-full text-left bg-[#121a2e] hover:bg-[#151d31] border border-[#1e2a45] rounded-lg px-3 py-1.5 text-xs text-white transition-colors">
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            )}
            {involvedPersons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {involvedPersons.map((p, i) => (
                  <span key={i} className="flex items-center gap-1 bg-[#121a2e] border border-[#1e2a45] text-slate-200 text-[11px] px-2 py-1 rounded-md">
                    {p} <button type="button" onClick={() => setInvolvedPersons((prev) => prev.filter((_, idx) => idx !== i))}><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Vehículos involucrados (opcional)</label>
            <input value={vehicleQuery} onChange={(e) => setVehicleQuery(e.target.value)} placeholder="Buscar por placa..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" />
            {vehicleResults.length > 0 && (
              <div className="mt-1.5 space-y-1">
                {vehicleResults.map((v) => (
                  <button key={v.id} type="button" onClick={() => { setInvolvedVehicles((prev) => Array.from(new Set([...prev, v.plate]))); setVehicleQuery(""); }} className="w-full text-left bg-[#121a2e] hover:bg-[#151d31] border border-[#1e2a45] rounded-lg px-3 py-1.5 text-xs text-white transition-colors">
                    {v.plate} · {v.make} {v.model}
                  </button>
                ))}
              </div>
            )}
            {involvedVehicles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {involvedVehicles.map((v, i) => (
                  <span key={i} className="flex items-center gap-1 bg-[#121a2e] border border-[#1e2a45] text-slate-200 text-[11px] px-2 py-1 rounded-md">
                    {v} <button type="button" onClick={() => setInvolvedVehicles((prev) => prev.filter((_, idx) => idx !== i))}><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Narrativa</label>
            <textarea value={narrative} onChange={(e) => setNarrative(e.target.value)} rows={5} placeholder="Describe los hechos con detalle..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-[#3c68c9]" required />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-[#3c68c9] hover:bg-[#4d78d6] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Crear reporte</button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#111a2c] hover:bg-[#151d31] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

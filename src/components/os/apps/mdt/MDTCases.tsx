"use client";

import { useEffect, useMemo, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import type { CaseFile, CaseType, CasePriority, CaseStatus } from "@/lib/mdtTypes";
import {
  Briefcase, Plus, Search, X, Users, Car, Package, Radio, ScrollText, StickyNote,
  Clock, User as UserIcon,
} from "lucide-react";

function fmtDateTime(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    ", " + new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

const TYPE_LABEL: Record<CaseType, string> = {
  Investigation: "Investigación", Homicide: "Homicidio", Robbery: "Robo", Narcotics: "Narcóticos",
  Fraud: "Fraude", "Missing Person": "Persona desaparecida", "Gang Activity": "Actividad de bandas", Other: "Otro",
};
const STATUS_LABEL: Record<CaseStatus, string> = { Open: "Abierto", Active: "Activo", Cold: "En pausa", Closed: "Cerrado", Referred: "Derivado" };
const STATUS_STYLE: Record<CaseStatus, string> = {
  Open: "bg-blue-500/15 text-blue-400", Active: "bg-emerald-500/15 text-emerald-400", Cold: "bg-slate-500/15 text-slate-400",
  Closed: "bg-slate-600/20 text-slate-500", Referred: "bg-purple-500/15 text-purple-400",
};
const PRIORITY_LABEL: Record<CasePriority, string> = { Low: "Baja", Medium: "Media", High: "Alta", Critical: "Crítica" };
const PRIORITY_STYLE: Record<CasePriority, string> = {
  Low: "bg-blue-500/15 text-blue-400", Medium: "bg-yellow-500/15 text-yellow-400", High: "bg-orange-500/15 text-orange-400", Critical: "bg-red-500/15 text-red-400",
};

type Tab = "summary" | "persons" | "vehicles" | "evidence" | "incidents" | "notes" | "activity";
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "summary", label: "Resumen", icon: Briefcase },
  { id: "persons", label: "Personas", icon: Users },
  { id: "vehicles", label: "Vehículos", icon: Car },
  { id: "evidence", label: "Evidencias", icon: Package },
  { id: "incidents", label: "Incidentes", icon: Radio },
  { id: "notes", label: "Notas", icon: StickyNote },
  { id: "activity", label: "Actividad", icon: ScrollText },
];

export function MDTCasesContent() {
  const { state, openRecord, clearFocusRequest } = useMDT();
  const { cases, persons, vehicles, evidence, calls } = state;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CaseStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Llegó desde la búsqueda global pidiendo abrir un caso puntual.
  useEffect(() => {
    if (state.focusRequest?.entity !== "case") return;
    setSelectedId(state.focusRequest.id);
    clearFocusRequest();
  }, [state.focusRequest, clearFocusRequest]);

  const filtered = useMemo(() => cases.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (query.trim() && !`${c.title} ${c.caseNumber} ${c.leadOfficerName}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  }), [cases, statusFilter, query]);

  const selected = cases.find((c) => c.id === selectedId) || null;

  return (
    <>
      <div className="h-full flex bg-[#05070d] text-slate-200">
        {/* Lista de casos */}
        <div className="w-[320px] flex-shrink-0 border-r border-[#151d31] flex flex-col">
          <div className="p-3 border-b border-[#151d31] flex items-center gap-2">
            <span className="text-slate-400 text-xs font-bold tracking-wide">CASOS</span>
            <button onClick={() => setShowNew(true)} className="ml-auto w-6 h-6 rounded bg-[#1c2b4d] hover:bg-[#3c68c9] flex items-center justify-center text-white transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-3 border-b border-[#151d31] space-y-2">
            <div className="relative">
              <input
                value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar caso..."
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9]"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            </div>
            <select
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#3c68c9]"
            >
              <option value="all">Todos los estados</option>
              {(Object.keys(STATUS_LABEL) as CaseStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 && <p className="text-slate-600 text-xs text-center py-8 px-4">Sin casos que coincidan.</p>}
            {filtered.map((c) => {
              const isActive = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-[#111a2c] transition-colors ${isActive ? "bg-[#1c2b4d]" : "hover:bg-[#0f1729]"}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-white text-xs font-semibold truncate">{c.title}</span>
                    <span className="text-slate-500 text-[10px] flex-shrink-0">{c.caseNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${PRIORITY_STYLE[c.priority]}`}>{PRIORITY_LABEL[c.priority]}</span>
                  </div>
                  <p className="text-slate-500 text-[10px] truncate">{TYPE_LABEL[c.type]} · {c.leadOfficerName}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalle del caso */}
        {selected ? (
          <CaseDetail key={selected.id} caseFile={selected} persons={persons} vehicles={vehicles} evidence={evidence} calls={calls} onOpenPerson={(id) => openRecord("person", id, "persons")} onOpenVehicle={(id) => openRecord("vehicle", id, "vehicles")} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">Selecciona un caso para ver el expediente</div>
        )}
      </div>

      {showNew && <NewCaseModal onClose={() => setShowNew(false)} onCreated={(id) => setSelectedId(id)} />}
    </>
  );
}

export default function MDTCases() {
  return (
    <MDTLayout title="Casos" subtitle="Case Management System — expedientes de investigación" fullBleed>
      <MDTCasesContent />
    </MDTLayout>
  );
}

/* ------------------------------------------------------------------ */

function CaseDetail({
  caseFile, persons, vehicles, evidence, calls, onOpenPerson, onOpenVehicle,
}: {
  caseFile: CaseFile;
  persons: any[]; vehicles: any[]; evidence: any[]; calls: any[];
  onOpenPerson: (id: string) => void; onOpenVehicle: (id: string) => void;
}) {
  const { updateCase, addCaseNote, linkToCase } = useMDT();
  const [tab, setTab] = useState<Tab>("summary");
  const [noteDraft, setNoteDraft] = useState("");

  const relatedPersons = persons.filter((p) => caseFile.relatedPersonIds.includes(p.id));
  const relatedVehicles = vehicles.filter((v) => caseFile.relatedVehicleIds.includes(v.id));
  const relatedEvidence = evidence.filter((e) => caseFile.relatedEvidenceIds.includes(e.id));
  const relatedCalls = calls.filter((c: any) => caseFile.relatedCallIds.includes(c.id));

  const counts = [
    { label: "Personas", value: relatedPersons.length, icon: Users },
    { label: "Vehículos", value: relatedVehicles.length, icon: Car },
    { label: "Evidencias", value: relatedEvidence.length, icon: Package },
    { label: "Incidentes", value: relatedCalls.length, icon: Radio },
  ];

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Header del expediente */}
      <div className="px-5 py-4 border-b border-[#151d31]">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-white text-lg font-semibold truncate">{caseFile.title}</h2>
              <span className="text-slate-500 text-xs flex-shrink-0">{caseFile.caseNumber}</span>
            </div>
            <p className="text-slate-500 text-xs">{TYPE_LABEL[caseFile.type]} · Responsable {caseFile.leadOfficerName} · Actualizado {fmtDateTime(caseFile.updatedAt)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={caseFile.status}
              onChange={(e) => updateCase(caseFile.id, { status: e.target.value as CaseStatus })}
              className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-[#3c68c9] ${STATUS_STYLE[caseFile.status]}`}
            >
              {(Object.keys(STATUS_LABEL) as CaseStatus[]).map((s) => <option key={s} value={s} className="bg-[#121a2e] text-white">{STATUS_LABEL[s]}</option>)}
            </select>
            <select
              value={caseFile.priority}
              onChange={(e) => updateCase(caseFile.id, { priority: e.target.value as CasePriority })}
              className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-[#3c68c9] ${PRIORITY_STYLE[caseFile.priority]}`}
            >
              {(Object.keys(PRIORITY_LABEL) as CasePriority[]).map((p) => <option key={p} value={p} className="bg-[#121a2e] text-white">{PRIORITY_LABEL[p]}</option>)}
            </select>
          </div>
        </div>

        {/* Relaciones — contadores compactos */}
        <div className="flex items-center gap-2">
          {counts.map((c) => (
            <span key={c.label} className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-[#121a2e] border border-[#1e2a45] rounded-full px-2.5 py-1">
              <c.icon className="w-3 h-3" /> {c.value} {c.label.toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5 border-b border-[#151d31] overflow-x-auto flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t.id ? "border-[#3c68c9] text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {tab === "summary" && (
          <div className="space-y-4 max-w-2xl">
            <Field label="Resumen del caso">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{caseFile.summary || "Sin resumen todavía."}</p>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Abierto"><p className="text-sm text-white">{fmtDateTime(caseFile.createdAt)}</p></Field>
              <Field label="Última actualización"><p className="text-sm text-white">{fmtDateTime(caseFile.updatedAt)}</p></Field>
            </div>
            <Field label="Equipo asignado">
              {caseFile.assignedOfficerNames.length === 0 ? (
                <p className="text-slate-500 text-sm">Solo el oficial responsable.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {caseFile.assignedOfficerNames.map((n, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#121a2e] border border-[#1e2a45] text-slate-300 text-xs"><UserIcon className="w-3 h-3" /> {n}</span>
                  ))}
                </div>
              )}
            </Field>
          </div>
        )}

        {tab === "persons" && (
          <RelatedList
            items={relatedPersons}
            emptyText="Sin personas vinculadas a este caso."
            renderRow={(p) => (
              <button key={p.id} onClick={() => onOpenPerson(p.id)} className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0d1424] border border-[#151d31] hover:border-[#3c68c9]/40 transition-colors">
                <div>
                  <p className="text-white text-sm font-medium">{p.firstName} {p.lastName}</p>
                  <p className="text-slate-500 text-xs">{p.address}</p>
                </div>
                {p.riskLevel !== "None" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold">{p.riskLevel}</span>}
              </button>
            )}
            searchPool={persons.filter((p) => !caseFile.relatedPersonIds.includes(p.id))}
            searchLabel={(p) => `${p.firstName} ${p.lastName}`}
            onLink={(id) => linkToCase(caseFile.id, "relatedPersonIds", id)}
            placeholder="Vincular ciudadano por nombre..."
          />
        )}

        {tab === "vehicles" && (
          <RelatedList
            items={relatedVehicles}
            emptyText="Sin vehículos vinculados a este caso."
            renderRow={(v) => (
              <button key={v.id} onClick={() => onOpenVehicle(v.id)} className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0d1424] border border-[#151d31] hover:border-[#3c68c9]/40 transition-colors">
                <div>
                  <p className="text-white text-sm font-medium font-mono">{v.plate}</p>
                  <p className="text-slate-500 text-xs">{v.make} {v.model} · {v.registeredOwner}</p>
                </div>
                {v.isStolen && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold">ROBADO</span>}
              </button>
            )}
            searchPool={vehicles.filter((v) => !caseFile.relatedVehicleIds.includes(v.id))}
            searchLabel={(v) => `${v.plate} ${v.make} ${v.model}`}
            onLink={(id) => linkToCase(caseFile.id, "relatedVehicleIds", id)}
            placeholder="Vincular vehículo por placa o modelo..."
          />
        )}

        {tab === "evidence" && (
          <RelatedList
            items={relatedEvidence}
            emptyText="Sin evidencias vinculadas a este caso."
            renderRow={(e) => (
              <div key={e.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0d1424] border border-[#151d31]">
                <div>
                  <p className="text-white text-sm font-medium">{e.description}</p>
                  <p className="text-slate-500 text-xs">{e.evidenceNumber} · {e.type}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#121a2e] border border-[#1e2a45] text-slate-400">{e.custodyStatus}</span>
              </div>
            )}
            searchPool={evidence.filter((e) => !caseFile.relatedEvidenceIds.includes(e.id))}
            searchLabel={(e) => `${e.description} ${e.evidenceNumber}`}
            onLink={(id) => linkToCase(caseFile.id, "relatedEvidenceIds", id)}
            placeholder="Vincular evidencia por descripción o número..."
          />
        )}

        {tab === "incidents" && (
          <RelatedList
            items={relatedCalls}
            emptyText="Sin incidentes vinculados a este caso."
            renderRow={(c: any) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0d1424] border border-[#151d31]">
                <div>
                  <p className="text-white text-sm font-medium">{c.title || c.type}</p>
                  <p className="text-slate-500 text-xs">{c.callNumber} · {c.scene || c.location}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#121a2e] border border-[#1e2a45] text-slate-400">{c.status}</span>
              </div>
            )}
            searchPool={calls.filter((c: any) => !caseFile.relatedCallIds.includes(c.id))}
            searchLabel={(c: any) => `${c.title || c.type} ${c.callNumber}`}
            onLink={(id) => linkToCase(caseFile.id, "relatedCallIds", id)}
            placeholder="Vincular incidente por título o número..."
          />
        )}

        {tab === "notes" && (
          <div className="max-w-2xl space-y-3">
            <div className="flex gap-2">
              <input
                value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && noteDraft.trim()) { addCaseNote(caseFile.id, noteDraft.trim()); setNoteDraft(""); } }}
                placeholder="Añadir nota al expediente..."
                className="flex-1 bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]"
              />
              <button
                onClick={() => { if (noteDraft.trim()) { addCaseNote(caseFile.id, noteDraft.trim()); setNoteDraft(""); } }}
                className="px-3 rounded-lg bg-[#1c2b4d] hover:bg-[#3c68c9] text-white text-sm transition-colors"
              >
                Añadir
              </button>
            </div>
            {caseFile.notes.length === 0 ? (
              <p className="text-slate-600 text-sm">Sin notas todavía.</p>
            ) : (
              <div className="space-y-2">
                {[...caseFile.notes].reverse().map((n) => (
                  <div key={n.id} className="px-3 py-2.5 rounded-lg bg-[#0d1424] border border-[#151d31]">
                    <p className="text-slate-200 text-sm">{n.text}</p>
                    <p className="text-slate-600 text-[11px] mt-1">{n.authorName} · {fmtDateTime(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "activity" && (
          <div className="max-w-2xl space-y-2">
            {caseFile.activity.length === 0 ? (
              <p className="text-slate-600 text-sm">Sin actividad registrada.</p>
            ) : (
              [...caseFile.activity].reverse().map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-[#0d1424] transition-colors">
                  <Clock className="w-3.5 h-3.5 text-slate-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-slate-300 text-sm">{a.action}</p>
                    <p className="text-slate-600 text-[11px]">{a.actorName} · {fmtDateTime(a.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#121a2e] border border-[#151d31] rounded-lg px-3 py-2.5">
      <label className="block text-[#6f93d6]/80 text-[10px] font-semibold uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}

function RelatedList<T extends { id: string }>({
  items, emptyText, renderRow, searchPool, searchLabel, onLink, placeholder,
}: {
  items: T[]; emptyText: string; renderRow: (item: T) => React.ReactNode;
  searchPool: T[]; searchLabel: (item: T) => string; onLink: (id: string) => void; placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchPool.filter((item) => searchLabel(item).toLowerCase().includes(q)).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchPool]);

  return (
    <div className="max-w-2xl space-y-3">
      <div className="relative">
        <input
          value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder}
          className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]"
        />
        {results.length > 0 && (
          <div className="mt-1.5 border border-[#1e2a45] rounded-lg overflow-hidden">
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => { onLink(item.id); setQuery(""); }}
                className="w-full text-left px-3 py-2 hover:bg-[#0f1729] text-sm text-slate-200 border-b border-[#111a2c] last:border-0 transition-colors"
              >
                {searchLabel(item)}
              </button>
            ))}
          </div>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-slate-600 text-sm">{emptyText}</p>
      ) : (
        <div className="space-y-2">{items.map(renderRow)}</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function NewCaseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { createCase } = useMDT();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CaseType>("Investigation");
  const [priority, setPriority] = useState<CasePriority>("Medium");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const created = await createCase({ title: title.trim(), type, priority, summary: summary.trim() });
      if (created) { onClose(); onCreated(created.id); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0d1424] border border-[#1e2a45] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Abrir nuevo caso</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Título del caso</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Serie de robos en Vinewood..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3c68c9]" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as CaseType)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]">
                {(Object.keys(TYPE_LABEL) as CaseType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as CasePriority)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]">
                {(Object.keys(PRIORITY_LABEL) as CasePriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Resumen</label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="Describe brevemente el caso..." className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-[#3c68c9]" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving || !title.trim()} className="flex-1 bg-[#3c68c9] hover:bg-[#4d78d6] disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">
              {saving ? "Creando..." : "Abrir caso"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#111a2c] hover:bg-[#151d31] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

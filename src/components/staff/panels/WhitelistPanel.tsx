"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, CheckCircle2, XCircle, Clock, Eye, MessageSquare, Gamepad2,
  Check, X, PencilLine, Mail, CalendarDays, Hash, ChevronRight,
  AlertTriangle, Inbox, BadgeCheck, ScrollText, CreditCard, Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import { PanelHeader, TextInput, TextArea, Button, IconButton, LoadingBlock, EmptyState, formatDate, useToast } from "@/components/staff/ui";
import type { ApplicationStatus, City, DocumentType, WhitelistPhase } from "@/lib/whitelistTypes";
import { formatMemberNumber } from "@/lib/memberNumber";

const DocumentViewer3D = dynamic(() => import("@/components/documents/DocumentViewer3D"), { ssr: false });

type StatusFilter = "all" | ApplicationStatus;

interface StaffApplication {
  applicationId: string; discordId: string; fullName: string; email?: string;
  status: ApplicationStatus; currentPhase: WhitelistPhase;
  questionnaireScore?: number;
  questionnaire?: { questionId: string; question: string; answer: string }[];
  submittedAt?: string; reviewedAt?: string; reviewedBy?: string;
  createdAt: string; memberNumber?: number; staffNotes?: string;
  interviewRequested?: boolean; interviewRequestedAt?: string; interviewRequestedBy?: string; interviewNotes?: string;
  discord: { id: string; username: string; globalName?: string; avatar?: string; source: "oauth" | "dev"; joinedServer: boolean; acceptedRules: boolean };
  roblox?: { username: string; displayName?: string; avatar?: string; verificationCode: string; verified: boolean; verifiedMode?: "api" | "offline" | "oauth" };
  character?: {
    firstName: string; lastName: string; birthDate: string;
    gender: "male" | "female" | "other"; height: string; nationality: string;
    city: City; photoUrl?: string;
  };
  document?: { type: DocumentType; number: string; issueDate: string; expiryDate: string };
}

const STATUS: Record<ApplicationStatus, { label: string; dot: string; chip: string }> = {
  pending:        { label: "Pendiente",   dot: "bg-amber-400",  chip: "bg-amber-500/10 text-amber-300 ring-amber-500/30" },
  in_review:      { label: "En revisión", dot: "bg-blue-400",   chip: "bg-blue-500/10 text-blue-300 ring-blue-500/30" },
  approved:       { label: "Aprobado",    dot: "bg-emerald-400", chip: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30" },
  rejected:       { label: "Rechazado",   dot: "bg-rose-400",   chip: "bg-rose-500/10 text-rose-300 ring-rose-500/30" },
  needs_revision: { label: "Correcciones", dot: "bg-orange-400", chip: "bg-orange-500/10 text-orange-300 ring-orange-500/30" },
};
const PHASE_LABEL: Record<WhitelistPhase, string> = {
  registration: "Acceso", discord: "Discord", roblox: "Roblox", questionnaire: "Formulario",
  review: "Revisión", dni: "Documento", dni_review: "Revisión de documento", completed: "Completada",
};
const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Todas" }, { id: "pending", label: "Pendientes" }, { id: "in_review", label: "En revisión" },
  { id: "approved", label: "Aprobadas" }, { id: "rejected", label: "Rechazadas" }, { id: "needs_revision", label: "Correcciones" },
];
const scoreTone = (score = 0) => (score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-rose-400");
/** Edad real del personaje al día de hoy — para que el staff no tenga que hacer la cuenta a mano al revisar el DNI. */
const characterAge = (birthDate?: string) => {
  if (!birthDate) return null;
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((Date.now() - parsed.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

export default function WhitelistPanel({ onChanged }: { onChanged?: () => void }) {
  const toast = useToast();
  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0, needs_revision: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState<ApplicationStatus | "interview" | null>(null);

  const selected = useMemo(() => applications.find((a) => a.applicationId === selectedId) || null, [applications, selectedId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/whitelist/staff/applications?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) { setApplications(data.applications); setStats(data.stats); }
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { if (selected) setNotes(selected.staffNotes || ""); }, [selected]);

  const REVIEW_MESSAGE: Partial<Record<ApplicationStatus, string>> = {
    approved: "Solicitud aprobada", rejected: "Solicitud rechazada", needs_revision: "Se pidieron correcciones al aplicante",
  };

  const review = async (applicationId: string, status: ApplicationStatus) => {
    setSaving(status);
    try {
      const res = await fetch("/api/whitelist/staff/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status, staffNotes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        if (REVIEW_MESSAGE[status]) toast.success(REVIEW_MESSAGE[status]!);
        await load();
        onChanged?.();
      } else {
        toast.error(data.error || "No se pudo actualizar la solicitud");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(null);
    }
  };

  const requestInterview = async (applicationId: string) => {
    setSaving("interview");
    try {
      const res = await fetch("/api/whitelist/staff/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, action: "request_interview", interviewNotes: notes }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Entrevista solicitada"); await load(); }
      else toast.error(data.error || "No se pudo solicitar la entrevista");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <PanelHeader
        title="Whitelist"
        subtitle="Revisa y decide las solicitudes de acceso al servidor"
        action={
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10 w-64" />
          </div>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filter === f.id ? "bg-blue-600 text-white" : "bg-[#111827] text-slate-400 border border-[#1F2937] hover:text-white"
            }`}
          >
            {f.label} {f.id !== "all" && (stats as any)[f.id] != null ? `(${(stats as any)[f.id]})` : f.id === "all" ? `(${stats.total})` : ""}
          </button>
        ))}
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#1F2937] bg-[#0E1420] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">Aplicante</div>
          <div className="col-span-2">Discord</div>
          <div className="col-span-2">Roblox</div>
          <div className="col-span-1">Fase</div>
          <div className="col-span-1 text-center">Score</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-1 text-right">Ver</div>
        </div>

        <div className="divide-y divide-[#1F2937]">
          {loading && applications.length === 0 ? (
            <LoadingBlock />
          ) : applications.length === 0 ? (
            <EmptyState icon={Inbox} text="No hay solicitudes que coincidan" description="Prueba con otro filtro o vuelve más tarde." />
          ) : (
            applications.map((app) => (
              <button
                key={app.applicationId}
                type="button"
                onClick={() => setSelectedId(app.applicationId)}
                className={`w-full text-left grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 px-5 py-4 hover:bg-[#151C2A] transition ${selectedId === app.applicationId ? "bg-[#151C2A]" : ""}`}
              >
                <div className="lg:col-span-3 flex items-center gap-3 min-w-0">
                  {app.discord.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={app.discord.avatar} alt={app.fullName} className="w-9 h-9 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                      {app.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{app.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{app.applicationId}</div>
                  </div>
                </div>
                <div className="lg:col-span-2 flex items-center gap-2 text-sm text-slate-300 min-w-0">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" /><span className="truncate">{app.discord.username}</span>
                </div>
                <div className="lg:col-span-2 flex items-center gap-2 text-sm text-slate-300 min-w-0">
                  <Gamepad2 className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" /><span className="truncate">{app.roblox?.username || "—"}</span>
                  {app.roblox?.verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                </div>
                <div className="lg:col-span-1 flex items-center text-xs text-slate-400">{PHASE_LABEL[app.currentPhase]}</div>
                <div className="lg:col-span-1 flex items-center lg:justify-center">
                  <span className={`text-sm font-bold tabular-nums ${scoreTone(app.questionnaireScore)}`}>
                    {app.questionnaireScore != null ? `${app.questionnaireScore}%` : "—"}
                  </span>
                </div>
                <div className="lg:col-span-2 flex items-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ring-1 ${STATUS[app.status].chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS[app.status].dot}`} />{STATUS[app.status].label}
                  </span>
                </div>
                <div className="lg:col-span-1 flex items-center lg:justify-end"><ChevronRight className="h-4 w-4 text-slate-600" /></div>
              </button>
            ))
          )}
        </div>
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 animate-in fade-in duration-150" onClick={() => setSelectedId(null)} />
          <aside className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#0E1420] border-l border-[#1F2937] z-50 overflow-y-auto animate-in slide-in-from-right-4 duration-200">
            <header className="sticky top-0 bg-[#0E1420] border-b border-[#1F2937] px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {selected.discord.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.discord.avatar} alt={selected.fullName} className="w-11 h-11 rounded-full" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    {selected.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-lg font-bold text-white truncate">{selected.fullName}</div>
                  <div className="text-xs text-slate-500 font-mono">{selected.applicationId}</div>
                </div>
              </div>
              <IconButton icon={X} label="Cerrar" variant="ghost" onClick={() => setSelectedId(null)} className="flex-shrink-0" />
            </header>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ring-1 ${STATUS[selected.status].chip}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS[selected.status].dot}`} />{STATUS[selected.status].label}
                </span>
                <span className="px-3 py-1.5 rounded-lg text-sm bg-[#151C2A] text-slate-300 ring-1 ring-[#1F2937]">Fase: {PHASE_LABEL[selected.currentPhase]}</span>
                {selected.questionnaireScore != null && (
                  <span className={`px-3 py-1.5 rounded-lg text-sm bg-[#151C2A] ring-1 ring-[#1F2937] font-semibold ${scoreTone(selected.questionnaireScore)}`}>
                    Score {selected.questionnaireScore}%
                  </span>
                )}
                {selected.memberNumber != null && (
                  <span className="px-3 py-1.5 rounded-lg text-sm bg-[#151C2A] text-slate-300 ring-1 ring-[#1F2937]">Miembro {formatMemberNumber(selected.memberNumber)}</span>
                )}
                {selected.interviewRequested && (
                  <span className="px-3 py-1.5 rounded-lg text-sm bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/30">
                    Entrevista solicitada{selected.interviewRequestedBy ? ` por ${selected.interviewRequestedBy}` : ""}
                  </span>
                )}
              </div>

              <section className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider"><MessageSquare className="h-3.5 w-3.5 text-blue-400" /> Discord</div>
                  <div className="text-white font-medium">{selected.discord.username}</div>
                  <div className="text-xs text-slate-500 font-mono">{selected.discord.id}</div>
                  <div className="pt-2 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      {selected.discord.joinedServer ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-slate-600" />}
                      <span className={selected.discord.joinedServer ? "text-slate-300" : "text-slate-500"}>En el servidor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selected.discord.acceptedRules ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-slate-600" />}
                      <span className={selected.discord.acceptedRules ? "text-slate-300" : "text-slate-500"}>Reglas aceptadas</span>
                    </div>
                    {selected.discord.source === "dev" && (
                      <div className="flex items-center gap-2 text-amber-400"><AlertTriangle className="h-3.5 w-3.5" /> Sesión de prueba local</div>
                    )}
                  </div>
                </div>

                <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider"><Gamepad2 className="h-3.5 w-3.5 text-blue-400" /> Roblox</div>
                  {selected.roblox ? (
                    <>
                      <div className="text-white font-medium">{selected.roblox.displayName || selected.roblox.username}</div>
                      <div className="text-xs text-slate-500">@{selected.roblox.username}</div>
                      <div className="pt-2 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          {selected.roblox.verified ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Clock className="h-3.5 w-3.5 text-amber-400" />}
                          <span className="text-slate-300">
                            {selected.roblox.verified ? (selected.roblox.verifiedMode === "api" ? "Verificado vía roblox.com" : "Verificado (modo local)") : "Sin verificar"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500"><Hash className="h-3.5 w-3.5" /> {selected.roblox.verificationCode}</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">Todavía no vinculado</div>
                  )}
                </div>
              </section>

              <section className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3"><CalendarDays className="h-3.5 w-3.5 text-blue-400" /> Cronología</div>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Solicitud creada</dt><dd className="text-slate-300">{formatDate(selected.createdAt)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Formulario enviado</dt><dd className="text-slate-300">{formatDate(selected.submittedAt)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Revisada</dt><dd className="text-slate-300">{formatDate(selected.reviewedAt)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Revisada por</dt><dd className="text-slate-300">{selected.reviewedBy || "—"}</dd></div>
                  {selected.email && (
                    <div className="flex justify-between gap-4 sm:col-span-2"><dt className="text-slate-500 flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Email</dt><dd className="text-slate-300">{selected.email}</dd></div>
                  )}
                </dl>
              </section>

              {(selected.character || selected.document) && (
                <section className={`bg-[#111827] border rounded-xl p-4 ${selected.currentPhase === "dni_review" ? "border-amber-500/40 ring-1 ring-amber-500/20" : "border-[#1F2937]"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider"><CreditCard className="h-3.5 w-3.5 text-blue-400" /> Personaje y documento</div>
                    {selected.currentPhase === "dni_review" && (
                      <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md ring-1 ring-amber-500/30">
                        Revisá que el nombre, la edad y el personaje sean coherentes
                      </span>
                    )}
                  </div>
                  <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {selected.character && (
                      <>
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Nombre</dt><dd className="text-slate-300">{selected.character.firstName} {selected.character.lastName}</dd></div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Edad</dt>
                          <dd className={characterAge(selected.character.birthDate) != null && characterAge(selected.character.birthDate)! < 18 ? "text-rose-400 font-semibold" : "text-slate-300"}>
                            {characterAge(selected.character.birthDate) ?? "—"} años
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Ciudad</dt><dd className="text-slate-300">{selected.character.city}</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Nacionalidad</dt><dd className="text-slate-300">{selected.character.nationality}</dd></div>
                      </>
                    )}
                    {selected.document && (
                      <>
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Documento</dt><dd className="text-slate-300 font-mono">{selected.document.number}</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Caduca</dt><dd className="text-slate-300">{selected.document.expiryDate}</dd></div>
                      </>
                    )}
                  </dl>

                  {selected.character && selected.document && (
                    <div className="mt-4 pt-4 border-t border-[#1F2937]">
                      <DocumentViewer3D
                        documentType={selected.document.type}
                        city={selected.character.city}
                        firstName={selected.character.firstName}
                        lastName={selected.character.lastName}
                        birthDate={selected.character.birthDate}
                        gender={selected.character.gender}
                        height={selected.character.height}
                        nationality={selected.character.nationality}
                        robloxUsername={selected.roblox?.username || ""}
                        documentNumber={selected.document.number}
                        issueDate={selected.document.issueDate}
                        expiryDate={selected.document.expiryDate}
                        photoUrl={selected.character.photoUrl || selected.roblox?.avatar}
                      />
                    </div>
                  )}
                </section>
              )}

              <section>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3"><ScrollText className="h-3.5 w-3.5 text-blue-400" /> Respuestas del formulario</div>
                {selected.questionnaire?.length ? (
                  <div className="space-y-3">
                    {selected.questionnaire.map((item, index) => (
                      <div key={item.questionId} className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
                        <div className="flex items-start gap-2.5 mb-2">
                          <span className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">{index + 1}</span>
                          <span className="text-xs font-medium text-slate-400">{item.question}</span>
                        </div>
                        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed pl-8">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 text-center text-sm text-slate-500">Todavía no ha enviado el formulario</div>
                )}
              </section>

              <section className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notas del staff</label>
                  <TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="El aplicante verá estas notas en su página de estado..."
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                  <Button variant="secondary" size="md" icon={Eye} loading={saving === "in_review"} disabled={saving !== null} onClick={() => review(selected.applicationId, "in_review")} className="h-11 text-sky-300 ring-1 ring-sky-500/20">Revisar</Button>
                  <Button variant="secondary" size="md" icon={Users} loading={saving === "interview"} disabled={saving !== null} onClick={() => requestInterview(selected.applicationId)} className="h-11 text-purple-300 ring-1 ring-purple-500/20">Entrevistar</Button>
                  <Button variant="secondary" size="md" icon={PencilLine} loading={saving === "needs_revision"} disabled={saving !== null} onClick={() => review(selected.applicationId, "needs_revision")} className="h-11 text-orange-300 ring-1 ring-orange-500/20">Corregir</Button>
                  <Button variant="danger" size="md" icon={X} loading={saving === "rejected"} disabled={saving !== null} onClick={() => review(selected.applicationId, "rejected")} className="h-11">Rechazar</Button>
                  <Button variant="primary" size="md" icon={Check} loading={saving === "approved"} disabled={saving !== null} onClick={() => review(selected.applicationId, "approved")} className="h-11">Aprobar</Button>
                </div>
              </section>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

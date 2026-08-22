"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, X, Loader2, Ticket, Send, Lock, ShieldCheck, MessageCircle,
  UserCog, CheckCircle2, Paperclip, Circle, Settings, Trash2,
} from "lucide-react";
import { PanelHeader, Card, CardTitle, Chip, TextInput, TextArea, Select, PrimaryButton, LoadingBlock, EmptyState, formatDate, useToast, Pagination, SortToggle } from "@/components/staff/ui";

type TicketStatus = "open" | "in_progress" | "closed";
type TicketPriority = "low" | "medium" | "high" | "critical";
type TicketCategory = string;
interface TicketMsg { author: string; authorRole: "staff" | "user"; body: string; createdAt: string; }
interface TicketNote { author: string; body: string; createdAt: string; }
interface TicketDoc {
  id: string; ticketNumber: number; subject: string; category: TicketCategory; priority: TicketPriority; playerName: string;
  status: TicketStatus; assignedTo?: string; messages: TicketMsg[]; internalNotes: TicketNote[];
  lastMessageFrom: "user" | "staff"; createdAt: string; updatedAt: string;
}

const STATUS_CHIP: Record<TicketStatus, { tone: "amber" | "blue" | "slate"; label: string }> = {
  open: { tone: "amber", label: "Abierto" }, in_progress: { tone: "blue", label: "En curso" }, closed: { tone: "slate", label: "Cerrado" },
};
const PRIORITY_CHIP: Record<TicketPriority, { tone: "slate" | "blue" | "amber" | "rose"; label: string }> = {
  low: { tone: "slate", label: "Baja" }, medium: { tone: "blue", label: "Media" }, high: { tone: "amber", label: "Alta" }, critical: { tone: "rose", label: "Crítica" },
};
const QUICK_REPLIES = [
  "Hola, ¿en qué puedo ayudarte?",
  "Dame un momento para revisarlo.",
  "Hemos resuelto tu solicitud, ¡gracias por tu paciencia!",
  "Necesito más información para continuar.",
  "Estamos trabajando en ello.",
];

function monogram(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || parts[0]?.[1] || "")).toUpperCase();
}
const AVATAR_TONES = [
  "bg-blue-600/20 text-blue-300", "bg-emerald-600/20 text-emerald-300", "bg-amber-600/20 text-amber-300",
  "bg-rose-600/20 text-rose-300", "bg-purple-600/20 text-purple-300", "bg-sky-600/20 text-sky-300",
];
function avatarTone(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export default function TicketsPanel({ onChanged }: { onChanged?: () => void }) {
  const toast = useToast();
  const [tickets, setTickets] = useState<TicketDoc[]>([]);
  const [open, setOpen] = useState(0);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "notes">("chat");
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [form, setForm] = useState({ subject: "", category: "", priority: "medium" as TicketPriority, playerName: "", message: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const scrollRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => tickets.find((t) => t.id === selectedId) || null, [tickets, selectedId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), sort });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/staff/tickets?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) { setTickets(data.tickets); setOpen(data.open); setTotalPages(data.totalPages || 1); }
    } finally {
      setLoading(false);
    }
  }, [filter, page, sort]);

  useEffect(() => { setPage(1); }, [filter, sort]);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/staff/tickets/categories", { cache: "no-store" });
    const data = await res.json();
    if (data.success) {
      const names = data.categories.map((c: { name: string }) => c.name);
      setCategories(names);
      setForm((f) => (f.category ? f : { ...f, category: names[0] || "Otro" }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/staff/tickets/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCategory.trim() }) });
    const data = await res.json();
    if (data.success) toast.success(`Categoría "${newCategory.trim()}" creada`);
    else toast.error(data.error || "No se pudo crear la categoría");
    setNewCategory("");
    await loadCategories();
  };

  const removeCategory = async (name: string) => {
    const cat = categories.find((c) => c === name);
    if (!cat) return;
    const res = await fetch("/api/staff/tickets/categories", { cache: "no-store" });
    const data = await res.json();
    const doc = data.categories?.find((c: { name: string }) => c.name === name);
    if (!doc) return;
    await fetch(`/api/staff/tickets/categories?id=${doc.id}`, { method: "DELETE" });
    toast.success(`Categoría "${name}" eliminada`);
    await loadCategories();
  };

  const changePriority = async (priority: TicketPriority) => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch("/api/staff/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, action: "priority", priority }) });
      await load();
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => { setTab("chat"); }, [selectedId]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [selected?.messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/staff/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { setForm({ subject: "", category: categories[0] || "Otro", priority: "medium", playerName: "", message: "" }); setShowForm(false); await load(); onChanged?.(); setSelectedId(data.ticket.id); }
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (text?: string) => {
    const body = text ?? reply;
    if (!selected || !body.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/staff/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, action: "reply", body }) });
      setReply("");
      await load();
      onChanged?.();
    } finally {
      setSaving(false);
    }
  };

  const sendNote = async () => {
    if (!selected || !note.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/staff/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, action: "note", body: note }) });
      setNote("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const close = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, action: "status", status: "closed" }) });
      const data = await res.json();
      if (data.success) toast.success(`Ticket #${selected.ticketNumber} cerrado`);
      else toast.error(data.error || "No se pudo cerrar el ticket");
      await load();
      onChanged?.();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const reassign = async () => {
    if (!selected) return;
    const name = window.prompt("Asignar este ticket a (nombre del staff):", selected.assignedTo || "");
    if (name === null) return;
    setSaving(true);
    try {
      await fetch("/api/staff/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, action: "assign", assignedTo: name || undefined }) });
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PanelHeader
        title="Tickets"
        subtitle={`${open} tickets abiertos`}
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowCategoryManager((v) => !v)} className="h-10 w-10 flex items-center justify-center rounded-lg border border-[#1F2937] text-slate-400 hover:text-white hover:border-blue-500/50 transition" title="Categorías">
              <Settings className="h-4 w-4" />
            </button>
            <PrimaryButton onClick={() => setShowForm((v) => !v)}>
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Nuevo ticket
            </PrimaryButton>
          </div>
        }
      />

      {showCategoryManager && (
        <Card className="p-4 mb-4">
          <CardTitle className="mb-3">Categorías de tickets</CardTitle>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((c) => (
              <span key={c} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#151C2A] ring-1 ring-[#1F2937] text-xs text-slate-300">
                {c}
                <button type="button" onClick={() => removeCategory(c)} className="text-slate-500 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <TextInput placeholder="Nueva categoría..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1" />
            <button type="button" onClick={addCategory} disabled={!newCategory.trim()} className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition">Añadir</button>
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
            <TextInput placeholder="Jugador" value={form.playerName} onChange={(e) => setForm((f) => ({ ...f, playerName: e.target.value }))} required />
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <TextInput className="sm:col-span-2" placeholder="Asunto" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required />
            <Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))}>
              {Object.entries(PRIORITY_CHIP).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </Select>
            <TextArea className="sm:col-span-2" rows={2} placeholder="Mensaje inicial (opcional)" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
            <div className="sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear ticket"}</PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2 pb-4">
        <div className="flex gap-2">
          {(["all", "open", "in_progress", "closed"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${filter === s ? "bg-blue-600 text-white" : "bg-[#111827] text-slate-400 border border-[#1F2937] hover:text-white"}`}>
              {s === "all" ? "Todos" : STATUS_CHIP[s].label}
            </button>
          ))}
        </div>
        <SortToggle value={sort} onChange={setSort} />
      </div>

      {loading && tickets.length === 0 ? (
        <LoadingBlock />
      ) : tickets.length === 0 ? (
        <EmptyState icon={Ticket} text="No hay tickets" />
      ) : (
        <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
          {/* Lista */}
          <div>
          <div className="space-y-2 lg:max-h-[calc(100vh-320px)] lg:overflow-y-auto lg:pr-1">
            {tickets.map((t) => {
              const unread = t.lastMessageFrom === "user" && t.status !== "closed";
              const isActive = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition ${
                    isActive ? "bg-blue-600/10 border-blue-500/40 ring-1 ring-blue-500/30" : "bg-[#111827] border-[#1F2937] hover:border-blue-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      {unread && <Circle className="h-2 w-2 fill-blue-400 text-blue-400 animate-pulse" />}
                      <span className="font-mono">#{t.ticketNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {t.priority && t.priority !== "medium" && <Chip tone={PRIORITY_CHIP[t.priority].tone} label={PRIORITY_CHIP[t.priority].label} />}
                      <Chip tone={STATUS_CHIP[t.status].tone} label={STATUS_CHIP[t.status].label} />
                    </div>
                  </div>
                  <div className={`text-sm truncate ${unread ? "font-semibold text-white" : "font-medium text-slate-200"}`}>{t.subject}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${avatarTone(t.playerName)}`}>
                      {monogram(t.playerName)}
                    </div>
                    <span className="text-xs text-slate-500 truncate">{t.playerName} · {t.category}</span>
                  </div>
                  {t.assignedTo && (
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-blue-400">
                      <UserCog className="h-3 w-3" /> {t.assignedTo}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>

          {/* Detalle */}
          {!selected ? (
            <Card className="hidden lg:flex flex-col items-center justify-center p-16 text-center min-h-[400px]">
              <MessageCircle className="h-10 w-10 text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">Selecciona un ticket para ver la conversación</p>
            </Card>
          ) : (
            <Card className="flex flex-col overflow-hidden lg:h-[calc(100vh-260px)]">
              {/* Header */}
              <div className="p-4 border-b border-[#1F2937] flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-white font-bold truncate">{selected.subject}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
                    <span className="font-mono">#{selected.ticketNumber}</span>
                    <Chip tone={STATUS_CHIP[selected.status].tone} label={STATUS_CHIP[selected.status].label} />
                    {selected.priority && <Chip tone={PRIORITY_CHIP[selected.priority].tone} label={PRIORITY_CHIP[selected.priority].label} />}
                    <span className="flex items-center gap-1">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${avatarTone(selected.playerName)}`}>{monogram(selected.playerName)}</span>
                      {selected.playerName}
                    </span>
                    <span>{selected.category}</span>
                    {selected.assignedTo && <span className="text-blue-400">{selected.assignedTo}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select value={selected.priority || "medium"} onChange={(e) => changePriority(e.target.value as TicketPriority)} className="h-8 px-2 rounded-lg bg-[#151C2A] ring-1 ring-[#1F2937] text-slate-300 text-xs">
                    {Object.entries(PRIORITY_CHIP).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                  <button type="button" onClick={reassign} className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-[#151C2A] hover:bg-[#1B2436] text-slate-300 text-xs font-medium ring-1 ring-[#1F2937] transition">
                    <UserCog className="h-3.5 w-3.5" /> Reasignar
                  </button>
                  {selected.status !== "closed" && (
                    <button type="button" onClick={close} disabled={saving} className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 text-xs font-medium ring-1 ring-emerald-500/30 transition disabled:opacity-50">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Cerrar
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#1F2937] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setTab("chat")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${tab === "chat" ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Conversación
                  <span className="px-1.5 py-0.5 rounded-full bg-[#151C2A] text-[10px]">{selected.messages.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("notes")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${tab === "notes" ? "border-amber-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                >
                  <Lock className="h-3.5 w-3.5" /> Notas Internas
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[9px] font-bold uppercase tracking-wide">Staff</span>
                </button>
              </div>

              {tab === "chat" ? (
                <>
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px]">
                    {selected.messages.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">Sin mensajes todavía</p>
                    ) : (
                      selected.messages.map((m, i) => (
                        <div key={i} className={`flex ${m.authorRole === "staff" ? "justify-end" : "justify-start"}`}>
                          {m.authorRole === "user" && (
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mr-2 mt-0.5 ${avatarTone(m.author)}`}>
                              {monogram(m.author)}
                            </div>
                          )}
                          <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                            m.authorRole === "staff" ? "bg-blue-600/15 ring-1 ring-blue-500/30 rounded-tr-sm" : "bg-[#151C2A] rounded-tl-sm"
                          }`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-xs font-medium text-slate-300">{m.author}</span>
                              {m.authorRole === "staff" && <ShieldCheck className="h-3 w-3 text-blue-400" title="Respuesta verificada del staff" />}
                              <span className="text-[10px] text-slate-600">{formatDate(m.createdAt)}</span>
                            </div>
                            <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{m.body}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 border-t border-[#1F2937] flex-shrink-0 space-y-2">
                    {selected.status !== "closed" && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {QUICK_REPLIES.map((q) => (
                          <button key={q} type="button" onClick={() => sendReply(q)} disabled={saving} className="flex-shrink-0 px-2.5 py-1 rounded-full bg-[#151C2A] hover:bg-[#1B2436] text-[11px] text-slate-400 hover:text-white ring-1 ring-[#1F2937] transition disabled:opacity-50">
                            {q.length > 28 ? q.slice(0, 28) + "…" : q}
                          </button>
                        ))}
                      </div>
                    )}
                    {selected.status !== "closed" ? (
                      <div className="flex items-center gap-2">
                        <button type="button" className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-[#151C2A] transition flex-shrink-0" title="Adjuntar (próximamente)">
                          <Paperclip className="h-4 w-4" />
                        </button>
                        <input
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                          placeholder="Escribe una respuesta... (Enter para enviar, Shift+Enter nueva línea)"
                          className="flex-1 h-10 px-3 bg-[#0B0F17] border border-[#1F2937] rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                        />
                        <button type="button" onClick={() => sendReply()} disabled={saving || !reply.trim()} className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition flex-shrink-0">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-slate-500 py-2">Este ticket está cerrado</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="px-4 py-2.5 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-2 text-xs text-amber-300 flex-shrink-0">
                    <Lock className="h-3.5 w-3.5" /> Chat privado — solo visible para el equipo de staff. El jugador no puede leer estos mensajes.
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px]">
                    {selected.internalNotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <Lock className="h-8 w-8 text-slate-700 mb-2" />
                        <p className="text-sm text-slate-500">No hay notas internas aún</p>
                      </div>
                    ) : (
                      selected.internalNotes.map((n, i) => (
                        <div key={i} className="bg-amber-500/5 ring-1 ring-amber-500/15 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-medium text-amber-200">{n.author}</span>
                            <span className="text-[10px] text-slate-600">{formatDate(n.createdAt)}</span>
                          </div>
                          <p className="text-sm text-slate-200 whitespace-pre-wrap">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-[#1F2937] flex items-center gap-2 flex-shrink-0">
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendNote()}
                      placeholder="Nota interna (solo staff)..."
                      className="flex-1 h-10 px-3 bg-[#0B0F17] border border-amber-500/20 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition"
                    />
                    <button type="button" onClick={sendNote} disabled={saving || !note.trim()} className="h-10 w-10 flex items-center justify-center rounded-lg bg-amber-600/80 hover:bg-amber-600 disabled:opacity-50 text-white transition flex-shrink-0">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

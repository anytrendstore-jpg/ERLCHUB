"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import {
  LifeBuoy, Ticket, Flag, Plus, X, Send, Loader2, ChevronRight,
  MessageSquare, Lock, AlertCircle, CheckCircle2, ShieldCheck,
} from "lucide-react";

type TicketStatus = "open" | "in_progress" | "closed";
type TicketCategory = "Soporte Técnico" | "Whitelist" | "Pagos" | "Reporte" | "Otro";
interface TicketMsg { author: string; authorRole: "staff" | "user"; body: string; createdAt: string; }
interface TicketDoc {
  id: string; ticketNumber: number; subject: string; category: TicketCategory; status: TicketStatus;
  messages: TicketMsg[]; createdAt: string; updatedAt: string;
}

const CATEGORIES: TicketCategory[] = ["Soporte Técnico", "Whitelist", "Pagos", "Reporte", "Otro"];

const STATUS_LABEL: Record<TicketStatus, { label: string; tone: string }> = {
  open: { label: "Esperando respuesta", tone: "bg-amber-500/10 text-amber-300 ring-amber-500/30" },
  in_progress: { label: "Respondido por staff", tone: "bg-blue-500/10 text-blue-300 ring-blue-500/30" },
  closed: { label: "Resuelto y cerrado", tone: "bg-slate-500/10 text-slate-300 ring-slate-500/30" },
};

const formatDate = (v?: string) =>
  v ? new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function monogram(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || parts[0]?.[1] || "")).toUpperCase();
}

export default function SoportePage() {
  const { isAuthenticated, user, isLoading: authLoading } = useDiscordAuth();
  const [tab, setTab] = useState<"tickets" | "report">("tickets");

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-[#8e00f7]/20 flex items-center justify-center">
              <LifeBuoy className="h-6 w-6 text-[#8e00f7]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Soporte</h1>
              <p className="text-sm text-gray-400">Abre un ticket o reporta a otro jugador — llega directo al staff</p>
            </div>
          </div>

          <div className="flex bg-[#12121c] border border-[#1a1a28] rounded-xl p-1 my-6 max-w-md">
            <button
              type="button"
              onClick={() => setTab("tickets")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                tab === "tickets" ? "bg-[#8e00f7] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Ticket className="h-4 w-4" /> Mis Tickets
            </button>
            <button
              type="button"
              onClick={() => setTab("report")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                tab === "report" ? "bg-[#8e00f7] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Flag className="h-4 w-4" /> Reportar Jugador
            </button>
          </div>

          {authLoading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 text-[#8e00f7] animate-spin" /></div>
          ) : !isAuthenticated ? (
            <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-10 text-center">
              <Lock className="h-9 w-9 text-gray-600 mx-auto mb-3" />
              <h2 className="text-white font-semibold mb-1">Inicia sesión para continuar</h2>
              <p className="text-sm text-gray-400">Necesitas tu cuenta de Discord para abrir tickets o reportar jugadores.</p>
            </div>
          ) : tab === "tickets" ? (
            <TicketsTab playerName={user?.global_name || user?.username || "Jugador"} />
          ) : (
            <ReportTab />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function TicketsTab({ playerName }: { playerName: string }) {
  const [tickets, setTickets] = useState<TicketDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", category: "Soporte Técnico" as TicketCategory, message: "" });

  const selected = useMemo(() => tickets.find((t) => t.id === selectedId) || null, [tickets, selectedId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setTickets(data.tickets);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ subject: "", category: "Soporte Técnico", message: "" });
        setShowForm(false);
        await load();
        setSelectedId(data.ticket.id);
      } else {
        setError(data.error || "No se pudo crear el ticket");
      }
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, body: reply }),
      });
      const data = await res.json();
      if (data.success) { setReply(""); await load(); }
    } finally {
      setSaving(false);
    }
  };

  if (selected) {
    return (
      <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl overflow-hidden animate-modal-card">
        <div className="p-5 border-b border-[#1a1a28] flex items-center justify-between">
          <div className="min-w-0">
            <button type="button" onClick={() => setSelectedId(null)} className="text-xs text-gray-500 hover:text-white transition mb-1">
              ← Volver a mis tickets
            </button>
            <h2 className="text-white font-bold truncate">{selected.subject}</h2>
            <p className="text-xs text-gray-500 font-mono">#{selected.ticketNumber} · {selected.category}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ring-1 flex-shrink-0 ${STATUS_LABEL[selected.status].tone}`}>
            {STATUS_LABEL[selected.status].label}
          </span>
        </div>

        <div className="px-5 py-2.5 bg-[#8e00f7]/5 border-b border-[#8e00f7]/10 flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="h-3.5 w-3.5 text-[#8e00f7] flex-shrink-0" />
          Solo tú y nuestro staff verificado pueden ver esta conversación
        </div>

        <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto">
          {selected.messages.map((m, i) => (
            <div key={i} className={`flex animate-msg-in ${m.authorRole === "staff" ? "justify-start" : "justify-end"}`} style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
              {m.authorRole === "staff" && (
                <div className="w-7 h-7 rounded-full bg-[#8e00f7]/20 text-[#c084fc] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mr-2 mt-0.5">
                  {monogram(m.author)}
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl p-3 ${
                m.authorRole === "staff" ? "bg-[#8e00f7]/10 ring-1 ring-[#8e00f7]/30 rounded-tl-sm" : "bg-[#1a1a28] rounded-tr-sm"
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-medium text-gray-300">{m.author}</span>
                  {m.authorRole === "staff" && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#8e00f7]/20 text-[#c084fc] text-[9px] font-bold uppercase tracking-wide">
                      <ShieldCheck className="h-2.5 w-2.5" /> Staff verificado
                    </span>
                  )}
                </div>
                <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{m.body}</p>
                <div className="text-[10px] text-gray-600 mt-1">{formatDate(m.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#1a1a28]">
          {selected.status !== "closed" ? (
            <div className="flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                placeholder="Escribe tu respuesta..."
                className="flex-1 h-11 px-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7]"
              />
              <button
                type="button"
                onClick={sendReply}
                disabled={saving || !reply.trim()}
                className="h-11 w-11 flex items-center justify-center rounded-xl bg-[#8e00f7] hover:bg-[#7a00d4] disabled:opacity-50 text-white transition"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <CheckCircle2 className="h-4 w-4 text-[#22c55e]" /> Este ticket quedó resuelto y está cerrado
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-start gap-2 text-xs text-gray-500 max-w-md">
          <ShieldCheck className="h-4 w-4 text-[#8e00f7] flex-shrink-0 mt-0.5" />
          <p>Cada ticket es privado: solo tú y el staff verificado pueden verlo y responderlo.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8e00f7] hover:bg-[#7a00d4] text-white text-sm font-semibold transition flex-shrink-0"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Nuevo ticket
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-5 mb-6 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Asunto"
              className="h-11 px-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7]"
              required
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TicketCategory }))}
              className="h-11 px-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-[#8e00f7]"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <textarea
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="Cuéntanos qué necesitas..."
            rows={4}
            className="w-full p-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7] resize-none"
            required
          />
          {error && <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="h-11 px-6 flex items-center justify-center gap-2 rounded-xl bg-[#8e00f7] hover:bg-[#7a00d4] disabled:opacity-50 text-white font-semibold transition"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar ticket"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 text-[#8e00f7] animate-spin" /></div>
      ) : tickets.length === 0 ? (
        <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-10 text-center">
          <MessageSquare className="h-9 w-9 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No tienes ningún ticket todavía, {playerName}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              className="w-full flex items-center justify-between gap-4 bg-[#12121c] border border-[#1a1a28] hover:border-[#8e00f7]/40 rounded-xl p-4 text-left transition animate-msg-in"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] text-gray-600 font-mono">#{t.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ring-1 ${STATUS_LABEL[t.status].tone}`}>
                    {STATUS_LABEL[t.status].label}
                  </span>
                  <span className="text-[11px] text-gray-500">{t.category}</span>
                </div>
                <div className="text-white font-medium truncate">{t.subject}</div>
                <div className="text-xs text-gray-500">{formatDate(t.updatedAt)}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportTab() {
  const [form, setForm] = useState({ targetName: "", reason: "", details: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/support/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setForm({ targetName: "", reason: "", details: "" }); setSent(true); }
      else setError(data.error || "No se pudo enviar el reporte");
    } finally {
      setSaving(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-[#22c55e] mx-auto mb-3" />
        <h2 className="text-white font-semibold mb-1">Reporte enviado</h2>
        <p className="text-sm text-gray-400 mb-4">El staff lo revisará en su panel. Gracias por ayudar a mantener la comunidad sana.</p>
        <button type="button" onClick={() => setSent(false)} className="text-sm text-[#8e00f7] hover:underline">
          Enviar otro reporte
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6 space-y-4">
      <input
        value={form.targetName}
        onChange={(e) => setForm((f) => ({ ...f, targetName: e.target.value }))}
        placeholder="Usuario o personaje reportado"
        className="w-full h-12 px-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7]"
        required
      />
      <input
        value={form.reason}
        onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
        placeholder="Motivo (ej. RDM, VDM, Fail RP, lenguaje inapropiado...)"
        className="w-full h-12 px-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7]"
        required
      />
      <textarea
        value={form.details}
        onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
        placeholder="Describe lo que ocurrió, con la mayor cantidad de detalles posible (hora, lugar, testigos, evidencia si tienes)..."
        rows={5}
        className="w-full p-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7] resize-none"
      />
      {error && <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-[#8e00f7] hover:bg-[#7a00d4] disabled:opacity-50 text-white font-semibold transition"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar reporte al staff"}
      </button>
    </form>
  );
}

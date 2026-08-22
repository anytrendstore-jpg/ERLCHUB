"use client";

import { useEffect, useMemo, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import type { Message, MessagePriority } from "@/lib/mdtTypes";
import { Plus, MessageSquare, X, Send, AlertTriangle } from "lucide-react";

function fmtDateTime(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }) +
    ", " + new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

type Tab = "inbox" | "sent";

export function MDTMessagesContent({
  showCompose,
  setShowCompose,
}: {
  showCompose: boolean;
  setShowCompose: (v: boolean) => void;
}) {
  const { state, markMessageRead } = useMDT();
  const { messages, currentOfficer } = state;
  const [tab, setTab] = useState<Tab>("inbox");
  const [selected, setSelected] = useState<Message | null>(null);

  const inbox = useMemo(() => messages.filter((m) => m.to === currentOfficer?.id).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()), [messages, currentOfficer]);
  const sent = useMemo(() => messages.filter((m) => m.from === currentOfficer?.id).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()), [messages, currentOfficer]);
  const list = tab === "inbox" ? inbox : sent;
  const unread = inbox.filter((m) => !m.isRead).length;

  const openMessage = (m: Message) => {
    setSelected(m);
    if (tab === "inbox" && !m.isRead) markMessageRead(m.id);
  };

  return (
    <>
      <div className="flex gap-2 mb-5">
        <button onClick={() => { setTab("inbox"); setSelected(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === "inbox" ? "bg-[#3c68c9] text-white" : "bg-[#0d1424] text-slate-400 border border-[#151d31] hover:text-white"}`}>
          Recibidos {unread > 0 && <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{unread}</span>}
        </button>
        <button onClick={() => { setTab("sent"); setSelected(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "sent" ? "bg-[#3c68c9] text-white" : "bg-[#0d1424] text-slate-400 border border-[#151d31] hover:text-white"}`}>
          Enviados
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {list.length === 0 && (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-6 text-center">
              <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Sin mensajes.</p>
            </div>
          )}
          {list.map((m) => (
            <button
              key={m.id}
              onClick={() => openMessage(m)}
              className={`w-full text-left bg-[#0d1424] border rounded-lg p-3.5 transition-colors ${selected?.id === m.id ? "border-[#3c68c9]" : "border-[#151d31] hover:border-[#1e2a45]"} ${tab === "inbox" && !m.isRead ? "border-l-2 border-l-[#3c68c9]" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm font-semibold truncate">{tab === "inbox" ? m.fromName : m.toName}</span>
                {m.priority === "Urgent" && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
              </div>
              <p className={`text-xs truncate ${tab === "inbox" && !m.isRead ? "text-white font-medium" : "text-slate-400"}`}>{m.subject}</p>
              <p className="text-slate-600 text-[10px] mt-1">{fmtDateTime(m.sentAt)}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-10 text-center">
              <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Selecciona un mensaje para leerlo.</p>
            </div>
          ) : (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selected.subject}</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {tab === "inbox" ? `De: ${selected.fromName}` : `Para: ${selected.toName}`} · {fmtDateTime(selected.sentAt)}
                  </p>
                </div>
                {selected.priority === "Urgent" && <span className="px-2 py-0.5 bg-red-500/15 text-red-400 rounded text-[11px] font-bold flex-shrink-0">URGENTE</span>}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap border-t border-[#151d31] pt-4">{selected.body}</p>
            </div>
          )}
        </div>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} me={currentOfficer} />}
    </>
  );
}

export default function MDTMessages() {
  const [showCompose, setShowCompose] = useState(false);

  return (
    <MDTLayout
      title="Mensajes"
      subtitle="Mensajería interna entre unidades"
      actions={
        <button onClick={() => setShowCompose(true)} className="flex items-center gap-2 bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> Redactar
        </button>
      }
    >
      <MDTMessagesContent showCompose={showCompose} setShowCompose={setShowCompose} />
    </MDTLayout>
  );
}

function ComposeModal({ onClose, me }: { onClose: () => void; me: any }) {
  const { sendMessage } = useMDT();
  const [officers, setOfficers] = useState<any[]>([]);
  const [toId, setToId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<MessagePriority>("Normal");

  useEffect(() => {
    fetch("/api/mdt/officers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOfficers(d.officers.filter((o: any) => o.discordId !== me?.id)); });
  }, [me]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = officers.find((o) => o.discordId === toId);
    if (!target || !subject.trim() || !body.trim() || !me) return;
    sendMessage({
      from: me.id, fromName: `${me.rank} ${me.lastName}`,
      to: target.discordId, toName: `${target.rank} ${target.lastName}`,
      subject: subject.trim(), body: body.trim(), priority,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0d1424] border border-[#151d31] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Redactar mensaje</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Para</label>
            <select value={toId} onChange={(e) => setToId(e.target.value)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]" required>
              <option value="">
                {officers.length === 0 ? "Sin oficiales en servicio" : "Selecciona un oficial en servicio..."}
              </option>
              {officers.map((o) => <option key={o.discordId} value={o.discordId}>{o.rank} {o.lastName} (#{o.badgeNumber})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Prioridad</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as MessagePriority)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]">
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Asunto</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3c68c9]" required />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Mensaje</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#3c68c9]" required />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={!toId} className="flex-1 bg-[#3c68c9] hover:bg-[#4d78d6] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"><Send className="w-4 h-4" /> Enviar</button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#111a2c] hover:bg-[#151d31] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

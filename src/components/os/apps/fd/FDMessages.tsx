"use client";

import { useState } from "react";
import { Plus, Mail, MailOpen, X } from "lucide-react";
import { useFD } from "@/contexts/FDContext";

/** Mensajería interna de LSFD — completamente separada de MDTMessages (fd_messages, no mdt_messages). */
export default function FDMessages() {
  const { state, sendMessage, markMessageRead } = useFD();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ to: "", toName: "", subject: "", body: "" });
  const firefighter = state.currentFirefighter;

  const submit = () => {
    if (!firefighter || !form.to.trim() || !form.subject.trim()) return;
    sendMessage({
      from: firefighter.id,
      fromName: `${firefighter.firstName} ${firefighter.lastName}`,
      to: form.to.trim(),
      toName: form.toName.trim() || form.to.trim(),
      subject: form.subject.trim(),
      body: form.body.trim(),
      priority: "Normal",
    });
    setForm({ to: "", toName: "", subject: "", body: "" });
    setShowNew(false);
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-end px-2.5 border-b border-[#2a2620] flex-shrink-0">
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[#c1975a] hover:text-[#e5e3de] transition-colors">
          <Plus className="w-3 h-3" /> Redactar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew && (
          <div className="mb-3 bg-[#141312] border border-[#2a2620] rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nuevo mensaje</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <input placeholder="Discord ID del destinatario" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value.trim() })} className="w-full bg-[#0e0d0c] border border-[#2a2620] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[#c1975a]" />
            <input placeholder="Nombre del destinatario" value={form.toName} onChange={(e) => setForm({ ...form, toName: e.target.value })} className="w-full bg-[#0e0d0c] border border-[#2a2620] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[#c1975a]" />
            <input placeholder="Asunto" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full bg-[#0e0d0c] border border-[#2a2620] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[#c1975a]" />
            <textarea placeholder="Mensaje" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className="w-full bg-[#0e0d0c] border border-[#2a2620] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[#c1975a] resize-none" />
            <button disabled={!form.to.trim() || !form.subject.trim()} onClick={submit} className="w-full bg-[#c1975a] disabled:opacity-40 text-[#0a0a0c] font-semibold rounded py-1.5">
              Enviar
            </button>
          </div>
        )}

        {state.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <Mail className="w-8 h-8" />
            <p>Sin mensajes.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {state.messages.map((m) => {
              const isInbound = m.to === firefighter?.id;
              return (
                <button
                  key={m.id}
                  onClick={() => { if (isInbound && !m.isRead) markMessageRead(m.id); }}
                  className="w-full text-left px-3 py-2 rounded bg-[#141312] border border-[#2a2620] hover:border-[#3d372e] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    {isInbound && !m.isRead ? <Mail className="w-3.5 h-3.5 text-[#c1975a] flex-shrink-0" /> : <MailOpen className="w-3.5 h-3.5 text-[#57534a] flex-shrink-0" />}
                    <span className={`truncate ${isInbound && !m.isRead ? "text-[#e5e3de] font-semibold" : "text-[#867e70]"}`}>{m.subject}</span>
                  </div>
                  <p className="text-[#57534a] text-[10px]">{isInbound ? `De: ${m.fromName}` : `Para: ${m.toName}`}</p>
                  {m.body && <p className="text-[#867e70] mt-1 line-clamp-2">{m.body}</p>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

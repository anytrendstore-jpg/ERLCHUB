'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Radio as RadioLucide, Users, Send, LogOut, SignalHigh } from 'lucide-react';
import { RADIO_CHANNELS } from '@/lib/radioChannels';

interface ChannelState {
  id: string;
  name: string;
  frequency: string;
  connected: number;
}

interface RadioMsg {
  id: string;
  channelId: string;
  username: string;
  text: string;
  createdAt: string;
}

const POLL_MS = 6000;

export default function RadioApp() {
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelState[]>(RADIO_CHANNELS.map((c) => ({ ...c, connected: 0 })));
  const [messages, setMessages] = useState<RadioMsg[]>([]);
  const [usersInChannel, setUsersInChannel] = useState<{ discordId: string; username: string }[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const url = activeChannel ? `/api/radio/state?channelId=${activeChannel}` : '/api/radio/state';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) return;
      setChannels(data.channels);
      if (activeChannel) {
        setMessages(data.messages);
        setUsersInChannel(data.usersInChannel);
      }
    } catch {
      // Silencioso: se mantiene el último estado conocido.
    }
  }, [activeChannel]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const tune = async (channelId: string | null) => {
    setActiveChannel(channelId);
    setMessages([]);
    setUsersInChannel([]);
    await fetch('/api/radio/tune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    });
  };

  const sendMessage = async () => {
    if (!activeChannel || !draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/radio/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: activeChannel, text: draft.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setDraft('');
        setMessages((prev) => [...prev, data.message]);
      }
    } finally {
      setSending(false);
    }
  };

  const activeChannelInfo = channels.find((c) => c.id === activeChannel);

  return (
    <div className="h-full flex bg-[#0a0a0f]">
      {/* Lista de canales */}
      <div className="w-64 bg-[#0d0d14] border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <RadioLucide className="w-5 h-5 text-orange-400" /> Radio
          </h2>
          <p className="text-white/40 text-xs mt-1">Cambio rápido de frecuencia</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => tune(c.id)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-colors text-left
                ${activeChannel === c.id ? 'bg-orange-600/20 border border-orange-500/40' : 'hover:bg-white/5 border border-transparent'}
              `}
            >
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{c.name}</p>
                <p className="text-white/40 text-[11px]">{c.frequency} MHz</p>
              </div>
              <div className="flex items-center gap-1 text-white/50 text-xs flex-shrink-0">
                {c.connected > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                <Users className="w-3 h-3" /> {c.connected}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Canal activo */}
      <div className="flex-1 flex flex-col">
        {!activeChannel ? (
          <div className="flex-1 flex items-center justify-center text-white/40">
            <div className="text-center">
              <SignalHigh className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Selecciona una frecuencia para sintonizar</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0">
              <div>
                <p className="text-white font-semibold text-sm">{activeChannelInfo?.name}</p>
                <p className="text-white/40 text-[11px]">{activeChannelInfo?.frequency} MHz · {usersInChannel.length} conectado(s)</p>
              </div>
              <button
                onClick={() => tune(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Salir
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                  {messages.length === 0 && (
                    <p className="text-white/30 text-sm text-center mt-8">Sin transmisiones todavía en este canal.</p>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className="flex gap-2 items-baseline">
                      <span className="text-orange-400 text-xs font-semibold flex-shrink-0">{m.username}:</span>
                      <span className="text-white/80 text-sm">{m.text}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-white/5 flex gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Transmitir mensaje..."
                    maxLength={200}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !draft.trim()}
                    className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="w-48 border-l border-white/5 p-3 overflow-y-auto custom-scrollbar">
                <p className="text-white/40 text-[11px] uppercase tracking-wide mb-2">Conectados</p>
                <div className="space-y-1.5">
                  {usersInChannel.map((u) => (
                    <div key={u.discordId} className="flex items-center gap-2 text-white/70 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {u.username}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

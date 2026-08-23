'use client';

import { useEffect, useState } from 'react';
import { MessageSquareText, Search } from 'lucide-react';
import { useOS } from '@/contexts/OSContext';
import { EmptyState, Skeleton } from '@/components/os/ui';

interface Conversation {
  id: string;
  isGroup: boolean;
  displayName: string;
  displayAvatar?: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessage?: { text: string; senderId: string; createdAt: string };
}

const POLL_MS = 15000;

/** Vista rápida de solo-lectura sobre las conversaciones reales de HubChat
 * (/api/chat/conversations, ya existente). Al hacer clic se abre HubChat en su
 * propia ventana para responder — el chat en sí sigue siendo una app aparte. */
export default function ChatPanel() {
  const { openApp } = useOS();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = () => {
      fetch('/api/chat/conversations', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (d.success) setConversations(d.conversations); })
        .finally(() => setLoading(false));
    };
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const openConversation = (id: string) => {
    sessionStorage.setItem('hubchat_open_conversation', id);
    openApp('hubchat');
  };

  const filtered = query.trim()
    ? conversations.filter((c) => c.displayName.toLowerCase().includes(query.trim().toLowerCase()))
    : conversations;
  const onlineContacts = conversations.filter((c) => !c.isGroup && c.isOnline);

  return (
    <div className="hidden 2xl:flex w-72 h-full border-l border-white/5 bg-[#0d0d14] flex-shrink-0 flex-col">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-white text-sm font-bold">Chats</h3>
        <button onClick={() => openApp('hubchat')} title="Abrir HubChat" className="text-white/40 hover:text-white transition-colors">
          <MessageSquareText className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en Messenger"
            className="w-full bg-white/5 border border-white/10 rounded-full pl-7 pr-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 mt-1">
        {loading ? (
          <div className="space-y-2 p-1">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={MessageSquareText} title="Sin conversaciones" text="Escribile a alguien desde su perfil para empezar a chatear." />
        ) : (
          <div className="space-y-0.5">
            {filtered.map((c) => (
              <button key={c.id} onClick={() => openConversation(c.id)} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                <div className="relative flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.displayAvatar} alt="" className="w-10 h-10 rounded-full" />
                  {c.isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d0d14]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{c.displayName}</p>
                  <p className="text-white/40 text-[10px] truncate">{c.lastMessage?.text || 'Sin mensajes todavía'}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {onlineContacts.length > 0 && (
        <div className="p-4 border-t border-white/5">
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-2">Contactos en línea</p>
          <div className="space-y-1.5">
            {onlineContacts.slice(0, 6).map((c) => (
              <button key={c.id} onClick={() => openConversation(c.id)} className="w-full flex items-center gap-2 hover:bg-white/5 rounded-lg p-1 transition-colors">
                <div className="relative flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.displayAvatar} alt="" className="w-6 h-6 rounded-full" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#0d0d14]" />
                </div>
                <span className="text-white/70 text-xs truncate">{c.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

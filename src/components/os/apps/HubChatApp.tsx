'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search, MoreVertical, Send, ArrowLeft, Check, CheckCheck,
  Plus, Users, X, Trash2, Pencil, LogOut, UserPlus, UserMinus,
  Pin, Archive, BellOff, Smile, Inbox, Reply,
} from 'lucide-react';
import { HubChatIcon } from '@/components/icons/AppIcons';

interface Conversation {
  id: string;
  isGroup: boolean;
  participants: string[];
  name?: string;
  avatar?: string;
  createdBy?: string;
  displayName: string;
  displayAvatar?: string;
  otherId?: string;
  isOnline: boolean;
  unreadCount: number;
  pinnedBy: string[];
  archivedBy: string[];
  mutedBy: string[];
  lastMessage?: { text: string; senderId: string; createdAt: string };
  updatedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatar?: string;
  text: string;
  readBy: string[];
  deletedForEveryone?: boolean;
  editedAt?: string;
  reactions?: Record<string, string[]>;
  replyTo?: { messageId: string; senderDisplayName: string; text: string };
  createdAt: string;
}

interface SearchUser { discordId: string; username: string; displayName: string; avatar?: string; phoneNumber?: string; }

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const LIST_POLL_MS = 6000;
const MSG_POLL_MS = 4000;

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return date.toLocaleDateString('es-ES', { weekday: 'short' });
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

export default function HubChatApp() {
  const [meId, setMeId] = useState<string | null>(null);
  const [myPhone, setMyPhone] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [othersTyping, setOthersTyping] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatMode, setNewChatMode] = useState<'direct' | 'group'>('direct');
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<SearchUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [groupName, setGroupName] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [deleteMenuFor, setDeleteMenuFor] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatSearchResults, setChatSearchResults] = useState<Message[]>([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showArchivedRef = useRef(showArchived);

  useEffect(() => { showArchivedRef.current = showArchived; }, [showArchived]);

  useEffect(() => {
    fetch('/api/chat/profile', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) { setMeId(d.profile.id); setMyPhone(d.profile.phoneNumber); } });
  }, []);

  const loadConversations = useCallback(async () => {
    const requestedArchived = showArchived;
    const res = await fetch(`/api/chat/conversations${requestedArchived ? '?archived=1' : ''}`, { cache: 'no-store' });
    const data = await res.json();
    // Descarta la respuesta si el usuario cambió de vista (archivados/bandeja) mientras la petición estaba en curso.
    if (data.success && requestedArchived === showArchivedRef.current) setConversations(data.conversations);
  }, [showArchived]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, LIST_POLL_MS);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Handoff desde otras apps (ej. "Contactar vendedor" en MercadoLibre) que ya crearon/encontraron la conversación.
  useEffect(() => {
    const pendingId = sessionStorage.getItem('hubchat_open_conversation');
    if (pendingId) {
      sessionStorage.removeItem('hubchat_open_conversation');
      setActiveId(pendingId);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!activeId) return;
    const res = await fetch(`/api/chat/messages?conversationId=${activeId}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) {
      setMessages(data.messages);
      setOthersTyping(data.othersTyping || []);
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages();
    const interval = setInterval(loadMessages, MSG_POLL_MS);
    return () => clearInterval(interval);
  }, [activeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!showNewChat && !showGroupInfo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setShowNewChat(false);
      setShowGroupInfo(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showNewChat, showGroupInfo]);

  useEffect(() => {
    if (!userQuery.trim()) { setUserResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/chat/search?q=${encodeURIComponent(userQuery.trim())}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (d.success) setUserResults(d.users.filter((u: SearchUser) => u.discordId !== meId)); });
    }, 250);
    return () => clearTimeout(t);
  }, [userQuery, meId]);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeId) return;
    const text = messageInput.trim();
    const replyToId = replyingTo?.id;
    setMessageInput('');
    setReplyingTo(null);
    const res = await fetch('/api/chat/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: activeId, text, replyToId }),
    });
    const data = await res.json();
    if (data.success) {
      setMessages((prev) => [...prev, data.message]);
      loadConversations();
    }
    fetch('/api/chat/typing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: null }) });
  };

  useEffect(() => {
    if (!showChatSearch || !chatSearchQuery.trim() || !activeId) { setChatSearchResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/chat/messages/search?conversationId=${activeId}&q=${encodeURIComponent(chatSearchQuery.trim())}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (d.success) setChatSearchResults(d.messages); });
    }, 250);
    return () => clearTimeout(t);
  }, [showChatSearch, chatSearchQuery, activeId]);

  const jumpToMessage = (messageId: string) => {
    setShowChatSearch(false);
    setChatSearchQuery('');
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId((cur) => (cur === messageId ? null : cur)), 1800);
    }
  };

  const onTyping = (value: string) => {
    setMessageInput(value);
    if (!activeId) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    fetch('/api/chat/typing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: activeId }) });
    typingTimer.current = setTimeout(() => {
      fetch('/api/chat/typing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: null }) });
    }, 5000);
  };

  const openConversation = (id: string) => {
    setActiveId(id);
    setMessages([]);
    setShowGroupInfo(false);
    setReplyingTo(null);
    setShowChatSearch(false);
    setChatSearchQuery('');
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, unreadCount: 0 } : c));
  };

  const startChat = async () => {
    if (selectedUsers.length === 0) return;
    const res = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantIds: selectedUsers.map((u) => u.discordId),
        isGroup: newChatMode === 'group',
        name: newChatMode === 'group' ? groupName : undefined,
      }),
    });
    const data = await res.json();
    if (data.success) {
      await loadConversations();
      setActiveId(data.conversation.id);
      setShowNewChat(false);
      setSelectedUsers([]);
      setUserQuery('');
      setGroupName('');
    }
  };

  const deleteConversation = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    await fetch('/api/chat/conversations', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: id }) });
  };

  const groupAction = async (action: string, extra: Record<string, any> = {}) => {
    if (!activeId) return;
    await fetch('/api/chat/conversations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: activeId, action, ...extra }),
    });
    await loadConversations();
  };

  const toggleConvFlag = async (conversationId: string, action: 'togglePin' | 'toggleArchive' | 'toggleMute') => {
    await fetch('/api/chat/conversations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId, action }),
    });
    await loadConversations();
  };

  const startEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditText(message.text);
    setDeleteMenuFor(null);
  };

  const saveEditMessage = async () => {
    if (!editingMessageId || !editText.trim()) return;
    const messageId = editingMessageId;
    const text = editText.trim();
    setEditingMessageId(null);
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, text, editedAt: new Date().toISOString() } : m));
    await fetch('/api/chat/messages', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId, text }),
    });
    loadConversations();
  };

  const deleteMessage = async (messageId: string, mode: 'me' | 'everyone') => {
    setDeleteMenuFor(null);
    if (mode === 'everyone') {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, deletedForEveryone: true, text: '' } : m));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
    await fetch('/api/chat/messages', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId, mode }),
    });
    loadConversations();
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    setReactionPickerFor(null);
    if (!meId) return;
    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m;
      const reactions: Record<string, string[]> = { ...(m.reactions || {}) };
      for (const key of Object.keys(reactions)) {
        reactions[key] = reactions[key].filter((id) => id !== meId);
        if (reactions[key].length === 0) delete reactions[key];
      }
      const alreadyHadThis = (m.reactions?.[emoji] || []).includes(meId);
      if (!alreadyHadThis) reactions[emoji] = [...(reactions[emoji] || []), meId];
      return { ...m, reactions };
    }));
    const res = await fetch('/api/chat/messages/react', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId, emoji }),
    });
    const data = await res.json();
    if (data.success) {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions: data.reactions } : m));
    }
  };

  const filteredConversations = conversations
    .filter((c) => c.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aPinned = meId && a.pinnedBy?.includes(meId) ? 1 : 0;
      const bPinned = meId && b.pinnedBy?.includes(meId) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  const isOtherTyping = activeConversation && othersTyping.length > 0;
  const isAdmin = activeConversation?.createdBy === meId;

  return (
    <div className="relative h-full flex bg-[#0a0a0f]">
      {/* Sidebar */}
      <div className={`${activeId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-white/5 bg-[#0d0d14]`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <HubChatIcon size={28} />
              <h1 className="text-white font-bold text-lg">HubChat</h1>
            </div>
            <button onClick={() => { setShowNewChat(true); setNewChatMode('direct'); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Plus className="w-5 h-5 text-white/60" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar chat..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <button
            onClick={() => { setShowArchived((v) => !v); setActiveId(null); }}
            className={`mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${showArchived ? 'bg-emerald-600/20 text-emerald-300' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            {showArchived ? <Inbox className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            {showArchived ? 'Volver a la bandeja' : 'Ver archivados'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 && (
            <p className="text-white/30 text-sm text-center mt-8 px-4">{showArchived ? 'No tienes chats archivados.' : 'Sin conversaciones. Toca + para empezar una.'}</p>
          )}
          {filteredConversations.map((conv) => {
            const isPinned = Boolean(meId && conv.pinnedBy?.includes(meId));
            const isMuted = Boolean(meId && conv.mutedBy?.includes(meId));
            const isArchived = Boolean(meId && conv.archivedBy?.includes(meId));
            return (
            <div
              key={conv.id}
              role="button"
              tabIndex={0}
              onClick={() => openConversation(conv.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openConversation(conv.id); }}
              className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 group cursor-pointer ${activeId === conv.id ? 'bg-white/5' : ''}`}
            >
              <div className="relative flex-shrink-0">
                {conv.displayAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={conv.displayAvatar} alt={conv.displayName} className="w-12 h-12 rounded-full bg-white/10" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-600/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                )}
                {conv.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0d0d14]" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium truncate flex items-center gap-1.5">
                    {conv.displayName}
                    {isPinned && <Pin className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                    {isMuted && <BellOff className="w-3 h-3 text-white/30 flex-shrink-0" />}
                  </span>
                  <span className={`text-xs ${conv.unreadCount > 0 ? 'text-emerald-400' : 'text-white/40'}`}>
                    {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-sm truncate flex-1">{conv.lastMessage?.text || 'Sin mensajes'}</p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{conv.unreadCount}</span>
                  )}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center flex-shrink-0 transition-all">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleConvFlag(conv.id, 'togglePin'); }}
                  title={isPinned ? 'Desanclar' : 'Anclar'}
                  className={`p-1.5 transition-colors ${isPinned ? 'text-emerald-400' : 'text-white/30 hover:text-emerald-400'}`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleConvFlag(conv.id, 'toggleMute'); }}
                  title={isMuted ? 'Activar notificaciones' : 'Silenciar'}
                  className={`p-1.5 transition-colors ${isMuted ? 'text-white/60' : 'text-white/30 hover:text-white/60'}`}
                >
                  <BellOff className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleConvFlag(conv.id, 'toggleArchive'); }}
                  title={isArchived ? 'Desarchivar' : 'Archivar'}
                  className={`p-1.5 transition-colors ${isArchived ? 'text-emerald-400' : 'text-white/30 hover:text-emerald-400'}`}
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  title="Eliminar chat"
                  className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Chat view */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-[#0d0d14]">
            <button onClick={() => setActiveId(null)} className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => activeConversation.isGroup && setShowGroupInfo(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              {activeConversation.displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeConversation.displayAvatar} alt="" className="w-10 h-10 rounded-full bg-white/10" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600/30 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-white font-semibold truncate">{activeConversation.displayName}</h2>
                <p className="text-xs text-white/50">
                  {isOtherTyping ? (
                    <span className="text-emerald-400">escribiendo...</span>
                  ) : activeConversation.isGroup ? (
                    `${activeConversation.participants.length} miembros`
                  ) : activeConversation.isOnline ? (
                    <span className="text-emerald-400">en línea</span>
                  ) : 'desconectado'}
                </p>
              </div>
            </button>
            <button
              onClick={() => { setShowChatSearch((v) => !v); setChatSearchQuery(''); }}
              title="Buscar en la conversación"
              className={`p-2 rounded-lg transition-colors ${showChatSearch ? 'bg-emerald-600/20 text-emerald-300' : 'hover:bg-white/10 text-white/60'}`}
            >
              <Search className="w-5 h-5" />
            </button>
            {activeConversation.isGroup && (
              <button onClick={() => setShowGroupInfo(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-white/60" />
              </button>
            )}
          </div>

          {showChatSearch && (
            <div className="p-3 border-b border-white/5 bg-[#0d0d14]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  autoFocus
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Buscar mensajes en este chat..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              {chatSearchQuery.trim() && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {chatSearchResults.length === 0 && (
                    <p className="text-white/30 text-xs text-center py-3">Sin resultados.</p>
                  )}
                  {chatSearchResults.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => jumpToMessage(m.id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-300 text-xs font-semibold">{m.senderDisplayName}</span>
                        <span className="text-white/30 text-[10px]">{formatTime(m.createdAt)}</span>
                      </div>
                      <p className="text-white/60 text-xs truncate">{m.text}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#07070a]">
            {messages.map((message) => {
              const isMe = message.senderId === meId;
              const otherRead = activeConversation.participants.some((id) => id !== meId && message.readBy.includes(id));
              const isDeleted = message.deletedForEveryone;
              const isEditing = editingMessageId === message.id;
              const reactionEntries = Object.entries(message.reactions || {}).filter(([, ids]) => ids.length > 0);
              return (
                <div
                  key={message.id}
                  ref={(el) => { messageRefs.current[message.id] = el; }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} transition-colors rounded-xl ${highlightedMessageId === message.id ? 'bg-emerald-500/10' : ''}`}
                >
                  <div className={`group/msg relative max-w-[70%] flex items-center gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-emerald-600 rounded-br-md' : 'bg-white/10 rounded-bl-md'} ${isDeleted ? 'opacity-60' : ''}`}>
                      {activeConversation.isGroup && !isMe && !isDeleted && (
                        <p className="text-emerald-300 text-xs font-semibold mb-0.5">{message.senderDisplayName}</p>
                      )}

                      {message.replyTo && !isDeleted && (
                        <button
                          onClick={() => jumpToMessage(message.replyTo!.messageId)}
                          className={`block w-full text-left mb-1 px-2 py-1 rounded-lg border-l-2 ${isMe ? 'bg-black/15 border-white/40' : 'bg-black/20 border-emerald-400/60'}`}
                        >
                          <p className={`text-[11px] font-semibold ${isMe ? 'text-white/80' : 'text-emerald-300'}`}>{message.replyTo.senderDisplayName}</p>
                          <p className="text-[11px] text-white/50 truncate">{message.replyTo.text}</p>
                        </button>
                      )}

                      {isEditing ? (
                        <div className="flex items-center gap-1.5 min-w-[180px]">
                          <input
                            autoFocus value={editText} onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveEditMessage(); if (e.key === 'Escape') setEditingMessageId(null); }}
                            className="flex-1 bg-black/20 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
                          />
                          <button onClick={saveEditMessage} className="text-[11px] text-white/90 hover:text-white font-medium">OK</button>
                          <button onClick={() => setEditingMessageId(null)} className="text-white/50 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : isDeleted ? (
                        <p className="text-white/50 text-sm italic">Mensaje eliminado</p>
                      ) : (
                        <p className="text-white text-sm whitespace-pre-wrap break-words">{message.text}</p>
                      )}

                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {message.editedAt && !isDeleted && <span className="text-[10px] text-white/40 italic">editado</span>}
                        <span className="text-[10px] text-white/50">{formatTime(message.createdAt)}</span>
                        {isMe && (otherRead
                          ? <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                          : <Check className="w-3.5 h-3.5 text-white/40" />)}
                      </div>

                      {reactionEntries.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {reactionEntries.map(([emoji, ids]) => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(message.id, emoji)}
                              className={`flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full transition-colors ${meId && ids.includes(meId) ? 'bg-emerald-500/30 border border-emerald-400/40' : 'bg-black/20 border border-white/10 hover:bg-black/30'}`}
                            >
                              <span>{emoji}</span><span className="text-white/70">{ids.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {!isDeleted && !isEditing && (
                      <div className="relative opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => setReactionPickerFor(reactionPickerFor === message.id ? null : message.id)}
                          className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setReplyingTo(message); setDeleteMenuFor(null); setReactionPickerFor(null); }}
                          className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        {isMe && (
                          <>
                            <button onClick={() => startEditMessage(message)} className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteMenuFor(deleteMenuFor === message.id ? null : message.id)}
                              className="p-1 rounded-full text-white/40 hover:text-red-400 hover:bg-white/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {!isMe && (
                          <button
                            onClick={() => setDeleteMenuFor(deleteMenuFor === message.id ? null : message.id)}
                            className="p-1 rounded-full text-white/40 hover:text-red-400 hover:bg-white/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {reactionPickerFor === message.id && (
                          <div className={`absolute bottom-full mb-1 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1 bg-[#1a1a24] border border-white/10 rounded-full px-2 py-1.5 shadow-xl z-10`}>
                            {REACTION_EMOJIS.map((emoji) => (
                              <button key={emoji} onClick={() => toggleReaction(message.id, emoji)} className="text-base hover:scale-125 transition-transform">
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {deleteMenuFor === message.id && (
                          <div className={`absolute bottom-full mb-1 ${isMe ? 'right-0' : 'left-0'} flex flex-col bg-[#1a1a24] border border-white/10 rounded-lg py-1 shadow-xl z-10 min-w-[150px]`}>
                            <button onClick={() => deleteMessage(message.id, 'me')} className="text-left px-3 py-1.5 text-xs text-white/80 hover:bg-white/10">
                              Eliminar para mí
                            </button>
                            {isMe && (
                              <button onClick={() => deleteMessage(message.id, 'everyone')} className="text-left px-3 py-1.5 text-xs text-red-400 hover:bg-white/10">
                                Eliminar para todos
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/5 bg-[#0d0d14]">
            {replyingTo && (
              <div className="flex items-center gap-2 px-4 pt-3">
                <div className="flex-1 min-w-0 border-l-2 border-emerald-400/60 bg-white/5 rounded-lg px-3 py-1.5">
                  <p className="text-emerald-300 text-xs font-semibold">{replyingTo.senderDisplayName}</p>
                  <p className="text-white/50 text-xs truncate">{replyingTo.text}</p>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-white/40 hover:text-white flex-shrink-0"><X className="w-4 h-4" /></button>
              </div>
            )}
            <div className="flex items-center gap-2 p-4">
              <input
                type="text" value={messageInput} onChange={(e) => onTyping(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50"
              />
              <button onClick={sendMessage} disabled={!messageInput.trim()} className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl transition-colors">
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-[#07070a]">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <HubChatIcon size={48} />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">HubChat</h2>
            <p className="text-white/50 max-w-sm">Selecciona una conversación para empezar a chatear con otros jugadores del servidor.</p>
          </div>
        </div>
      )}

      {/* Nuevo chat / grupo */}
      {showNewChat && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowNewChat(false)}>
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <button onClick={() => setNewChatMode('direct')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${newChatMode === 'direct' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white/60'}`}>Chat directo</button>
                <button onClick={() => setNewChatMode('group')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${newChatMode === 'group' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white/60'}`}>Grupo</button>
              </div>
              <button onClick={() => setShowNewChat(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {myPhone && (
              <p className="text-white/30 text-[11px] mb-2">Tu número: <span className="text-emerald-400 font-mono">{myPhone}</span></p>
            )}

            {newChatMode === 'group' && (
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nombre del grupo..."
                className="w-full mb-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50" />
            )}

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedUsers.map((u) => (
                  <span key={u.discordId} className="flex items-center gap-1 bg-emerald-600/20 text-emerald-300 text-xs px-2 py-1 rounded-full">
                    {u.displayName}
                    <button onClick={() => setSelectedUsers((prev) => prev.filter((x) => x.discordId !== u.discordId))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}

            <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Buscar por nombre, @usuario o número..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50" />
            <div className="max-h-40 overflow-y-auto mt-2 space-y-1">
              {userResults.filter((u) => !selectedUsers.some((s) => s.discordId === u.discordId)).map((u) => (
                <button key={u.discordId}
                  onClick={() => {
                    if (newChatMode === 'direct') { setSelectedUsers([u]); } else { setSelectedUsers((prev) => [...prev, u]); }
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.avatar} alt="" className="w-6 h-6 rounded-full" />
                  <span className="min-w-0">
                    <span className="block text-white/80 text-xs truncate">{u.displayName}</span>
                    <span className="block text-white/40 text-[10px] truncate">@{u.username}{u.phoneNumber ? ` - ${u.phoneNumber}` : ''}</span>
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={startChat}
              disabled={selectedUsers.length === 0 || (newChatMode === 'group' && !groupName.trim())}
              className="w-full mt-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {newChatMode === 'group' ? 'Crear grupo' : 'Iniciar chat'}
            </button>
          </div>
        </div>
      )}

      {/* Info / administracion de grupo */}
      {showGroupInfo && activeConversation?.isGroup && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowGroupInfo(false)}>
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Info del grupo</h3>
              <button onClick={() => setShowGroupInfo(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {isAdmin && (
              <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <input defaultValue={activeConversation.name} id="rename-input"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50" />
                  <button onClick={() => {
                    const el = document.getElementById('rename-input') as HTMLInputElement;
                    groupAction('rename', { name: el.value });
                  }} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg"><Pencil className="w-3.5 h-3.5 text-white" /></button>
                </div>
                <div className="flex gap-2">
                  <input placeholder="URL de foto del grupo..." id="avatar-input"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50" />
                  <button onClick={() => {
                    const el = document.getElementById('avatar-input') as HTMLInputElement;
                    groupAction('setAvatar', { avatar: el.value });
                  }} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg"><Pencil className="w-3.5 h-3.5 text-white" /></button>
                </div>
              </div>
            )}

            <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Miembros ({activeConversation.participants.length})</p>
            <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
              {activeConversation.participants.map((pid) => (
                <div key={pid} className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/5">
                  <span className="text-white/70 text-xs truncate">{pid === meId ? 'Tu' : pid}{pid === activeConversation.createdBy ? ' (admin)' : ''}</span>
                  {isAdmin && pid !== meId && (
                    <button onClick={() => groupAction('removeMember', { memberId: pid })} className="text-white/30 hover:text-red-400"><UserMinus className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
            </div>

            <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Agregar miembro..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50" />
            <div className="max-h-28 overflow-y-auto mt-2 space-y-1">
              {userResults.filter((u) => !activeConversation.participants.includes(u.discordId)).map((u) => (
                <button key={u.discordId} onClick={() => { groupAction('addMember', { memberId: u.discordId }); setUserQuery(''); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.avatar} alt="" className="w-5 h-5 rounded-full" />
                  <span className="text-white/80 text-xs truncate flex items-center gap-1"><UserPlus className="w-3 h-3" /> {u.displayName}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => { groupAction('removeMember', { memberId: meId }); setShowGroupInfo(false); setActiveId(null); }}
              className="w-full mt-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir del grupo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

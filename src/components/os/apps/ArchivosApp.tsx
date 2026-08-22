'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, ChevronRight, Grid3x3, List, Package, Crosshair, Car, Home, Receipt,
  X, MessageSquare, Check, HardDrive, ArrowUpDown, ArrowLeft, Gift, Loader2,
  Trash2, RotateCcw, Send, Clock, XCircle, Folder as FolderIcon, FolderPlus, Pencil, Plus,
  IdCard, ShieldCheck,
} from 'lucide-react';
import GiftPicker, { type GiftRecipient } from './shared/GiftPicker';

type FolderId = 'compras' | 'armas' | 'vehiculos' | 'propiedades' | 'facturas' | 'documentos';
type ViewId = FolderId | 'papelera' | string;

const TRANSFERABLE = new Set<FolderId>(['armas', 'vehiculos', 'propiedades']);

interface FileItem {
  id: string;
  name: string;
  folder: FolderId;
  category?: string;
  extra?: string;
  price?: number;
  purchasedAt: string;
  source: string;
  imageUrl?: string;
  giftedBy?: string;
  doc?: {
    kind: 'dni' | 'license';
    holder: string;
    number?: string;
    issueDate: string;
    expiryDate?: string;
    status: string;
    photoUrl?: string;
    details?: Record<string, string>;
  };
}

interface ChatConversation {
  id: string;
  displayName: string;
  displayAvatar?: string;
}

interface HiddenEntry {
  itemType: FolderId;
  itemId: string;
  permanent: boolean;
}

interface TransferRecord {
  id: string;
  fromName: string;
  toName: string;
  transferredAt: string;
}

interface PersonalFolder {
  id: string;
  name: string;
  count: number;
}

interface FolderMember {
  folderId: string;
  itemType: FolderId;
  itemId: string;
}

const FOLDERS: { id: FolderId; name: string; icon: React.ElementType; color: string }[] = [
  { id: 'compras', name: 'Compras', icon: Package, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 'armas', name: 'Armas', icon: Crosshair, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'vehiculos', name: 'Vehículos', icon: Car, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { id: 'propiedades', name: 'Propiedades', icon: Home, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { id: 'facturas', name: 'Facturas', icon: Receipt, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'documentos', name: 'Documentos', icon: IdCard, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
];
const TRASH_META = { id: 'papelera' as const, name: 'Papelera', icon: Trash2, color: 'text-white/50 bg-white/5 border-white/10' };

function timeAgo(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function itemKey(type: FolderId, id: string) { return `${type}:${id}`; }

export default function ArchivosApp() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [hidden, setHidden] = useState<HiddenEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ displayName: string; avatar?: string } | null>(null);
  const [openView, setOpenView] = useState<ViewId | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'price'>('date');
  const [selected, setSelected] = useState<FileItem | null>(null);
  const [showSharePicker, setShowSharePicker] = useState(false);
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sharedWith, setSharedWith] = useState<string | null>(null);
  const [showTransferPicker, setShowTransferPicker] = useState(false);
  const [transferTo, setTransferTo] = useState<GiftRecipient | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [history, setHistory] = useState<TransferRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [personalFolders, setPersonalFolders] = useState<PersonalFolder[]>([]);
  const [folderMembers, setFolderMembers] = useState<FolderMember[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showAddToFolder, setShowAddToFolder] = useState(false);
  const [weaponCapacity, setWeaponCapacity] = useState<{ used: number; max: number } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes, ammoRes, dealerRes, propsRes, walletRes, hiddenRes, foldersRes, membersRes, documentsRes] = await Promise.all([
        fetch('/api/social/profile', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/marketplace/history', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/ammunation/mine', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/dealer/mine', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/properties/mine', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/hubpay/wallet', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/archivos/hidden', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/archivos/folders', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/archivos/folders/members', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/archivos/documents', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      ]);

      if (profileRes?.success) setMe({ displayName: profileRes.profile.displayName || profileRes.profile.username, avatar: profileRes.profile.avatarUrl || profileRes.profile.avatar });
      if (ammoRes?.success && ammoRes.capacity) setWeaponCapacity(ammoRes.capacity);
      if (hiddenRes?.success) setHidden(hiddenRes.hidden);
      if (foldersRes?.success) setPersonalFolders(foldersRes.folders);
      if (membersRes?.success) setFolderMembers(membersRes.members);

      const next: FileItem[] = [];

      if (historyRes?.success) {
        for (const p of historyRes.purchases || []) {
          next.push({
            id: p.id, name: p.listingName, folder: 'compras',
            category: 'Producto', extra: `Vendedor: ${p.sellerUsername}`,
            price: p.price * p.quantity, purchasedAt: p.createdAt, source: 'MercadoLibre',
            giftedBy: p.giftedByUsername,
          });
        }
      }

      if (ammoRes?.success) {
        for (const w of ammoRes.items || []) {
          next.push({
            id: w.id, name: w.name, folder: 'armas',
            category: w.category, purchasedAt: w.purchasedAt, source: 'Ammu-Nation',
            giftedBy: w.giftedBy ? 'otro jugador' : undefined,
          });
        }
      }

      if (dealerRes?.success) {
        for (const v of dealerRes.vehicles || []) {
          next.push({
            id: v.id, name: v.name, folder: 'vehiculos',
            category: v.brand, extra: `Placa ${v.plate}${v.financed ? ' · Financiado' : ''}`,
            purchasedAt: v.purchasedAt, source: 'Concesionario', imageUrl: v.imageUrl,
            giftedBy: v.giftedBy ? 'otro jugador' : undefined,
          });
        }
      }

      if (propsRes?.success) {
        for (const pr of propsRes.properties || []) {
          next.push({
            id: pr.id, name: pr.name, folder: 'propiedades',
            category: pr.type, extra: pr.address,
            purchasedAt: pr.purchasedAt, source: 'Propiedades',
            giftedBy: pr.giftedBy ? 'otro jugador' : undefined,
          });
        }
      }

      if (walletRes?.success) {
        for (const t of walletRes.wallet.transactions || []) {
          if (t.type !== 'expense') continue;
          next.push({
            id: t.id, name: t.description, folder: 'facturas',
            category: 'Factura', price: Math.abs(t.amount),
            purchasedAt: t.timestamp, source: 'HubPay',
          });
        }
      }

      if (documentsRes?.success) {
        for (const d of documentsRes.documents || []) {
          next.push({
            id: d.id, name: d.name, folder: 'documentos',
            category: d.kind === 'dni' ? 'Documento de Identidad' : 'Licencia',
            purchasedAt: d.issueDate, source: d.kind === 'dni' ? 'Whitelist' : 'Ammu-Nation',
            imageUrl: d.photoUrl,
            doc: {
              kind: d.kind, holder: d.holder, number: d.number,
              issueDate: d.issueDate, expiryDate: d.expiryDate, status: d.status,
              photoUrl: d.photoUrl, details: d.details,
            },
          });
        }
      }

      setItems(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const hiddenMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const h of hidden) m.set(itemKey(h.itemType, h.itemId), h.permanent);
    return m;
  }, [hidden]);

  const counts = useMemo(() => {
    const c: Record<FolderId, number> = { compras: 0, armas: 0, vehiculos: 0, propiedades: 0, facturas: 0, documentos: 0 };
    for (const it of items) if (!hiddenMap.has(itemKey(it.folder, it.id))) c[it.folder]++;
    return c;
  }, [items, hiddenMap]);

  const trashCount = useMemo(() => hidden.filter((h) => !h.permanent).length, [hidden]);

  const isTrashView = openView === 'papelera';
  const isSystemFolder = (id: string | null) => id === 'papelera' || FOLDERS.some((f) => f.id === id);
  const isPersonalView = Boolean(openView) && !isSystemFolder(openView);
  const currentPersonalFolder = isPersonalView ? personalFolders.find((f) => f.id === openView) : null;

  const memberFolderIdsFor = useCallback((it: FileItem) => folderMembers.filter((m) => m.itemType === it.folder && m.itemId === it.id).map((m) => m.folderId), [folderMembers]);

  const visibleItems = useMemo(() => {
    let list: FileItem[];
    if (isTrashView) {
      list = items.filter((it) => hiddenMap.get(itemKey(it.folder, it.id)) === false);
    } else if (isPersonalView) {
      const memberKeys = new Set(folderMembers.filter((m) => m.folderId === openView).map((m) => itemKey(m.itemType, m.itemId)));
      list = items.filter((it) => memberKeys.has(itemKey(it.folder, it.id)) && !hiddenMap.has(itemKey(it.folder, it.id)));
    } else if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = items
        .filter((it) => !hiddenMap.has(itemKey(it.folder, it.id)))
        .filter((it) => it.name.toLowerCase().includes(q) || it.category?.toLowerCase().includes(q) || it.source.toLowerCase().includes(q));
    } else if (openView) {
      list = items.filter((it) => it.folder === openView && !hiddenMap.has(itemKey(it.folder, it.id)));
    } else {
      list = [];
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return (b.price || 0) - (a.price || 0);
      return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime();
    });
  }, [items, hiddenMap, query, openView, isTrashView, isPersonalView, folderMembers, sortBy]);

  const openFile = (item: FileItem) => {
    setSelected(item);
    setShowSharePicker(false);
    setSharedWith(null);
    setShowTransferPicker(false);
    setTransferTo(null);
    setTransferError(null);
    setShowAddToFolder(false);
    setHistory([]);
    if (TRANSFERABLE.has(item.folder)) {
      setLoadingHistory(true);
      fetch(`/api/archivos/history?itemType=${item.folder}&itemId=${item.id}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (d.success) setHistory(d.history); })
        .finally(() => setLoadingHistory(false));
    }
  };

  const openSharePicker = async () => {
    setShowSharePicker(true);
    setSharedWith(null);
    setLoadingConversations(true);
    try {
      const res = await fetch('/api/chat/conversations', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setChatConversations(data.conversations);
    } finally {
      setLoadingConversations(false);
    }
  };

  const shareItem = async (conversationId: string, name: string) => {
    if (!selected) return;
    const lines = [
      `📎 ${selected.name}`,
      selected.category ? `${selected.category}` : '',
      selected.extra || '',
      selected.price ? `Valor: $${selected.price.toLocaleString('es-CO')}` : '',
      `Origen: ${selected.source} · ${timeAgo(selected.purchasedAt)}`,
    ].filter(Boolean);
    await fetch('/api/chat/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, text: lines.join('\n') }),
    });
    setSharedWith(name);
    setShowSharePicker(false);
  };

  const confirmTransfer = async () => {
    if (!selected || !transferTo) return;
    setTransferring(true);
    setTransferError(null);
    try {
      const res = await fetch('/api/archivos/transfer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: selected.folder, itemId: selected.id, toUserId: transferTo.id }),
      });
      const data = await res.json();
      if (!data.success) { setTransferError(data.error || 'No se pudo transferir'); return; }
      setSelected(null);
      setShowTransferPicker(false);
      setTransferTo(null);
      await loadAll();
    } finally {
      setTransferring(false);
    }
  };

  const moveToTrash = async (item: FileItem) => {
    await fetch('/api/archivos/hide', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemType: item.folder, itemId: item.id }),
    });
    setSelected(null);
    await loadAll();
  };

  const restoreFromTrash = async (item: FileItem) => {
    await fetch('/api/archivos/hide', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemType: item.folder, itemId: item.id, action: 'restore' }),
    });
    setSelected(null);
    await loadAll();
  };

  const deletePermanently = async (item: FileItem) => {
    await fetch('/api/archivos/hide', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemType: item.folder, itemId: item.id, action: 'permanent' }),
    });
    setSelected(null);
    await loadAll();
  };

  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const res = await fetch('/api/archivos/folders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) {
      setPersonalFolders((prev) => [...prev, data.folder]);
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const renameFolder = async (folderId: string) => {
    const name = renameValue.trim();
    if (!name) { setRenamingFolderId(null); return; }
    await fetch('/api/archivos/folders', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderId, action: 'rename', name }),
    });
    setPersonalFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, name } : f));
    setRenamingFolderId(null);
  };

  const deleteFolder = async (folderId: string) => {
    await fetch('/api/archivos/folders', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderId, action: 'delete' }),
    });
    setPersonalFolders((prev) => prev.filter((f) => f.id !== folderId));
    setFolderMembers((prev) => prev.filter((m) => m.folderId !== folderId));
    if (openView === folderId) setOpenView(null);
  };

  const addToFolder = async (folderId: string) => {
    if (!selected) return;
    await fetch('/api/archivos/folders/members', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId, itemType: selected.folder, itemId: selected.id }),
    });
    setFolderMembers((prev) => [...prev, { folderId, itemType: selected.folder, itemId: selected.id }]);
    setPersonalFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, count: f.count + 1 } : f));
    setShowAddToFolder(false);
  };

  const removeFromFolder = async (folderId: string) => {
    if (!selected) return;
    await fetch('/api/archivos/folders/members', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId, itemType: selected.folder, itemId: selected.id }),
    });
    setFolderMembers((prev) => prev.filter((m) => !(m.folderId === folderId && m.itemType === selected.folder && m.itemId === selected.id)));
    setPersonalFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, count: Math.max(0, f.count - 1) } : f));
    if (isPersonalView) setSelected(null);
  };

  const folderMeta = openView === 'papelera'
    ? TRASH_META
    : currentPersonalFolder
      ? { id: currentPersonalFolder.id, name: currentPersonalFolder.name, icon: FolderIcon, color: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20' }
      : openView ? FOLDERS.find((f) => f.id === openView) : null;
  const showingSearch = query.trim().length > 0 && !isTrashView;

  return (
    <div className="relative h-full flex flex-col bg-[#1e1e1e] text-white text-sm">
      {/* Barra superior estilo Explorador */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#2b2b2b] flex-shrink-0">
        <button
          onClick={() => setOpenView(null)}
          disabled={!openView && !showingSearch}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 flex-1 bg-[#1e1e1e] border border-white/10 rounded px-3 py-1.5 min-w-0">
          <HardDrive className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <button onClick={() => setOpenView(null)} className="text-white/70 hover:text-white flex-shrink-0">Este equipo</button>
          {folderMeta && !showingSearch && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              <span className="text-white truncate">{folderMeta.name}</span>
            </>
          )}
        </div>
        <div className="relative w-56 flex-shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (e.target.value.trim()) setOpenView(null); }}
            placeholder="Buscar en Archivos..."
            className="w-full bg-[#1e1e1e] border border-white/10 rounded pl-7 pr-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Barra de vistas / orden (solo dentro de una carpeta o buscando) */}
      {(openView || showingSearch) && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-[#252525] flex-shrink-0">
          <button onClick={() => setView('grid')} className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setView('list')} className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
            <List className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <ArrowUpDown className="w-3 h-3 text-white/30" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-white/60 text-xs focus:outline-none cursor-pointer"
          >
            <option className="bg-[#252525]" value="date">Fecha</option>
            <option className="bg-[#252525]" value="name">Nombre</option>
            <option className="bg-[#252525]" value="price">Precio</option>
          </select>
          {openView === 'armas' && weaponCapacity && (
            <span className={`text-xs px-2 py-1 rounded-full ${weaponCapacity.used >= weaponCapacity.max ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/50'}`}>
              Capacidad: {weaponCapacity.used}/{weaponCapacity.max} kg
            </span>
          )}
          <span className="ml-auto text-white/30 text-xs">{visibleItems.length} elementos</span>
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-white/30 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando archivos...
            </div>
          ) : !openView && !showingSearch ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {FOLDERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOpenView(f.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                >
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${f.color}`}>
                    <f.icon className="w-7 h-7" />
                  </div>
                  <span className="text-white text-sm font-medium">{f.name}</span>
                  <span className="text-white/30 text-xs">{counts[f.id]} elementos</span>
                </button>
              ))}
              <button
                onClick={() => setOpenView('papelera')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              >
                <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${TRASH_META.color}`}>
                  <TRASH_META.icon className="w-7 h-7" />
                </div>
                <span className="text-white text-sm font-medium">Papelera</span>
                <span className="text-white/30 text-xs">{trashCount} elementos</span>
              </button>

              {personalFolders.map((f) => (
                <div key={f.id} className="relative group">
                  <button
                    onClick={() => setOpenView(f.id)}
                    className="w-full flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className="w-16 h-16 rounded-2xl border flex items-center justify-center text-yellow-300 bg-yellow-500/10 border-yellow-500/20">
                      <FolderIcon className="w-7 h-7" />
                    </div>
                    <span className="text-white text-sm font-medium truncate max-w-full">{f.name}</span>
                    <span className="text-white/30 text-xs">{f.count} elementos</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRenamingFolderId(f.id); setRenameValue(f.name); }}
                    className="absolute top-2 right-8 p-1 rounded bg-black/40 opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-opacity"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }}
                    className="absolute top-2 right-2 p-1 rounded bg-black/40 opacity-0 group-hover:opacity-100 text-white/60 hover:text-red-400 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {renamingFolderId === f.id && (
                    <div className="absolute inset-x-2 top-2 z-10 flex gap-1 bg-[#1e1e1e] border border-white/20 rounded-lg p-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') renameFolder(f.id); if (e.key === 'Escape') setRenamingFolderId(null); }}
                        className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-xs text-white focus:outline-none"
                      />
                      <button onClick={() => renameFolder(f.id)} className="text-emerald-400 hover:text-emerald-300 flex-shrink-0"><Check className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              ))}

              {showNewFolder ? (
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5">
                  <div className="w-16 h-16 rounded-2xl border flex items-center justify-center text-yellow-300 bg-yellow-500/10 border-yellow-500/20">
                    <FolderIcon className="w-7 h-7" />
                  </div>
                  <input
                    autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
                    placeholder="Nombre..."
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-blue-500/50"
                  />
                  <div className="flex gap-1.5">
                    <button onClick={() => setShowNewFolder(false)} className="text-white/40 hover:text-white text-xs">Cancelar</button>
                    <button onClick={createFolder} className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold">Crear</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setShowNewFolder(true); setNewFolderName(''); }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/15 hover:border-white/30 hover:bg-white/5 transition-colors"
                >
                  <div className="w-16 h-16 rounded-2xl border border-dashed border-white/15 flex items-center justify-center text-white/40">
                    <FolderPlus className="w-7 h-7" />
                  </div>
                  <span className="text-white/50 text-sm font-medium">Nueva carpeta</span>
                </button>
              )}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
              {showingSearch ? <Search className="w-10 h-10" /> : folderMeta && <folderMeta.icon className="w-10 h-10" />}
              <p>{showingSearch ? 'Sin resultados para tu búsqueda.' : isTrashView ? 'La papelera está vacía.' : 'Esta carpeta está vacía.'}</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {visibleItems.map((it) => {
                const fm = FOLDERS.find((f) => f.id === it.folder)!;
                return (
                  <button
                    key={it.id}
                    onClick={() => openFile(it)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-colors ${selected?.id === it.id ? 'bg-blue-500/10 border-blue-500/40' : 'border-transparent hover:bg-white/5 hover:border-white/10'}`}
                  >
                    <div className={`w-14 h-14 rounded-xl border flex items-center justify-center overflow-hidden ${fm.color} ${isTrashView ? 'opacity-50' : ''}`}>
                      {it.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <fm.icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-white text-xs font-medium line-clamp-2">{it.name}</span>
                    {it.giftedBy && !isTrashView && <Gift className="w-3 h-3 text-pink-400" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-white/5 text-white/40 uppercase">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Nombre</th>
                    <th className="text-left px-3 py-2 font-medium">Categoría</th>
                    <th className="text-left px-3 py-2 font-medium">Origen</th>
                    <th className="text-right px-3 py-2 font-medium">Valor</th>
                    <th className="text-right px-3 py-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {visibleItems.map((it) => {
                    const fm = FOLDERS.find((f) => f.id === it.folder)!;
                    return (
                      <tr key={it.id} onClick={() => openFile(it)} className={`cursor-pointer hover:bg-white/5 ${selected?.id === it.id ? 'bg-blue-500/10' : ''}`}>
                        <td className="px-3 py-2 flex items-center gap-2">
                          <fm.icon className={`w-3.5 h-3.5 ${fm.color.split(' ')[0]}`} />
                          <span className="text-white truncate">{it.name}</span>
                          {it.giftedBy && !isTrashView && <Gift className="w-3 h-3 text-pink-400 flex-shrink-0" />}
                        </td>
                        <td className="px-3 py-2 text-white/50">{it.category || '—'}</td>
                        <td className="px-3 py-2 text-white/50">{it.source}</td>
                        <td className="px-3 py-2 text-right text-white/70">{it.price ? `$${it.price.toLocaleString('es-CO')}` : '—'}</td>
                        <td className="px-3 py-2 text-right text-white/30">{timeAgo(it.purchasedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel de detalles */}
        {selected && (
          <div className="w-72 border-l border-white/10 bg-[#252525] flex-shrink-0 overflow-y-auto custom-scrollbar">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                {(() => {
                  const fm = FOLDERS.find((f) => f.id === selected.folder)!;
                  return (
                    <div className={`w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden ${fm.color}`}>
                      {selected.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selected.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <fm.icon className="w-7 h-7" />
                      )}
                    </div>
                  );
                })()}
                <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <h3 className="text-white font-semibold mb-3 break-words">{selected.name}</h3>

              {selected.doc ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-white/40">Titular</span><span className="text-white/70">{selected.doc.holder}</span></div>
                  {selected.doc.number && <div className="flex justify-between"><span className="text-white/40">N.º</span><span className="text-white/70 font-mono">{selected.doc.number}</span></div>}
                  <div className="flex justify-between"><span className="text-white/40">Emitido</span><span className="text-white/70">{timeAgo(selected.doc.issueDate)}</span></div>
                  {selected.doc.expiryDate && <div className="flex justify-between"><span className="text-white/40">Vence</span><span className="text-white/70">{timeAgo(selected.doc.expiryDate)}</span></div>}
                  <div className="flex justify-between"><span className="text-white/40">Estado</span><span className="text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {selected.doc.status}</span></div>
                  {selected.doc.details && Object.entries(selected.doc.details).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2"><span className="text-white/40 flex-shrink-0">{k}</span><span className="text-white/70 text-right">{v}</span></div>
                  ))}
                  <div className="flex justify-between"><span className="text-white/40">Emisor</span><span className="text-white/70">{selected.source}</span></div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-white/40">ID</span><span className="text-white/70 font-mono">{selected.id.slice(0, 8)}</span></div>
                  {selected.category && <div className="flex justify-between"><span className="text-white/40">Categoría</span><span className="text-white/70">{selected.category}</span></div>}
                  {selected.extra && <div className="flex justify-between gap-2"><span className="text-white/40 flex-shrink-0">Detalle</span><span className="text-white/70 text-right">{selected.extra}</span></div>}
                  <div className="flex justify-between"><span className="text-white/40">Adquirido en</span><span className="text-white/70">{selected.source}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Fecha</span><span className="text-white/70">{timeAgo(selected.purchasedAt)}</span></div>
                  {selected.price !== undefined && <div className="flex justify-between"><span className="text-white/40">Precio</span><span className="text-white/70">${selected.price.toLocaleString('es-CO')}</span></div>}
                  <div className="flex justify-between"><span className="text-white/40">Propietario</span><span className="text-white/70">{me?.displayName || 'Tú'}</span></div>
                  {selected.giftedBy && <div className="flex justify-between"><span className="text-white/40">Regalo de</span><span className="text-pink-400">{selected.giftedBy}</span></div>}
                </div>
              )}

              {TRANSFERABLE.has(selected.folder) && !isTrashView && (loadingHistory || history.length > 0) && (
                <div className="mt-4">
                  <p className="text-white/40 text-[10px] uppercase tracking-wide mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Historial</p>
                  {loadingHistory ? (
                    <p className="text-white/30 text-xs">Cargando...</p>
                  ) : (
                    <div className="space-y-1.5">
                      {history.map((h) => (
                        <div key={h.id} className="text-[11px] text-white/50 border-l border-white/10 pl-2">
                          {h.fromName} → {h.toName} <span className="text-white/30">· {timeAgo(h.transferredAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isTrashView && selected.folder !== 'documentos' && (
                <div className="mt-4">
                  <p className="text-white/40 text-[10px] uppercase tracking-wide mb-1.5 flex items-center gap-1"><FolderIcon className="w-3 h-3" /> Carpetas</p>
                  {memberFolderIdsFor(selected).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {memberFolderIdsFor(selected).map((fid) => {
                        const pf = personalFolders.find((f) => f.id === fid);
                        if (!pf) return null;
                        return (
                          <span key={fid} className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-[11px] px-2 py-0.5 rounded-full">
                            {pf.name}
                            <button onClick={() => removeFromFolder(fid)} className="hover:text-white"><X className="w-2.5 h-2.5" /></button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {showAddToFolder ? (
                    <div className="border border-white/10 rounded-lg overflow-hidden">
                      {personalFolders.filter((f) => !memberFolderIdsFor(selected).includes(f.id)).length === 0 ? (
                        <p className="text-white/30 text-[11px] text-center py-2">No hay más carpetas disponibles.</p>
                      ) : (
                        personalFolders.filter((f) => !memberFolderIdsFor(selected).includes(f.id)).map((f) => (
                          <button key={f.id} onClick={() => addToFolder(f.id)} className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 text-left">
                            <FolderIcon className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />
                            <span className="text-white/80 text-xs truncate">{f.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    <button onClick={() => setShowAddToFolder(true)} className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Añadir a carpeta
                    </button>
                  )}
                </div>
              )}

              {isTrashView ? (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => restoreFromTrash(selected)} className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                  </button>
                  <button onClick={() => deletePermanently(selected)} className="flex-1 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              ) : (
                <>
                  {sharedWith ? (
                    <div className="mt-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-xs">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" /> Enviado a {sharedWith}
                    </div>
                  ) : showSharePicker ? (
                    <div className="mt-4 border border-white/10 rounded-lg overflow-hidden">
                      <p className="px-2.5 py-1.5 text-white/40 text-[10px] bg-white/5 border-b border-white/10">Elige un chat</p>
                      <div className="max-h-32 overflow-y-auto">
                        {loadingConversations ? (
                          <p className="text-white/30 text-xs text-center py-3">Cargando...</p>
                        ) : chatConversations.length === 0 ? (
                          <p className="text-white/30 text-xs text-center py-3">No tienes chats en HubChat.</p>
                        ) : (
                          chatConversations.map((c) => (
                            <button key={c.id} onClick={() => shareItem(c.id, c.displayName)} className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 text-left">
                              {c.displayAvatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={c.displayAvatar} alt="" className="w-5 h-5 rounded-full" />
                              ) : <div className="w-5 h-5 rounded-full bg-blue-500/20" />}
                              <span className="text-white/80 text-xs truncate">{c.displayName}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <button onClick={openSharePicker} className="w-full mt-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" /> Compartir por HubChat
                    </button>
                  )}

                  {selected.folder === 'documentos' ? null : TRANSFERABLE.has(selected.folder) && (
                    showTransferPicker ? (
                      <div className="mt-2 p-3 rounded-lg border border-white/10 bg-white/5">
                        <GiftPicker giftTo={transferTo} onChange={setTransferTo} accent="emerald" />
                        {transferError && <p className="text-red-400 text-[11px] mt-2">{transferError}</p>}
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => { setShowTransferPicker(false); setTransferTo(null); }} className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors">Cancelar</button>
                          <button onClick={confirmTransfer} disabled={!transferTo || transferring} className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors">
                            {transferring ? 'Enviando...' : 'Transferir'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowTransferPicker(true)} className="w-full mt-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                        <Send className="w-3.5 h-3.5" /> Transferir a otro jugador
                      </button>
                    )
                  )}

                  {selected.folder !== 'documentos' && (
                    <button onClick={() => moveToTrash(selected)} className="w-full mt-2 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/50 hover:text-red-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-1 border-t border-white/10 bg-[#2b2b2b] text-white/30 text-[11px] flex-shrink-0">
        <span>{items.length} elementos en total</span>
        {me && <span>Propietario: {me.displayName}</span>}
      </div>
    </div>
  );
}

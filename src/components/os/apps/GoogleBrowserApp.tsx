'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Home, Plus, X, Star, Clock,
  Shield, Flame, Cross, Building2, Search, Globe,
} from 'lucide-react';

interface Tab {
  id: string;
  stack: string[];
  index: number;
}

interface Bookmark { id: string; url: string; title: string; }
interface HistoryEntry { id: string; url: string; title: string; visitedAt: string; }

const PAGES: Record<string, { title: string; icon: any; color: string }> = {
  'erlc://home': { title: 'Nueva pestaña', icon: Globe, color: 'text-white/60' },
  'erlc://police': { title: 'Departamento de Policía', icon: Shield, color: 'text-blue-400' },
  'erlc://fire': { title: 'Bomberos ERLC', icon: Flame, color: 'text-red-400' },
  'erlc://ems': { title: 'Servicios Médicos', icon: Cross, color: 'text-emerald-400' },
  'erlc://dots': { title: 'DOTS - Transporte', icon: Building2, color: 'text-amber-400' },
  'erlc://companies': { title: 'Directorio de Empresas', icon: Building2, color: 'text-purple-400' },
};

const SHORTCUTS = ['erlc://police', 'erlc://fire', 'erlc://ems', 'erlc://dots', 'erlc://companies'];

let tabCounter = 0;
function newTab(): Tab { tabCounter++; return { id: `t${tabCounter}`, stack: ['erlc://home'], index: 0 }; }

export default function GoogleBrowserApp() {
  const [tabs, setTabs] = useState<Tab[]>([newTab()]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [addressInput, setAddressInput] = useState('erlc://home');
  const [showHistory, setShowHistory] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string; fields: Record<string, any> }[]>([]);

  const activeTab = tabs.find((t) => t.id === activeTabId)!;
  const currentUrl = activeTab.stack[activeTab.index];

  useEffect(() => { setAddressInput(currentUrl); }, [currentUrl]);

  const loadBookmarks = useCallback(async () => {
    const res = await fetch('/api/browser/bookmarks', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setBookmarks(data.bookmarks);
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/browser/history', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setHistory(data.history);
  }, []);

  useEffect(() => { loadBookmarks(); loadHistory(); }, [loadBookmarks, loadHistory]);

  useEffect(() => {
    if (currentUrl === 'erlc://companies') {
      fetch('/api/browser/companies', { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (d.success) setCompanies(d.companies); });
    }
  }, [currentUrl]);

  const navigate = (url: string) => {
    setTabs((prev) => prev.map((t) => {
      if (t.id !== activeTabId) return t;
      const newStack = t.stack.slice(0, t.index + 1);
      newStack.push(url);
      return { ...t, stack: newStack, index: newStack.length - 1 };
    }));
    const meta = PAGES[url];
    if (meta && url !== 'erlc://home') {
      fetch('/api/browser/history', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, title: meta.title }),
      }).then(() => loadHistory());
    }
  };

  const goBack = () => setTabs((prev) => prev.map((t) => t.id === activeTabId && t.index > 0 ? { ...t, index: t.index - 1 } : t));
  const goForward = () => setTabs((prev) => prev.map((t) => t.id === activeTabId && t.index < t.stack.length - 1 ? { ...t, index: t.index + 1 } : t));
  const goHome = () => navigate('erlc://home');

  const openTab = () => { const t = newTab(); setTabs((prev) => [...prev, t]); setActiveTabId(t.id); };
  const closeTab = (id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) { const t = newTab(); return [t]; }
      return next;
    });
    if (activeTabId === id) setTimeout(() => setTabs((prev) => { if (prev.length) setActiveTabId(prev[0].id); return prev; }), 0);
  };

  const toggleBookmark = async () => {
    const meta = PAGES[currentUrl];
    await fetch('/api/browser/bookmarks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: currentUrl, title: meta?.title || currentUrl }),
    });
    await loadBookmarks();
  };

  const isBookmarked = bookmarks.some((b) => b.url === currentUrl);
  const meta = PAGES[currentUrl];
  const Icon = meta?.icon || Globe;

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Tab bar */}
      <div className="flex items-center bg-[#2a2a2a] px-2 pt-2 gap-1">
        {tabs.map((t) => {
          const url = t.stack[t.index];
          const m = PAGES[url];
          return (
            <div key={t.id} onClick={() => setActiveTabId(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs max-w-[160px] cursor-pointer ${t.id === activeTabId ? 'bg-[#1a1a1a] text-white' : 'bg-[#222] text-white/50'}`}>
              <span className="truncate flex-1">{m?.title || 'Nueva pestaña'}</span>
              <button onClick={(e) => { e.stopPropagation(); closeTab(t.id); }} className="hover:bg-white/10 rounded p-0.5"><X className="w-3 h-3" /></button>
            </div>
          );
        })}
        <button onClick={openTab} className="p-2 text-white/50 hover:text-white"><Plus className="w-4 h-4" /></button>
      </div>

      {/* Toolbar */}
      <div className="bg-[#1a1a1a] px-3 py-2 flex items-center gap-2 border-b border-white/10">
        <button onClick={goBack} disabled={activeTab.index === 0} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 text-white/70"><ArrowLeft className="w-4 h-4" /></button>
        <button onClick={goForward} disabled={activeTab.index === activeTab.stack.length - 1} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 text-white/70"><ArrowRight className="w-4 h-4" /></button>
        <button onClick={() => navigate(currentUrl)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70"><RotateCw className="w-4 h-4" /></button>
        <button onClick={goHome} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70"><Home className="w-4 h-4" /></button>

        <form onSubmit={(e) => { e.preventDefault(); if (PAGES[addressInput]) navigate(addressInput); }} className="flex-1 flex items-center gap-2 bg-[#2a2a2a] rounded-full px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-white/40" />
          <input value={addressInput} onChange={(e) => setAddressInput(e.target.value)} className="flex-1 bg-transparent text-sm text-white outline-none" />
        </form>

        <button onClick={toggleBookmark} className="p-1.5 rounded-lg hover:bg-white/10"><Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-white/70'}`} /></button>
        <button onClick={() => setShowBookmarks((v) => !v)} className="px-2 py-1 rounded-lg hover:bg-white/10 text-white/70 text-xs">Marcadores</button>
        <button onClick={() => setShowHistory((v) => !v)} className="px-2 py-1 rounded-lg hover:bg-white/10 text-white/70 text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Historial</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Page content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {currentUrl === 'erlc://home' ? (
            <div className="p-12 flex flex-col items-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">ERLC Browser</h1>
              <div className="grid grid-cols-3 gap-4 max-w-lg">
                {SHORTCUTS.map((url) => {
                  const m = PAGES[url];
                  const I = m.icon;
                  return (
                    <button key={url} onClick={() => navigate(url)} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <I className={`w-6 h-6 ${m.color}`} />
                      </div>
                      <span className="text-xs text-gray-700 text-center">{m.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : currentUrl === 'erlc://companies' ? (
            <div className="p-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6"><Icon className={`w-8 h-8 ${meta.color}`} /><h1 className="text-2xl font-bold text-gray-800">{meta.title}</h1></div>
              {companies.length === 0 ? (
                <p className="text-gray-500">Todavía no hay empresas registradas en el servidor.</p>
              ) : (
                <div className="space-y-3">
                  {companies.map((c) => (
                    <div key={c.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800">{c.name}</h3>
                      <p className="text-gray-500 text-sm">{c.fields?.sector || ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : meta ? (
            <div className="p-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6"><Icon className={`w-8 h-8 ${meta.color}`} /><h1 className="text-2xl font-bold text-gray-800">{meta.title}</h1></div>
              <p className="text-gray-600 leading-relaxed">
                Página oficial de {meta.title} del servidor ERLC HUB. Aquí encontrarás información institucional, comunicados y contacto.
                Más contenido estará disponible próximamente conforme el servidor añada nuevas páginas oficiales.
              </p>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">Página no encontrada</div>
          )}
        </div>

        {/* Sidebar panels */}
        {showBookmarks && (
          <div className="w-64 border-l border-white/10 bg-[#1a1a1a] p-3 overflow-y-auto custom-scrollbar">
            <h3 className="text-white/60 text-xs uppercase mb-2">Marcadores</h3>
            {bookmarks.length === 0 && <p className="text-white/30 text-xs">Sin marcadores</p>}
            {bookmarks.map((b) => (
              <button key={b.id} onClick={() => navigate(b.url)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-white/70 text-xs truncate block">{b.title}</button>
            ))}
          </div>
        )}
        {showHistory && (
          <div className="w-64 border-l border-white/10 bg-[#1a1a1a] p-3 overflow-y-auto custom-scrollbar">
            <h3 className="text-white/60 text-xs uppercase mb-2">Historial</h3>
            {history.length === 0 && <p className="text-white/30 text-xs">Sin historial</p>}
            {history.map((h) => (
              <button key={h.id} onClick={() => navigate(h.url)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-white/70 text-xs truncate block">{h.title}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

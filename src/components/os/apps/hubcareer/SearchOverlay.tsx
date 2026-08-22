'use client';

import React, { useEffect, useState } from 'react';
import { X, Search, Briefcase, Building2, User as UserIcon } from 'lucide-react';

interface Props {
  onClose: () => void;
  onOpenProfile: (userId: string) => void;
  onOpenCompany: (companyId: string) => void;
}

export default function SearchOverlay({ onClose, onOpenProfile, onOpenCompany }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ people: any[]; companies: any[]; jobs: any[] }>({ people: [], companies: [], jobs: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults({ people: [], companies: [], jobs: [] }); return; }
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/hubcareer/search?q=${encodeURIComponent(query.trim())}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (d.success) setResults(d); })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const hasResults = results.people.length > 0 || results.companies.length > 0 || results.jobs.length > 0;

  return (
    <div className="absolute inset-0 bg-black/70 z-[2000] flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div className="bg-[#0f2536] rounded-xl w-full max-w-lg border border-white/10 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-3 border-b border-white/10">
          <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
          <input
            autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar personas, empresas, empleos..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          />
          <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && <p className="text-white/30 text-sm text-center py-6">Buscando...</p>}
          {!loading && query.trim() && !hasResults && <p className="text-white/30 text-sm text-center py-6">Sin resultados</p>}

          {results.people.length > 0 && (
            <div className="p-2">
              <p className="text-white/30 text-[11px] uppercase tracking-wide px-2 mb-1">Personas</p>
              {results.people.map((p) => (
                <button key={p.discordId} onClick={() => onOpenProfile(p.discordId)} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 text-left">
                  <div className="w-8 h-8 rounded-full bg-sky-600/30 flex items-center justify-center flex-shrink-0"><UserIcon className="w-4 h-4 text-sky-300" /></div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{p.name}</p>
                    {p.headline && <p className="text-white/40 text-xs truncate">{p.headline}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.companies.length > 0 && (
            <div className="p-2 border-t border-white/5">
              <p className="text-white/30 text-[11px] uppercase tracking-wide px-2 mb-1">Empresas</p>
              {results.companies.map((c) => (
                <button key={c.id} onClick={() => onOpenCompany(c.id)} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 text-left">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/30 flex items-center justify-center flex-shrink-0"><Building2 className="w-4 h-4 text-amber-300" /></div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{c.name}</p>
                    <p className="text-white/40 text-xs truncate">{c.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.jobs.length > 0 && (
            <div className="p-2 border-t border-white/5">
              <p className="text-white/30 text-[11px] uppercase tracking-wide px-2 mb-1">Empleos</p>
              {results.jobs.map((j) => (
                <button key={j.id} onClick={() => onOpenCompany(j.companyId)} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 text-left">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/30 flex items-center justify-center flex-shrink-0"><Briefcase className="w-4 h-4 text-emerald-300" /></div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{j.title}</p>
                    <p className="text-white/40 text-xs truncate">{j.companyName} · ${j.salary.toLocaleString('es-CO')}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

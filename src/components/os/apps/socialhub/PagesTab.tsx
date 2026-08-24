'use client';

import { useEffect, useState } from 'react';
import { Building2, Plus, Search } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/os/ui';
import CreatePageModal from './CreatePageModal';
import VerifiedBadge from './VerifiedBadge';

interface PageListItem {
  id: string;
  name: string;
  category: string;
  avatarUrl?: string;
  verified: boolean;
  verificationType?: string;
  followersCount: number;
}

export default function PagesTab({ onOpenPage }: { onOpenPage: (pageId: string) => void }) {
  const [pages, setPages] = useState<PageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    const url = search.trim() ? `/api/social/pages?q=${encodeURIComponent(search.trim())}` : '/api/social/pages';
    fetch(url, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setPages(d.pages); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-white text-xl font-bold">Páginas</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:shadow-[0_0_18px_-4px_rgba(217,70,239,0.5)] text-white text-xs font-semibold transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" /> Crear página
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar páginas..."
          className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : pages.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? 'Sin resultados' : 'Todavía no hay páginas'}
          text={search ? 'Probá con otro nombre.' : 'Creá la primera página para una empresa, departamento u organización del servidor.'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onOpenPage(page.id)}
              className="hs-card hs-card-hover flex items-center gap-3 p-4 rounded-2xl text-left"
            >
              {page.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={page.avatarUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-violet-400" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-white font-semibold text-sm truncate">{page.name}</p>
                  <VerifiedBadge verified={page.verified} accountType={page.verificationType} />
                </div>
                <p className="text-white/40 text-xs truncate">{page.category}</p>
                <p className="text-white/30 text-[11px]">{page.followersCount} seguidores</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePageModal
          onClose={() => setShowCreate(false)}
          onCreated={(pageId) => { setShowCreate(false); onOpenPage(pageId); }}
        />
      )}
    </div>
  );
}

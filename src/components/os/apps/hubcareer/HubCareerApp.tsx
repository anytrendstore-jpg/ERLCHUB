'use client';

import React, { useState } from 'react';
import { Briefcase, Home, Users, Building2, Search as SearchIcon, User as UserIcon, Calendar } from 'lucide-react';
import FeedTab from './FeedTab';
import ProfileTab from './ProfileTab';
import NetworkTab from './NetworkTab';
import JobsTab from './JobsTab';
import CompaniesTab from './CompaniesTab';
import EventsTab from './EventsTab';
import SearchOverlay from './SearchOverlay';

type Tab = 'feed' | 'profile' | 'network' | 'jobs' | 'companies' | 'events';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'feed', label: 'Inicio', icon: Home },
  { id: 'network', label: 'Mi Red', icon: Users },
  { id: 'jobs', label: 'Empleos', icon: Briefcase },
  { id: 'companies', label: 'Empresas', icon: Building2 },
  { id: 'events', label: 'Eventos', icon: Calendar },
  { id: 'profile', label: 'Mi Perfil', icon: UserIcon },
];

export default function HubCareerApp() {
  const [tab, setTab] = useState<Tab>('feed');
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [viewCompanyId, setViewCompanyId] = useState<string | null>(null);

  const openProfile = (userId: string) => { setViewProfileId(userId); setTab('profile'); };
  const openCompany = (companyId: string) => { setViewCompanyId(companyId); setTab('companies'); };

  return (
    <div className="h-full flex flex-col bg-[#0a1f2e] text-white">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-[#08161f]">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-sm">HC</div>
        <span className="font-bold text-lg">HubCareer</span>
        <button
          onClick={() => setSearchOpen(true)}
          className="ml-4 flex-1 max-w-md flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-full px-4 py-2 text-white/40 text-sm transition-colors"
        >
          <SearchIcon className="w-4 h-4" /> Buscar personas, empresas, empleos...
        </button>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === 'profile') setViewProfileId(null); if (t.id === 'companies') setViewCompanyId(null); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${active ? 'bg-sky-600 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {tab === 'feed' && <FeedTab onOpenProfile={openProfile} onOpenCompany={openCompany} />}
        {tab === 'profile' && <ProfileTab userId={viewProfileId} onOpenCompany={openCompany} onBack={() => setViewProfileId(null)} />}
        {tab === 'network' && <NetworkTab onOpenProfile={openProfile} />}
        {tab === 'jobs' && <JobsTab onOpenCompany={openCompany} />}
        {tab === 'companies' && <CompaniesTab companyId={viewCompanyId} onOpenProfile={openProfile} onOpenCompany={openCompany} onBack={() => setViewCompanyId(null)} />}
        {tab === 'events' && <EventsTab onOpenCompany={openCompany} />}
      </div>

      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          onOpenProfile={(id) => { setSearchOpen(false); openProfile(id); }}
          onOpenCompany={(id) => { setSearchOpen(false); openCompany(id); }}
        />
      )}
    </div>
  );
}

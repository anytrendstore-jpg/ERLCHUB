'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase, MapPin, DollarSign, Clock, Search, ClipboardList } from 'lucide-react';
import { useToast } from '@/components/os/ui';

interface Job {
  id: string; companyId: string; companyName: string; title: string; salary: number; location: string;
  type: string; schedule: string; requirements: string; description: string; positions: number; positionsFilled: number; status: string;
}

interface Application {
  id: string; jobId: string; jobTitle: string; companyName: string; status: string; createdAt: string;
}

const STATUS_LABEL: Record<string, string> = { submitted: 'Enviada', reviewing: 'En revisión', interview: 'Entrevista', accepted: 'Aceptada', rejected: 'Rechazada', closed: 'Cerrada' };
const STATUS_COLOR: Record<string, string> = {
  submitted: 'text-sky-400 bg-sky-500/10', reviewing: 'text-amber-400 bg-amber-500/10', interview: 'text-purple-400 bg-purple-500/10',
  accepted: 'text-emerald-400 bg-emerald-500/10', rejected: 'text-red-400 bg-red-500/10', closed: 'text-white/40 bg-white/5',
};

export default function JobsTab({ onOpenCompany }: { onOpenCompany: (id: string) => void }) {
  const toast = useToast();
  const [view, setView] = useState<'browse' | 'applications'>('browse');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Job | null>(null);
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const loadJobs = useCallback(async () => {
    const res = await fetch(`/api/hubcareer/jobs${search ? `?q=${encodeURIComponent(search)}` : ''}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setJobs(data.jobs);
  }, [search]);

  const loadApplications = useCallback(async () => {
    const res = await fetch('/api/hubcareer/applications', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) { setApplications(data.applications); setAppliedIds(new Set(data.applications.map((a: Application) => a.jobId))); }
  }, []);

  useEffect(() => { loadJobs(); loadApplications(); }, [loadJobs, loadApplications]);

  const apply = async () => {
    if (!selected) return;
    setApplying(true);
    try {
      const res = await fetch('/api/hubcareer/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: selected.id }) });
      const data = await res.json();
      if (data.success) { toast.success('Postulación enviada'); setSelected(null); await loadApplications(); }
      else toast.error(data.error || 'No se pudo postular');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setView('browse')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'browse' ? 'bg-sky-600 text-white' : 'bg-white/5 text-white/60'}`}>Buscar empleos</button>
        <button onClick={() => setView('applications')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'applications' ? 'bg-sky-600 text-white' : 'bg-white/5 text-white/60'}`}>
          <ClipboardList className="w-3.5 h-3.5 inline mr-1" /> Mis postulaciones ({applications.length})
        </button>
      </div>

      {view === 'browse' && (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadJobs()}
              placeholder="Buscar por cargo..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            {jobs.map((job) => (
              <button key={job.id} onClick={() => setSelected(job)} className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{job.title}</h3>
                    <button onClick={(e) => { e.stopPropagation(); onOpenCompany(job.companyId); }} className="text-sky-400 text-xs hover:underline">{job.companyName}</button>
                  </div>
                  {appliedIds.has(job.id) && <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">Ya te postulaste</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 text-white/40 text-xs">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${job.salary.toLocaleString('es-CO')}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.type}</span>
                </div>
              </button>
            ))}
            {jobs.length === 0 && <p className="text-white/30 text-sm text-center py-10 flex flex-col items-center gap-2"><Briefcase className="w-8 h-8" /> No hay vacantes disponibles.</p>}
          </div>
        </>
      )}

      {view === 'applications' && (
        <div className="space-y-2">
          {applications.map((app) => (
            <div key={app.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{app.jobTitle}</p>
                <p className="text-white/40 text-xs">{app.companyName}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[app.status]}`}>{STATUS_LABEL[app.status]}</span>
            </div>
          ))}
          {applications.length === 0 && <p className="text-white/30 text-sm text-center py-10">No tienes postulaciones todavía.</p>}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#0f2536] rounded-xl w-full max-w-md border border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{selected.title}</h3>
            <button onClick={() => onOpenCompany(selected.companyId)} className="text-sky-400 text-sm hover:underline">{selected.companyName}</button>
            <div className="flex items-center gap-3 mt-3 text-white/50 text-xs">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selected.location}</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${selected.salary.toLocaleString('es-CO')}</span>
            </div>
            <p className="text-white/40 text-xs mt-1">{selected.type} · {selected.schedule} · {selected.positions - selected.positionsFilled} vacantes disponibles</p>
            <div className="mt-4">
              <p className="text-white/60 text-xs font-semibold mb-1">Descripción</p>
              <p className="text-white/70 text-sm">{selected.description}</p>
            </div>
            <div className="mt-3">
              <p className="text-white/60 text-xs font-semibold mb-1">Requisitos</p>
              <p className="text-white/70 text-sm">{selected.requirements}</p>
            </div>
            <button
              onClick={apply} disabled={applying || appliedIds.has(selected.id)}
              className="w-full mt-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
            >
              {appliedIds.has(selected.id) ? 'Ya te postulaste' : applying ? 'Enviando...' : 'Postularme'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

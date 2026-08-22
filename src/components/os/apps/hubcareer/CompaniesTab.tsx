'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Search, MapPin, Users, Globe, CheckCircle2, Briefcase, X, ClipboardList, Flag, BarChart3, ThumbsUp, MessageSquare, Calendar } from 'lucide-react';
import ReportModal from './ReportModal';
import { useToast } from '@/components/os/ui';

interface Company {
  id: string; name: string; description: string; category: string; location: string; employeeCount: number;
  website?: string; contactInfo?: string; followers: string[]; isFollowing: boolean; isAdmin: boolean; verified: boolean; ownerId: string;
}

interface Job { id: string; title: string; salary: number; location: string; type: string; status: string; positions: number; positionsFilled: number; }
interface Application { id: string; jobTitle: string; applicantId: string; applicantName: string; status: string; createdAt: string; }

const CATEGORIES = ['Tecnología', 'Comercio', 'Salud', 'Seguridad', 'Servicios', 'Industria', 'Gobierno', 'Otro'];
const STATUS_LABEL: Record<string, string> = { submitted: 'Enviada', reviewing: 'En revisión', interview: 'Entrevista', accepted: 'Aceptada', rejected: 'Rechazada', closed: 'Cerrada' };

export default function CompaniesTab({ companyId, onOpenProfile, onOpenCompany, onBack }: { companyId: string | null; onOpenProfile: (id: string) => void; onOpenCompany: (id: string) => void; onBack: () => void }) {
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', category: 'Tecnología', location: '', website: '', contactInfo: '' });
  const [creating, setCreating] = useState(false);

  const [detail, setDetail] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', salary: '', location: '', type: 'Tiempo completo', schedule: '', requirements: '', description: '', positions: '1' });
  const [showApplications, setShowApplications] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [analytics, setAnalytics] = useState<{ followers: number; employeeCount: number; jobsPosted: number; openJobs: number; totalApplications: number; postsCount: number; totalReactions: number; totalComments: number } | null>(null);
  const [companyEvents, setCompanyEvents] = useState<any[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ name: '', date: '', time: '', location: '', description: '' });

  const loadCompanies = useCallback(async () => {
    const res = await fetch(`/api/hubcareer/companies${search ? `?q=${encodeURIComponent(search)}` : ''}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setCompanies(data.companies);
  }, [search]);

  const loadDetail = useCallback(async (id: string) => {
    const [companyRes, jobsRes, eventsRes] = await Promise.all([
      fetch(`/api/hubcareer/companies?id=${id}`, { cache: 'no-store' }),
      fetch(`/api/hubcareer/jobs?companyId=${id}`, { cache: 'no-store' }),
      fetch(`/api/hubcareer/events?companyId=${id}`, { cache: 'no-store' }),
    ]);
    const companyData = await companyRes.json();
    const jobsData = await jobsRes.json();
    const eventsData = await eventsRes.json();
    if (companyData.success) setDetail(companyData.company);
    if (jobsData.success) setJobs(jobsData.jobs);
    if (eventsData.success) setCompanyEvents(eventsData.events);
    if (companyData.success && companyData.company.isAdmin) {
      const analyticsRes = await fetch(`/api/hubcareer/analytics?companyId=${id}`, { cache: 'no-store' });
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) setAnalytics(analyticsData.analytics);
    } else {
      setAnalytics(null);
    }
  }, []);

  useEffect(() => { if (!companyId) loadCompanies(); }, [companyId, loadCompanies]);
  useEffect(() => { if (companyId) loadDetail(companyId); else setDetail(null); }, [companyId, loadDetail]);

  const createCompany = async () => {
    if (!createForm.name.trim() || !createForm.description.trim() || !createForm.location.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/hubcareer/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm) });
      const data = await res.json();
      if (data.success) { toast.success('Empresa creada'); setShowCreate(false); await loadCompanies(); }
      else toast.error(data.error || 'No se pudo crear');
    } finally {
      setCreating(false);
    }
  };

  const toggleFollow = async () => {
    if (!detail) return;
    const res = await fetch('/api/hubcareer/companies/follow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId: detail.id }) });
    const data = await res.json();
    if (data.success) setDetail({ ...detail, isFollowing: data.following });
  };

  const postJob = async () => {
    if (!detail || !jobForm.title.trim() || !jobForm.salary || !jobForm.location.trim() || !jobForm.schedule.trim() || !jobForm.requirements.trim() || !jobForm.description.trim()) return;
    const res = await fetch('/api/hubcareer/jobs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...jobForm, companyId: detail.id, salary: Number(jobForm.salary), positions: Number(jobForm.positions) }),
    });
    const data = await res.json();
    if (data.success) { toast.success('Vacante publicada'); setShowJobForm(false); await loadDetail(detail.id); }
    else toast.error(data.error || 'No se pudo publicar');
  };

  const createEvent = async () => {
    if (!detail || !eventForm.name.trim() || !eventForm.date || !eventForm.location.trim() || !eventForm.description.trim()) return;
    const res = await fetch('/api/hubcareer/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...eventForm, companyId: detail.id }),
    });
    const data = await res.json();
    if (data.success) { toast.success('Evento creado'); setShowEventForm(false); setEventForm({ name: '', date: '', time: '', location: '', description: '' }); await loadDetail(detail.id); }
    else toast.error(data.error || 'No se pudo crear el evento');
  };

  const loadApplications = async () => {
    if (!detail) return;
    setShowApplications(true);
    const res = await fetch(`/api/hubcareer/applications?companyId=${detail.id}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setApplications(data.applications);
  };

  const setAppStatus = async (applicationId: string, status: string) => {
    await fetch('/api/hubcareer/applications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId, status }) });
    await loadApplications();
  };

  if (companyId && detail) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <button onClick={onBack} className="text-sky-400 text-sm">← Volver</button>

        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-amber-600/30 flex items-center justify-center flex-shrink-0"><Building2 className="w-6 h-6 text-amber-300" /></div>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-1.5">{detail.name} {detail.verified && <CheckCircle2 className="w-4 h-4 text-sky-400" />}</h2>
                <p className="text-white/40 text-xs">{detail.category} · <MapPin className="w-3 h-3 inline" /> {detail.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleFollow} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${detail.isFollowing ? 'bg-white/10 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white'}`}>
                {detail.isFollowing ? 'Siguiendo' : 'Seguir'}
              </button>
              <button onClick={() => setShowReport(true)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" title="Reportar empresa"><Flag className="w-3.5 h-3.5 text-white/50" /></button>
            </div>
          </div>
          <p className="text-white/70 text-sm mt-3">{detail.description}</p>
          <div className="flex items-center gap-4 mt-3 text-white/40 text-xs">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {detail.employeeCount} empleados</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {detail.followers.length} seguidores</span>
            {detail.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {detail.website}</span>}
          </div>
          {detail.isAdmin && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
              <button onClick={() => setShowJobForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Publicar vacante
              </button>
              <button onClick={loadApplications} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold transition-colors">
                <ClipboardList className="w-3.5 h-3.5" /> Ver postulaciones
              </button>
              <button onClick={() => setShowEventForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold transition-colors">
                <Calendar className="w-3.5 h-3.5" /> Crear evento
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-3"><Briefcase className="w-4 h-4" /> Vacantes</h3>
          <div className="space-y-2">
            {jobs.map((j) => (
              <div key={j.id} className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{j.title}</p>
                  <p className="text-white/40 text-xs">${j.salary.toLocaleString('es-CO')} · {j.location} · {j.type}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${j.status === 'open' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/40'}`}>{j.status === 'open' ? 'Abierta' : 'Cerrada'}</span>
              </div>
            ))}
            {jobs.length === 0 && <p className="text-white/30 text-xs">Sin vacantes publicadas.</p>}
          </div>
        </div>

        {companyEvents.length > 0 && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Calendar className="w-4 h-4" /> Eventos</h3>
            <div className="space-y-2">
              {companyEvents.map((e: any) => (
                <div key={e.id} className="p-3 bg-white/5 rounded-lg">
                  <p className="text-sm font-medium">{e.name}</p>
                  <p className="text-white/40 text-xs">{e.date}{e.time ? ` · ${e.time}` : ''} · {e.location}</p>
                  <p className="text-white/40 text-[11px] mt-1">{e.attending.length} asistirán</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4" /> Analíticas</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-lg font-bold">{analytics.followers}</p><p className="text-white/40 text-[11px] flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Seguidores</p></div>
              <div><p className="text-lg font-bold">{analytics.jobsPosted}</p><p className="text-white/40 text-[11px]">Vacantes ({analytics.openJobs} abiertas)</p></div>
              <div><p className="text-lg font-bold">{analytics.totalApplications}</p><p className="text-white/40 text-[11px]">Postulaciones</p></div>
              <div><p className="text-lg font-bold">{analytics.postsCount}</p><p className="text-white/40 text-[11px]">Publicaciones</p></div>
              <div><p className="text-lg font-bold">{analytics.totalReactions}</p><p className="text-white/40 text-[11px] flex items-center justify-center gap-1"><ThumbsUp className="w-3 h-3" /> Reacciones</p></div>
              <div><p className="text-lg font-bold">{analytics.totalComments}</p><p className="text-white/40 text-[11px] flex items-center justify-center gap-1"><MessageSquare className="w-3 h-3" /> Comentarios</p></div>
            </div>
          </div>
        )}

        {showJobForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4" onClick={() => setShowJobForm(false)}>
            <div className="bg-[#0f2536] rounded-xl w-full max-w-md border border-white/10 p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Nueva vacante</h3>
                <button onClick={() => setShowJobForm(false)}><X className="w-4 h-4 text-white/40" /></button>
              </div>
              <div className="space-y-2">
                <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="Cargo" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={jobForm.salary} onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })} placeholder="Salario ($)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                  <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} placeholder="Ubicación" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={jobForm.type} onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    {['Tiempo completo', 'Medio tiempo', 'Temporal', 'Prácticas'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={jobForm.schedule} onChange={(e) => setJobForm({ ...jobForm, schedule: e.target.value })} placeholder="Horario" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
                <input type="number" min={1} value={jobForm.positions} onChange={(e) => setJobForm({ ...jobForm, positions: e.target.value })} placeholder="Número de vacantes" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                <textarea value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} placeholder="Requisitos" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none" />
                <textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Descripción" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none" />
              </div>
              <button onClick={postJob} className="w-full mt-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors">Publicar</button>
            </div>
          </div>
        )}

        {showEventForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4" onClick={() => setShowEventForm(false)}>
            <div className="bg-[#0f2536] rounded-xl w-full max-w-md border border-white/10 p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Nuevo evento</h3>
                <button onClick={() => setShowEventForm(false)}><X className="w-4 h-4 text-white/40" /></button>
              </div>
              <div className="space-y-2">
                <input value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} placeholder="Nombre del evento" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                  <input type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
                <input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Ubicación" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Descripción" rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none" />
              </div>
              <button onClick={createEvent} className="w-full mt-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors">Crear evento</button>
            </div>
          </div>
        )}

        {showApplications && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4" onClick={() => setShowApplications(false)}>
            <div className="bg-[#0f2536] rounded-xl w-full max-w-md border border-white/10 p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Postulaciones recibidas</h3>
                <button onClick={() => setShowApplications(false)}><X className="w-4 h-4 text-white/40" /></button>
              </div>
              <div className="space-y-2">
                {applications.map((app) => (
                  <div key={app.id} className="p-3 bg-white/5 rounded-lg">
                    <button onClick={() => { setShowApplications(false); onOpenProfile(app.applicantId); }} className="text-sm font-medium hover:underline">{app.applicantName}</button>
                    <p className="text-white/40 text-xs mb-2">{app.jobTitle}</p>
                    <select value={app.status} onChange={(e) => setAppStatus(app.id, e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                      {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                ))}
                {applications.length === 0 && <p className="text-white/30 text-xs">Sin postulaciones todavía.</p>}
              </div>
            </div>
          </div>
        )}

        {showReport && (
          <ReportModal
            targetType="company" targetId={detail.id} targetLabel={detail.name}
            onClose={() => setShowReport(false)}
            onSubmitted={() => setShowReport(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadCompanies()} placeholder="Buscar empresas..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none" />
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold whitespace-nowrap transition-colors">
          <Plus className="w-4 h-4" /> Crear empresa
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {companies.map((c) => (
          <button key={c.id} onClick={() => onOpenCompany(c.id)} className="text-left p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-600/30 flex items-center justify-center flex-shrink-0"><Building2 className="w-4 h-4 text-amber-300" /></div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{c.name}</p>
                <p className="text-white/40 text-[11px]">{c.category}</p>
              </div>
            </div>
            <p className="text-white/50 text-xs line-clamp-2">{c.description}</p>
          </button>
        ))}
        {companies.length === 0 && <p className="text-white/30 text-sm text-center py-10 col-span-2">No hay empresas registradas todavía.</p>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#0f2536] rounded-xl w-full max-w-md border border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Crear empresa</h3>
              <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-white/40" /></button>
            </div>
            <div className="space-y-2">
              <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Nombre" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
              <select value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} placeholder="Ubicación" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
              <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Descripción" rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none" />
              <input value={createForm.website} onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })} placeholder="Sitio web (opcional)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
              <input value={createForm.contactInfo} onChange={(e) => setCreateForm({ ...createForm, contactInfo: e.target.value })} placeholder="Contacto (opcional)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <button onClick={createCompany} disabled={creating} className="w-full mt-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold text-sm transition-colors">
              {creating ? 'Creando...' : 'Crear empresa'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

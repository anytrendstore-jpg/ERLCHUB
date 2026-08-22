'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Pencil, Plus, Trash2, MapPin, Briefcase, GraduationCap, Award, MessageCircle, UserPlus, CheckCircle2,
  Building2, Eye, ShieldCheck, MoreHorizontal, Flag, Ban, BarChart3, ThumbsUp, MessageSquare, Share2, Users,
} from 'lucide-react';
import { useOS } from '@/contexts/OSContext';
import ReportModal from './ReportModal';

interface Profile {
  discordId: string;
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  experience: any[];
  education: any[];
  skills: any[];
  languages: string[];
  currentJob?: { title: string; companyId: string; companyName: string; since: string };
  verified: boolean;
  profileViews: number;
  privacy: { profile: 'public' | 'connections' | 'private'; experience: 'public' | 'connections' | 'private'; connections: 'public' | 'connections' | 'private' };
}

export default function ProfileTab({ userId, onOpenCompany, onBack }: { userId: string | null; onOpenCompany: (id: string) => void; onBack: () => void }) {
  const { openApp } = useOS();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOwn, setIsOwn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ headline: '', bio: '', location: '' });
  const [privacyForm, setPrivacyForm] = useState({ profile: 'public', experience: 'public', connections: 'public' });
  const [showExpForm, setShowExpForm] = useState(false);
  const [expForm, setExpForm] = useState({ title: '', companyName: '', location: '', startDate: '', endDate: '', current: false, description: '' });
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduForm, setEduForm] = useState({ institution: '', program: '', startDate: '', endDate: '', description: '', certification: '' });
  const [skillInput, setSkillInput] = useState('');
  const [unavailable, setUnavailable] = useState<{ reason: 'not_found' | 'restricted' | 'blocked'; displayName?: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [analytics, setAnalytics] = useState<{ profileViews: number; connections: number; postsCount: number; totalReactions: number; totalComments: number; totalShares: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setUnavailable(null);
    try {
      const url = userId ? `/api/hubcareer/profile?userId=${userId}` : '/api/hubcareer/profile';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        if (data.blocked) { setUnavailable({ reason: 'blocked' }); setProfile(null); }
        else if (data.restricted) { setUnavailable({ reason: 'restricted', displayName: data.displayName }); setProfile(null); }
        else if (!data.profile) { setUnavailable({ reason: 'not_found', displayName: data.displayName }); setProfile(null); }
        else {
          setProfile(data.profile);
          setEditForm({ headline: data.profile.headline, bio: data.profile.bio, location: data.profile.location });
          if (data.profile.privacy) setPrivacyForm(data.profile.privacy);
        }
        setIsOwn(data.isOwn);
        setIsConnected(data.isConnected);
        if (data.isOwn) {
          const analyticsRes = await fetch('/api/hubcareer/analytics', { cache: 'no-store' });
          const analyticsData = await analyticsRes.json();
          if (analyticsData.success) setAnalytics(analyticsData.analytics);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const saveEdit = async () => {
    await fetch('/api/hubcareer/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editForm, privacy: privacyForm }) });
    setEditing(false);
    await load();
  };

  const addExperience = async () => {
    if (!expForm.title.trim() || !expForm.companyName.trim() || !expForm.startDate) return;
    await fetch('/api/hubcareer/experience', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expForm) });
    setShowExpForm(false);
    setExpForm({ title: '', companyName: '', location: '', startDate: '', endDate: '', current: false, description: '' });
    await load();
  };

  const removeExperience = async (id: string) => {
    await fetch(`/api/hubcareer/experience?id=${id}`, { method: 'DELETE' });
    await load();
  };

  const addEducation = async () => {
    if (!eduForm.institution.trim() || !eduForm.program.trim() || !eduForm.startDate) return;
    await fetch('/api/hubcareer/education', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eduForm) });
    setShowEduForm(false);
    setEduForm({ institution: '', program: '', startDate: '', endDate: '', description: '', certification: '' });
    await load();
  };

  const removeEducation = async (id: string) => {
    await fetch(`/api/hubcareer/education?id=${id}`, { method: 'DELETE' });
    await load();
  };

  const addSkill = async () => {
    if (!skillInput.trim()) return;
    await fetch('/api/hubcareer/skills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: skillInput }) });
    setSkillInput('');
    await load();
  };

  const removeSkill = async (id: string) => {
    await fetch(`/api/hubcareer/skills?id=${id}`, { method: 'DELETE' });
    await load();
  };

  const endorseSkill = async (skillId: string) => {
    if (!userId) return;
    await fetch('/api/hubcareer/skills', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, skillId }) });
    await load();
  };

  const connect = async () => {
    if (!userId) return;
    await fetch('/api/hubcareer/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toId: userId }) });
    await load();
  };

  const toggleBlock = async () => {
    if (!userId) return;
    setShowMenu(false);
    await fetch('/api/hubcareer/block', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
    onBack();
  };

  if (loading) return <p className="text-white/30 text-sm text-center py-10">Cargando...</p>;

  if (unavailable) {
    const message = unavailable.reason === 'blocked'
      ? 'No puedes ver este perfil.'
      : unavailable.reason === 'restricted'
        ? `${unavailable.displayName || 'Este usuario'} restringió quién puede ver su perfil.`
        : `${unavailable.displayName || 'Este usuario'} todavía no tiene un perfil en HubCareer.`;
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <button onClick={onBack} className="text-sky-400 text-sm mb-4">← Volver</button>
        <p className="text-white/60 text-sm">{message}</p>
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {!isOwn && <button onClick={onBack} className="text-sky-400 text-sm">← Volver</button>}

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-sky-800 to-sky-600" />
        <div className="p-4 -mt-10">
          <div className="w-20 h-20 rounded-full bg-[#0a1f2e] border-4 border-[#0a1f2e] bg-sky-600/30 flex items-center justify-center">
            <span className="text-2xl font-bold">{profile.displayName.charAt(0)}</span>
          </div>
          <div className="flex items-start justify-between mt-2">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-1.5">{profile.displayName} {profile.verified && <ShieldCheck className="w-4 h-4 text-sky-400" />}</h2>
              <p className="text-white/60 text-sm">{profile.headline || (isOwn ? 'Agrega un titular profesional' : '')}</p>
              {profile.location && <p className="text-white/40 text-xs flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {profile.location}</p>}
              {profile.currentJob && (
                <button onClick={() => onOpenCompany(profile.currentJob!.companyId)} className="text-sky-400 text-xs flex items-center gap-1 mt-1 hover:underline">
                  <Briefcase className="w-3 h-3" /> {profile.currentJob.title} en {profile.currentJob.companyName}
                </button>
              )}
              {!isOwn && <p className="text-white/30 text-[11px] flex items-center gap-1 mt-1"><Eye className="w-3 h-3" /> {profile.profileViews} visitas al perfil</p>}
            </div>
            {isOwn ? (
              <button onClick={() => setEditing(true)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><Pencil className="w-4 h-4" /></button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => openApp('hubchat')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> Mensaje
                </button>
                {!isConnected && (
                  <button onClick={connect} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold transition-colors">
                    <UserPlus className="w-3.5 h-3.5" /> Conectar
                  </button>
                )}
                {isConnected && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Contacto</span>}
                <div className="relative">
                  <button onClick={() => setShowMenu((v) => !v)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-[#0f2536] border border-white/10 rounded-lg overflow-hidden shadow-xl z-10">
                      <button onClick={() => { setShowMenu(false); setShowReport(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 text-left">
                        <Flag className="w-3.5 h-3.5" /> Reportar perfil
                      </button>
                      <button onClick={toggleBlock} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/5 text-left">
                        <Ban className="w-3.5 h-3.5" /> Bloquear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {profile.bio && <p className="text-white/70 text-sm mt-3 whitespace-pre-wrap">{profile.bio}</p>}
        </div>
      </div>

      {editing && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
          <input value={editForm.headline} onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })} placeholder="Titular profesional" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
          <input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="Ubicación" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
          <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Acerca de ti..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none" />

          <div className="pt-2 border-t border-white/5 space-y-2">
            <p className="text-white/40 text-xs font-semibold">Privacidad</p>
            {([['profile', 'Quién ve mi perfil'], ['experience', 'Quién ve mi experiencia y educación'], ['connections', 'Quién ve mis contactos']] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-white/60 text-xs">{label}</span>
                <select
                  value={privacyForm[key]} onChange={(e) => setPrivacyForm({ ...privacyForm, [key]: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="public">Público</option>
                  <option value="connections">Solo contactos</option>
                  <option value="private">Privado</option>
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">Cancelar</button>
            <button onClick={saveEdit} className="flex-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-sm font-semibold transition-colors">Guardar</button>
          </div>
        </div>
      )}

      {isOwn && analytics && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4" /> Analíticas</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-lg font-bold">{analytics.profileViews}</p><p className="text-white/40 text-[11px] flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Visitas</p></div>
            <div><p className="text-lg font-bold">{analytics.connections}</p><p className="text-white/40 text-[11px] flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Contactos</p></div>
            <div><p className="text-lg font-bold">{analytics.postsCount}</p><p className="text-white/40 text-[11px]">Publicaciones</p></div>
            <div><p className="text-lg font-bold">{analytics.totalReactions}</p><p className="text-white/40 text-[11px] flex items-center justify-center gap-1"><ThumbsUp className="w-3 h-3" /> Reacciones</p></div>
            <div><p className="text-lg font-bold">{analytics.totalComments}</p><p className="text-white/40 text-[11px] flex items-center justify-center gap-1"><MessageSquare className="w-3 h-3" /> Comentarios</p></div>
            <div><p className="text-lg font-bold">{analytics.totalShares}</p><p className="text-white/40 text-[11px] flex items-center justify-center gap-1"><Share2 className="w-3 h-3" /> Compartidos</p></div>
          </div>
        </div>
      )}

      {/* Experiencia */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Briefcase className="w-4 h-4" /> Experiencia</h3>
          {isOwn && <button onClick={() => setShowExpForm(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><Plus className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="space-y-3">
          {profile.experience.map((e) => (
            <div key={e.id} className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-white/50 text-xs">{e.companyName}{e.location ? ` · ${e.location}` : ''}</p>
                <p className="text-white/30 text-[11px]">{e.startDate} — {e.current ? 'Actualidad' : e.endDate || ''}</p>
                {e.description && <p className="text-white/60 text-xs mt-1">{e.description}</p>}
              </div>
              {isOwn && <button onClick={() => removeExperience(e.id)}><Trash2 className="w-3.5 h-3.5 text-white/30 hover:text-red-400" /></button>}
            </div>
          ))}
          {profile.experience.length === 0 && <p className="text-white/30 text-xs">Sin experiencia registrada.</p>}
        </div>
        {showExpForm && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
            <input value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} placeholder="Cargo" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
            <input value={expForm.companyName} onChange={(e) => setExpForm({ ...expForm, companyName: e.target.value })} placeholder="Empresa" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input value={expForm.startDate} onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })} placeholder="Inicio (ej. 2025)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
              <input value={expForm.endDate} onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })} placeholder="Fin" disabled={expForm.current} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none disabled:opacity-40" />
            </div>
            <label className="flex items-center gap-2 text-xs text-white/60"><input type="checkbox" checked={expForm.current} onChange={(e) => setExpForm({ ...expForm, current: e.target.checked })} /> Trabajo actual</label>
            <textarea value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="Descripción (opcional)" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowExpForm(false)} className="flex-1 py-1.5 rounded-lg bg-white/5 text-xs">Cancelar</button>
              <button onClick={addExperience} className="flex-1 py-1.5 rounded-lg bg-sky-600 text-xs font-semibold">Agregar</button>
            </div>
          </div>
        )}
      </div>

      {/* Educación */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Educación</h3>
          {isOwn && <button onClick={() => setShowEduForm(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><Plus className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="space-y-3">
          {profile.education.map((e) => (
            <div key={e.id} className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">{e.institution}</p>
                <p className="text-white/50 text-xs">{e.program}{e.certification ? ` · ${e.certification}` : ''}</p>
                <p className="text-white/30 text-[11px]">{e.startDate} — {e.endDate || 'Actualidad'}</p>
              </div>
              {isOwn && <button onClick={() => removeEducation(e.id)}><Trash2 className="w-3.5 h-3.5 text-white/30 hover:text-red-400" /></button>}
            </div>
          ))}
          {profile.education.length === 0 && <p className="text-white/30 text-xs">Sin educación registrada.</p>}
        </div>
        {showEduForm && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
            <input value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} placeholder="Institución" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
            <input value={eduForm.program} onChange={(e) => setEduForm({ ...eduForm, program: e.target.value })} placeholder="Carrera / Programa" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input value={eduForm.startDate} onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })} placeholder="Inicio" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
              <input value={eduForm.endDate} onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })} placeholder="Fin" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
            </div>
            <input value={eduForm.certification} onChange={(e) => setEduForm({ ...eduForm, certification: e.target.value })} placeholder="Certificación (opcional)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowEduForm(false)} className="flex-1 py-1.5 rounded-lg bg-white/5 text-xs">Cancelar</button>
              <button onClick={addEducation} className="flex-1 py-1.5 rounded-lg bg-sky-600 text-xs font-semibold">Agregar</button>
            </div>
          </div>
        )}
      </div>

      {/* Habilidades */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-3"><Award className="w-4 h-4" /> Habilidades</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {profile.skills.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full pl-3 pr-1.5 py-1">
              <span className="text-xs">{s.name}</span>
              {s.endorsements.length > 0 && <span className="text-sky-400 text-[10px] font-semibold">{s.endorsements.length}</span>}
              {isOwn ? (
                <button onClick={() => removeSkill(s.id)} className="p-0.5"><Trash2 className="w-3 h-3 text-white/30 hover:text-red-400" /></button>
              ) : (
                <button onClick={() => endorseSkill(s.id)} className={`p-0.5 rounded-full ${s.endorsements.includes(userId || '') ? 'text-sky-400' : 'text-white/30 hover:text-sky-400'}`}><CheckCircle2 className="w-3 h-3" /></button>
              )}
            </div>
          ))}
          {profile.skills.length === 0 && <p className="text-white/30 text-xs">Sin habilidades registradas.</p>}
        </div>
        {isOwn && (
          <div className="flex gap-2">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSkill()} placeholder="Agregar habilidad..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
            <button onClick={addSkill} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold transition-colors">Agregar</button>
          </div>
        )}
      </div>

      {showReport && userId && (
        <ReportModal
          targetType="user" targetId={userId} targetLabel={`Perfil de ${profile.displayName}`}
          onClose={() => setShowReport(false)}
          onSubmitted={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

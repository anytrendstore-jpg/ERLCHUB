"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Heart, MessageSquare, Star, Trash2, RotateCcw, Search, Flag, CheckCheck, X,
  BadgeCheck, Ban, ShieldOff, User as UserIcon, Loader2, Building2, Plus, UserPlus, UserMinus, Pencil, Image as ImageIcon,
} from "lucide-react";
import { PanelHeader, Card, LoadingBlock, EmptyState, Chip, TextInput, TextArea, Select, Button, IconButton, Modal, formatDate, useToast } from "@/components/staff/ui";
import ImageUploadButton from "@/components/ImageUploadButton";

type Tab = "posts" | "reports" | "accounts" | "pages";

interface StaffPost {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  text: string;
  imageUrl?: string;
  likes: string[];
  comments: { id: string; username: string; displayName: string; text: string; createdAt: string }[];
  featured?: boolean;
  removedByStaff?: boolean;
  removedReason?: string;
  createdAt: string;
}

interface StaffReport {
  id: string;
  targetType: "post" | "comment" | "user";
  targetId: string;
  postId?: string;
  reporterId: string;
  reporterUsername: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface StaffProfile {
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  avatarUrl?: string;
  bio?: string;
  title?: string;
  pinnedLinks?: StaffPageLink[];
  verified?: boolean;
  accountType?: "personal" | "business" | "organization" | "government" | "official";
  suspended?: boolean;
  suspendedReason?: string;
  updatedAt: string;
}

const ACCOUNT_TYPE_LABEL: Record<string, string> = { business: "Empresa", organization: "Organización", government: "Gubernamental", official: "★ Oficial ERLCHUB" };

const TABS: { id: Tab; label: string; icon: typeof Heart }[] = [
  { id: "posts", label: "Publicaciones", icon: MessageSquare },
  { id: "reports", label: "Reportes", icon: Flag },
  { id: "accounts", label: "Cuentas", icon: UserIcon },
  { id: "pages", label: "Páginas", icon: Building2 },
];

export default function SocialPanel() {
  const [tab, setTab] = useState<Tab>("posts");

  return (
    <div>
      <PanelHeader title="HubSocial" subtitle="Moderación de publicaciones, reportes y cuentas de la red social del servidor." />

      <div className="flex items-center gap-1 mb-5 border-b border-[#1F2937]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                active ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "posts" && <PostsTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "accounts" && <AccountsTab />}
      {tab === "pages" && <PagesTab />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const POST_ACTION_MESSAGE: Record<string, string> = {
  remove: "Publicación eliminada", restore: "Publicación restaurada", feature: "Publicación destacada",
  unfeature: "Destacado quitado", deleteComment: "Comentario eliminado",
};

function PostsTab() {
  const toast = useToast();
  const [posts, setPosts] = useState<StaffPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "removed" | "featured">("all");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/staff/social/posts?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } finally {
      setLoading(false);
    }
  }, [q, filter]);

  useEffect(() => { load(); }, [load]);

  const act = async (postId: string, action: string, extra: Record<string, unknown> = {}) => {
    try {
      const res = await fetch("/api/staff/social/posts", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, action, ...extra }),
      });
      const data = await res.json();
      if (data.success) toast.success(POST_ACTION_MESSAGE[action] || "Publicación actualizada");
      else toast.error(data.error || "No se pudo completar la acción");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const confirmRemove = async () => {
    if (!removingId) return;
    await act(removingId, "remove", { reason });
    setRemovingId(null);
    setReason("");
  };

  const deleteComment = async (postId: string, commentId: string) => {
    await act(postId, "deleteComment", { commentId });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por texto o @usuario..." className="w-full pl-9" />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
          <option value="all">Todas</option>
          <option value="featured">Destacadas</option>
          <option value="removed">Eliminadas</option>
        </Select>
      </div>

      {loading ? <LoadingBlock /> : posts.length === 0 ? (
        <EmptyState icon={MessageSquare} text="No hay publicaciones que coincidan." />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className={`p-4 ${post.removedByStaff ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {post.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {post.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{post.displayName} <span className="text-slate-500 font-normal">@{post.username}</span></div>
                    <div className="text-[11px] text-slate-600">{formatDate(post.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {post.featured && <Chip tone="amber" label="Destacada" />}
                  {post.removedByStaff && <Chip tone="rose" label="Eliminada" />}
                </div>
              </div>

              <p className="text-sm text-slate-300 whitespace-pre-wrap break-words mb-2">{post.text || "(sin texto)"}</p>
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt="" className="max-h-40 rounded-lg mb-2 object-cover" />
              )}

              <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {post.likes.length}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {post.comments.length}</span>
              </div>

              {post.comments.length > 0 && (
                <div className="border-t border-[#1F2937] pt-2 mt-2 space-y-1.5">
                  {post.comments.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-400 truncate"><span className="text-slate-300 font-medium">@{c.username}</span>: {c.text}</span>
                      <IconButton icon={Trash2} label="Eliminar comentario" variant="ghost" size="sm" className="flex-shrink-0" onClick={() => deleteComment(post.id, c.id)} />
                    </div>
                  ))}
                </div>
              )}

              {post.removedByStaff && post.removedReason && (
                <p className="text-xs text-rose-400/80 mt-2">Motivo: {post.removedReason}</p>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1F2937]">
                {post.removedByStaff ? (
                  <Button variant="ghost" size="sm" icon={RotateCcw} className="text-emerald-400 hover:text-emerald-300" onClick={() => act(post.id, "restore")}>Restaurar</Button>
                ) : (
                  <Button variant="ghost" size="sm" icon={Trash2} className="text-rose-400 hover:text-rose-300" onClick={() => setRemovingId(post.id)}>Eliminar</Button>
                )}
                <Button
                  variant="ghost" size="sm" icon={Star} className="text-amber-400 hover:text-amber-300"
                  onClick={() => act(post.id, post.featured ? "unfeature" : "feature")}
                >
                  {post.featured ? "Quitar destacado" : "Destacar"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {removingId && (
        <Modal
          title="Eliminar publicación"
          onClose={() => setRemovingId(null)}
          size="sm"
          footer={<Button variant="danger" onClick={confirmRemove} className="w-full">Confirmar eliminación</Button>}
        >
          <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (opcional)" className="w-full" />
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ReportsTab() {
  const toast = useToast();
  const [reports, setReports] = useState<StaffReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "reviewed" | "dismissed" | "all">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/social/reports?status=${status}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setReports(data.reports);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const act = async (reportId: string, action: "review" | "dismiss") => {
    try {
      const res = await fetch("/api/staff/social/reports", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId, action }),
      });
      const data = await res.json();
      if (data.success) toast.success(action === "review" ? "Reporte marcado como revisado" : "Reporte descartado");
      else toast.error(data.error || "No se pudo actualizar el reporte");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const targetLabel = { post: "Publicación", comment: "Comentario", user: "Cuenta" };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="pending">Pendientes</option>
          <option value="reviewed">Revisados</option>
          <option value="dismissed">Descartados</option>
          <option value="all">Todos</option>
        </Select>
      </div>

      {loading ? <LoadingBlock /> : reports.length === 0 ? (
        <EmptyState icon={Flag} text="No hay reportes en esta vista." />
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <Card key={r.id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Chip tone={r.status === "pending" ? "amber" : r.status === "reviewed" ? "emerald" : "slate"} label={targetLabel[r.targetType]} />
                  <span className="text-[11px] text-slate-600">{formatDate(r.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-300">{r.reason}</p>
                <p className="text-[11px] text-slate-600 mt-1">Reportado por @{r.reporterUsername} · target: {r.targetId}</p>
                {r.resolvedBy && <p className="text-[11px] text-slate-600">Resuelto por {r.resolvedBy} · {formatDate(r.resolvedAt)}</p>}
              </div>
              {r.status === "pending" && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <IconButton icon={CheckCheck} label="Marcar revisado" variant="ghost" size="sm" className="text-emerald-400" onClick={() => act(r.id, "review")} />
                  <IconButton icon={X} label="Descartar" variant="ghost" size="sm" onClick={() => act(r.id, "dismiss")} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const ACCOUNT_ACTION_MESSAGE: Record<string, string> = {
  verify: "Cuenta verificada", unverify: "Verificación retirada", setAccountType: "Tipo de cuenta actualizado",
  suspend: "Cuenta suspendida", unsuspend: "Cuenta reactivada",
};

function AccountsTab() {
  const toast = useToast();
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "suspended" | "business">("all");
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingBio, setEditingBio] = useState<StaffProfile | null>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [avatarDraft, setAvatarDraft] = useState("");
  const [linksDraft, setLinksDraft] = useState<{ label: string; url: string }[]>([{ label: "", url: "" }, { label: "", url: "" }, { label: "", url: "" }, { label: "", url: "" }]);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/staff/social/accounts?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setProfiles(data.profiles);
    } finally {
      setLoading(false);
    }
  }, [q, filter]);

  useEffect(() => { load(); }, [load]);

  const act = async (discordId: string, action: string, extra: Record<string, unknown> = {}) => {
    setBusyId(discordId);
    try {
      const res = await fetch("/api/staff/social/accounts", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discordId, action, ...extra }),
      });
      const data = await res.json();
      if (data.success) toast.success(ACCOUNT_ACTION_MESSAGE[action] || "Cuenta actualizada");
      else toast.error(data.error || "No se pudo completar la acción");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setBusyId(null);
    }
  };

  const confirmSuspend = async () => {
    if (!suspendingId) return;
    await act(suspendingId, "suspend", { reason });
    setSuspendingId(null);
    setReason("");
  };

  const confirmBio = async () => {
    if (!editingBio) return;
    setBusyId(editingBio.discordId);
    try {
      await Promise.all([
        fetch("/api/staff/social/accounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discordId: editingBio.discordId, action: "setBio", bio: bioDraft }) }),
        fetch("/api/staff/social/accounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discordId: editingBio.discordId, action: "setTitle", title: titleDraft }) }),
        fetch("/api/staff/social/accounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discordId: editingBio.discordId, action: "setAvatarUrl", avatarUrl: avatarDraft }) }),
        fetch("/api/staff/social/accounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discordId: editingBio.discordId, action: "setPinnedLinks", pinnedLinks: linksDraft }) }),
      ]);
      toast.success("Perfil actualizado");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setBusyId(null);
    }
    setEditingBio(null);
    setBioDraft("");
    setTitleDraft("");
    setAvatarDraft("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por @usuario, nombre o ID..." className="w-full pl-9" />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
          <option value="all">Todas</option>
          <option value="verified">Verificadas</option>
          <option value="business">Empresa/Organización</option>
          <option value="suspended">Suspendidas</option>
        </Select>
        <Button variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>Crear cuenta institucional</Button>
      </div>

      {loading ? <LoadingBlock /> : profiles.length === 0 ? (
        <EmptyState icon={UserIcon} text="No hay cuentas que coincidan." />
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => (
            <Card key={p.discordId} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                {p.avatarUrl || p.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatarUrl || p.avatar} alt="" className="w-9 h-9 rounded-full flex-shrink-0 object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {p.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5 truncate">
                    {p.displayName}
                    {p.verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />}
                    {p.title && <span className="text-violet-400 font-normal text-xs">· {p.title}</span>}
                    {p.suspended && <Chip tone="rose" label="Suspendida" />}
                    {p.accountType && p.accountType !== "personal" && (
                      <Chip tone="blue" label={ACCOUNT_TYPE_LABEL[p.accountType] || p.accountType} />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600">@{p.username} · {p.discordId}</div>
                  {p.bio && <div className="text-[11px] text-slate-400 mt-0.5 italic">"{p.bio}"</div>}
                  {p.suspended && p.suspendedReason && <div className="text-[11px] text-rose-400/80 mt-0.5">Motivo: {p.suspendedReason}</div>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {busyId === p.discordId ? (
                  <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
                ) : (
                  <>
                    <IconButton
                      icon={BadgeCheck} label={p.verified ? "Quitar verificación" : "Verificar cuenta"} variant="ghost" size="sm"
                      className={p.verified ? "text-blue-400" : "text-slate-600"}
                      onClick={() => act(p.discordId, p.verified ? "unverify" : "verify")}
                    />
                    <IconButton
                      icon={Pencil} label="Editar perfil" variant="ghost" size="sm" className="text-slate-500"
                      onClick={() => {
                        setEditingBio(p); setBioDraft(p.bio || ""); setTitleDraft(p.title || ""); setAvatarDraft(p.avatarUrl || p.avatar || "");
                        const existing = p.pinnedLinks || [];
                        setLinksDraft([0, 1, 2, 3].map((i) => existing[i] || { label: "", url: "" }));
                      }}
                    />
                    <Select
                      value={p.accountType || "personal"}
                      onChange={(e) => act(p.discordId, "setAccountType", { accountType: e.target.value })}
                      className="h-8 text-xs"
                    >
                      <option value="personal">Personal</option>
                      <option value="business">Empresa</option>
                      <option value="organization">Organización</option>
                      <option value="government">Gubernamental</option>
                      <option value="official">★ Oficial ERLCHUB</option>
                    </Select>
                    {p.suspended ? (
                      <IconButton icon={ShieldOff} label="Reactivar cuenta" variant="ghost" size="sm" className="text-emerald-400" onClick={() => act(p.discordId, "unsuspend")} />
                    ) : (
                      <IconButton icon={Ban} label="Suspender cuenta" variant="ghost" size="sm" className="text-rose-400" onClick={() => setSuspendingId(p.discordId)} />
                    )}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {suspendingId && (
        <Modal
          title="Suspender cuenta"
          onClose={() => setSuspendingId(null)}
          size="sm"
          footer={<Button variant="danger" onClick={confirmSuspend} className="w-full">Confirmar suspensión</Button>}
        >
          <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (opcional)" className="w-full" />
        </Modal>
      )}

      {editingBio && (
        <Modal
          title={`Editar perfil de @${editingBio.username}`}
          onClose={() => setEditingBio(null)}
          size="sm"
          footer={<Button variant="primary" onClick={confirmBio} className="w-full">Guardar</Button>}
        >
          <label className="text-[11px] text-slate-500 mb-1 block">URL de foto de perfil</label>
          <div className="flex items-center gap-2 mb-3">
            <TextInput value={avatarDraft} onChange={(e) => setAvatarDraft(e.target.value)} placeholder="/LSPDSOCIAL.png" className="flex-1 min-w-0" />
            <ImageUploadButton aspect={1} shape="circle" onUploaded={setAvatarDraft} onError={toast.error} className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#0B0F17] border border-[#1F2937] hover:border-blue-500 text-slate-400 hover:text-white transition-colors flex-shrink-0" />
          </div>

          <label className="text-[11px] text-slate-500 mb-1 block">Título o cargo (sufijo junto al nombre)</label>
          <TextInput value={titleDraft} onChange={(e) => setTitleDraft(e.target.value.slice(0, 50))} placeholder="Ej: CEO of ERLCᴴᵁᴮ" className="w-full mb-3" />
          <label className="text-[11px] text-slate-500 mb-1 block">Biografía</label>
          <TextArea value={bioDraft} onChange={(e) => setBioDraft(e.target.value.slice(0, 160))} rows={3} placeholder="Biografía..." className="w-full" />
          <p className="text-[11px] text-slate-600 mt-1 text-right mb-3">{bioDraft.length}/160</p>

          <label className="text-[11px] text-slate-500 mb-1 block">Botones anclados (hasta 4)</label>
          <div className="space-y-2">
            {linksDraft.map((link, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <TextInput
                  value={link.label}
                  onChange={(e) => setLinksDraft((prev) => prev.map((l, j) => j === i ? { ...l, label: e.target.value } : l))}
                  placeholder="Etiqueta (ej: Tienda)"
                  className="w-28 text-xs"
                />
                <TextInput
                  value={link.url}
                  onChange={(e) => setLinksDraft((prev) => prev.map((l, j) => j === i ? { ...l, url: e.target.value } : l))}
                  placeholder="URL"
                  className="flex-1 text-xs"
                />
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showCreate && <CreateOfficialAccountModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function CreateOfficialAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [title, setTitle] = useState("");
  const [accountType, setAccountType] = useState<"business" | "organization" | "government" | "official">("organization");
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!username.trim() || !displayName.trim()) {
      toast.error("Nombre de usuario y nombre a mostrar son obligatorios");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/staff/social/accounts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), displayName: displayName.trim(), avatarUrl: avatarUrl.trim() || undefined, bio: bio.trim() || undefined, title: title.trim() || undefined, accountType }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Cuenta "@${data.profile.username}" creada`);
        onCreated();
      } else {
        toast.error(data.error || "No se pudo crear la cuenta");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      title="Crear cuenta institucional"
      description="No requiere una sesión real de Discord — se gestiona íntegramente desde este panel."
      onClose={onClose}
      size="sm"
      footer={<Button variant="primary" onClick={submit} loading={creating} className="w-full">Crear cuenta</Button>}
    >
      <div className="space-y-3">
        <div>
          <label className="text-[11px] text-slate-500 mb-1 block">Nombre de usuario (@) *</label>
          <TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej: LSPD" className="w-full" />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 mb-1 block">Nombre a mostrar *</label>
          <TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ej: Los Santos Police Department" className="w-full" />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 mb-1 block">URL de foto de perfil</label>
          <div className="flex items-center gap-2">
            <TextInput value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="/LSPDSOCIAL.png" className="flex-1 min-w-0" />
            <ImageUploadButton aspect={1} shape="circle" onUploaded={setAvatarUrl} onError={toast.error} className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#0B0F17] border border-[#1F2937] hover:border-blue-500 text-slate-400 hover:text-white transition-colors flex-shrink-0" />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 mb-1 block">Título o cargo (sufijo junto al nombre)</label>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value.slice(0, 50))} placeholder="Opcional" className="w-full" />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 mb-1 block">Biografía</label>
          <TextArea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} rows={2} placeholder="Opcional" className="w-full" />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 mb-1 block">Tipo de cuenta</label>
          <Select value={accountType} onChange={(e) => setAccountType(e.target.value as typeof accountType)} className="w-full">
            <option value="business">Empresa</option>
            <option value="organization">Organización</option>
            <option value="government">Gubernamental</option>
            <option value="official">★ Oficial ERLCHUB</option>
          </Select>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

interface StaffPageLink {
  label: string;
  url: string;
}

interface StaffPage {
  id: string;
  name: string;
  category: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  pinnedLinks?: StaffPageLink[];
  verified: boolean;
  verificationType?: "business" | "organization" | "government" | "official";
  ownerId: string;
  admins: string[];
  followersCount: number;
  createdAt: string;
}

const VERIFICATION_TYPE_LABEL: Record<string, string> = { business: "Empresa", organization: "Organización", government: "Gubernamental", official: "Oficial ERLCHUB" };

function PagesTab() {
  const toast = useToast();
  const [pages, setPages] = useState<StaffPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [adminDraftByPage, setAdminDraftByPage] = useState<Record<string, string>>({});
  const [editingLinks, setEditingLinks] = useState<StaffPage | null>(null);
  const [deletingPage, setDeletingPage] = useState<StaffPage | null>(null);
  const [avatarDraft, setAvatarDraft] = useState("");
  const [coverDraft, setCoverDraft] = useState("");
  const [linksDraft, setLinksDraft] = useState<StaffPageLink[]>([{ label: "", url: "" }, { label: "", url: "" }, { label: "", url: "" }]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/staff/social/pages?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, [q, filter]);

  useEffect(() => { load(); }, [load]);

  const act = async (pageId: string, action: string, extra: Record<string, unknown> = {}) => {
    setBusyId(pageId);
    try {
      const res = await fetch("/api/staff/social/pages", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId, action, ...extra }),
      });
      const data = await res.json();
      if (data.success) toast.success("Página actualizada"); else toast.error(data.error || "No se pudo completar la acción");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDeletePage = async () => {
    if (!deletingPage) return;
    setBusyId(deletingPage.id);
    try {
      const res = await fetch("/api/staff/social/pages", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: deletingPage.id }) });
      const data = await res.json();
      if (data.success) toast.success("Página eliminada"); else toast.error(data.error || "No se pudo eliminar");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setBusyId(null);
    }
    setDeletingPage(null);
  };

  const addAdmin = async (pageId: string) => {
    const discordId = (adminDraftByPage[pageId] || "").trim();
    if (!discordId) return;
    await act(pageId, "addAdmin", { discordId });
    setAdminDraftByPage((prev) => ({ ...prev, [pageId]: "" }));
  };

  const openLinksEditor = (p: StaffPage) => {
    setEditingLinks(p);
    setAvatarDraft(p.avatarUrl || "");
    setCoverDraft(p.coverUrl || "");
    const existing = p.pinnedLinks || [];
    setLinksDraft([0, 1, 2].map((i) => existing[i] || { label: "", url: "" }));
  };

  const confirmLinks = async () => {
    if (!editingLinks) return;
    setBusyId(editingLinks.id);
    try {
      await Promise.all([
        fetch("/api/staff/social/pages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: editingLinks.id, action: "setAvatarUrl", avatarUrl: avatarDraft }) }),
        fetch("/api/staff/social/pages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: editingLinks.id, action: "setCoverUrl", coverUrl: coverDraft }) }),
        fetch("/api/staff/social/pages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: editingLinks.id, action: "setPinnedLinks", pinnedLinks: linksDraft }) }),
      ]);
      toast.success("Página actualizada");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setBusyId(null);
    }
    setEditingLinks(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre..." className="w-full pl-9" />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
          <option value="all">Todas</option>
          <option value="verified">Verificadas</option>
          <option value="unverified">Sin verificar</option>
        </Select>
        <Button variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>Crear página oficial</Button>
      </div>

      {loading ? <LoadingBlock /> : pages.length === 0 ? (
        <EmptyState icon={Building2} text="No hay páginas que coincidan." />
      ) : (
        <div className="space-y-2">
          {pages.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  {p.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatarUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5 truncate">
                      {p.name}
                      {p.verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />}
                    </div>
                    <div className="text-[11px] text-slate-600">{p.category} · {p.followersCount} seguidores</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {busyId === p.id ? (
                    <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
                  ) : (
                    <>
                      <IconButton
                        icon={BadgeCheck} label={p.verified ? "Quitar verificación" : "Verificar página"} variant="ghost" size="sm"
                        className={p.verified ? "text-blue-400" : "text-slate-600"}
                        onClick={() => act(p.id, p.verified ? "unverify" : "verify")}
                      />
                      <IconButton
                        icon={ImageIcon} label="Portada y botones anclados" variant="ghost" size="sm" className="text-slate-500"
                        onClick={() => openLinksEditor(p)}
                      />
                      <IconButton
                        icon={Trash2} label="Eliminar página" variant="ghost" size="sm" className="text-rose-400"
                        onClick={() => setDeletingPage(p)}
                      />
                      <Select
                        value={p.verificationType || "organization"}
                        onChange={(e) => act(p.id, "setVerificationType", { verificationType: e.target.value })}
                        className="h-8 text-xs"
                      >
                        <option value="business">Empresa</option>
                        <option value="organization">Organización</option>
                        <option value="government">Gubernamental</option>
                        <option value="official">★ Oficial ERLCHUB</option>
                      </Select>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1F2937]">
                <span className="text-[11px] text-slate-600 flex-shrink-0">Admins ({p.admins.length}):</span>
                {p.admins.map((a) => (
                  <span key={a} className="flex items-center gap-1 text-[11px] text-slate-400 bg-white/5 px-2 py-1 rounded-full">
                    {a}
                    <button onClick={() => act(p.id, "removeAdmin", { discordId: a })} className="text-slate-600 hover:text-rose-400">
                      <UserMinus className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1 ml-auto">
                  <TextInput
                    value={adminDraftByPage[p.id] || ""}
                    onChange={(e) => setAdminDraftByPage((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="ID de Discord..."
                    className="h-7 text-xs w-36"
                  />
                  <IconButton icon={UserPlus} label="Agregar admin" variant="ghost" size="sm" onClick={() => addAdmin(p.id)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && <CreateOfficialPageModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}

      {editingLinks && (
        <Modal
          title={`Logo, portada y accesos de "${editingLinks.name}"`}
          onClose={() => setEditingLinks(null)}
          size="sm"
          footer={<Button variant="primary" onClick={confirmLinks} className="w-full">Guardar</Button>}
        >
          <label className="text-[11px] text-slate-500 mb-1 block">URL de logo (avatar)</label>
          <div className="flex items-center gap-2 mb-3">
            <TextInput value={avatarDraft} onChange={(e) => setAvatarDraft(e.target.value)} placeholder="/LogoLSPD.png" className="flex-1 min-w-0" />
            <ImageUploadButton aspect={1} shape="rect" onUploaded={setAvatarDraft} onError={toast.error} className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#0B0F17] border border-[#1F2937] hover:border-blue-500 text-slate-400 hover:text-white transition-colors flex-shrink-0" />
          </div>

          <label className="text-[11px] text-slate-500 mb-1 block">URL de portada</label>
          <div className="flex items-center gap-2 mb-3">
            <TextInput value={coverDraft} onChange={(e) => setCoverDraft(e.target.value)} placeholder="/bannererlchub.png" className="flex-1 min-w-0" />
            <ImageUploadButton aspect={3} shape="rect" onUploaded={setCoverDraft} onError={toast.error} className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#0B0F17] border border-[#1F2937] hover:border-blue-500 text-slate-400 hover:text-white transition-colors flex-shrink-0" />
          </div>

          <label className="text-[11px] text-slate-500 mb-1 block">Botones anclados (hasta 3)</label>
          <div className="space-y-2">
            {linksDraft.map((link, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <TextInput
                  value={link.label}
                  onChange={(e) => setLinksDraft((prev) => prev.map((l, j) => j === i ? { ...l, label: e.target.value } : l))}
                  placeholder="Etiqueta (ej: Tienda)"
                  className="w-28 text-xs"
                />
                <TextInput
                  value={link.url}
                  onChange={(e) => setLinksDraft((prev) => prev.map((l, j) => j === i ? { ...l, url: e.target.value } : l))}
                  placeholder="URL"
                  className="flex-1 text-xs"
                />
              </div>
            ))}
          </div>
        </Modal>
      )}

      {deletingPage && (
        <Modal
          title={`Eliminar página "${deletingPage.name}"`}
          onClose={() => setDeletingPage(null)}
          size="sm"
          footer={<Button variant="danger" onClick={confirmDeletePage} className="w-full">Confirmar eliminación</Button>}
        >
          <p className="text-sm text-slate-400">Esta acción no se puede deshacer. Se van a perder sus seguidores y administradores asignados.</p>
        </Modal>
      )}
    </div>
  );
}

function CreateOfficialPageModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [verificationType, setVerificationType] = useState<"business" | "organization" | "government" | "official">("organization");
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!name.trim() || !category.trim()) { toast.error("Nombre y categoría son obligatorios"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/staff/social/pages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), category: category.trim(), bio: bio.trim() || undefined, avatarUrl: avatarUrl.trim() || undefined, verificationType }),
      });
      const data = await res.json();
      if (data.success) { toast.success(`${data.page.name} creada y verificada`); onCreated(); }
      else toast.error(data.error || "No se pudo crear la página");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      title="Crear página oficial"
      description="Se crea ya verificada — usalo para cuentas del servidor (ERLCHUB, departamentos, etc)."
      onClose={onClose}
      size="md"
      footer={<Button variant="primary" onClick={submit} disabled={creating} className="w-full">{creating ? "Creando..." : "Crear página"}</Button>}
    >
      <div className="space-y-3">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej: Los Santos Police Department)" className="w-full" />
        <TextInput value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoría (ej: Departamento, Servidor oficial)" className="w-full" />
        <TextArea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Descripción..." rows={3} className="w-full" />
        <div className="flex items-center gap-2">
          <TextInput value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="URL de foto de perfil..." className="flex-1 min-w-0" />
          <ImageUploadButton aspect={1} shape="rect" onUploaded={setAvatarUrl} onError={toast.error} className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#0B0F17] border border-[#1F2937] hover:border-blue-500 text-slate-400 hover:text-white transition-colors flex-shrink-0" />
        </div>
        <Select value={verificationType} onChange={(e) => setVerificationType(e.target.value as any)} className="w-full">
          <option value="official">★ Oficial ERLCHUB</option>
          <option value="organization">Organización</option>
          <option value="government">Gubernamental</option>
          <option value="business">Empresa</option>
        </Select>
      </div>
    </Modal>
  );
}

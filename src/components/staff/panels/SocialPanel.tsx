"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Heart, MessageSquare, Star, Trash2, RotateCcw, Search, Flag, CheckCheck, X,
  BadgeCheck, Ban, ShieldOff, User as UserIcon, Loader2,
} from "lucide-react";
import { PanelHeader, Card, LoadingBlock, EmptyState, Chip, TextInput, Select, Button, IconButton, Modal, formatDate, useToast } from "@/components/staff/ui";

type Tab = "posts" | "reports" | "accounts";

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
  verified?: boolean;
  accountType?: "personal" | "business" | "organization";
  suspended?: boolean;
  suspendedReason?: string;
  updatedAt: string;
}

const TABS: { id: Tab; label: string; icon: typeof Heart }[] = [
  { id: "posts", label: "Publicaciones", icon: MessageSquare },
  { id: "reports", label: "Reportes", icon: Flag },
  { id: "accounts", label: "Cuentas", icon: UserIcon },
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
      </div>

      {loading ? <LoadingBlock /> : profiles.length === 0 ? (
        <EmptyState icon={UserIcon} text="No hay cuentas que coincidan." />
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => (
            <Card key={p.discordId} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                {p.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {p.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5 truncate">
                    {p.displayName}
                    {p.verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />}
                    {p.suspended && <Chip tone="rose" label="Suspendida" />}
                    {p.accountType && p.accountType !== "personal" && (
                      <Chip tone="blue" label={p.accountType === "business" ? "Empresa" : "Organización"} />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600">@{p.username} · {p.discordId}</div>
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
                    <Select
                      value={p.accountType || "personal"}
                      onChange={(e) => act(p.discordId, "setAccountType", { accountType: e.target.value })}
                      className="h-8 text-xs"
                    >
                      <option value="personal">Personal</option>
                      <option value="business">Empresa</option>
                      <option value="organization">Organización</option>
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
    </div>
  );
}

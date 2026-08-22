"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X, Loader2, UsersRound, Trash2, Info } from "lucide-react";
import { PanelHeader, Card, TextInput, PrimaryButton, LoadingBlock, EmptyState, formatDate, useToast } from "@/components/staff/ui";

interface Member { id: string; discordId: string; name: string; role: string; addedAt: string; addedBy: string; }

export default function StaffListPanel() {
  const toast = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [configuredIds, setConfiguredIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ discordId: "", name: "", role: "Staff" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/members", { cache: "no-store" });
      const data = await res.json();
      if (data.success) { setMembers(data.members); setConfiguredIds(data.configuredIds || []); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/staff/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        toast.success("Miembro añadido al directorio");
        setForm({ discordId: "", name: "", role: "Staff" });
        setShowForm(false);
        await load();
      } else {
        toast.error(data.error || "No se pudo añadir el miembro");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (discordId: string) => {
    try {
      const res = await fetch("/api/staff/members", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discordId }) });
      const data = await res.json();
      if (data.success) toast.success("Miembro eliminado del directorio");
      else toast.error(data.error || "No se pudo eliminar el miembro");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  return (
    <div>
      <PanelHeader
        title="Staff List"
        subtitle="Directorio del equipo"
        action={
          <PrimaryButton onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Añadir
          </PrimaryButton>
        }
      />

      <div className="flex items-start gap-2.5 p-3 mb-4 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20 text-xs text-blue-200">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Esta lista es solo el directorio. El acceso real al panel lo da la variable de entorno{" "}
          <code className="px-1 py-0.5 rounded bg-black/30 font-mono">STAFF_DISCORD_IDS</code>
          {configuredIds.length > 0 ? ` (${configuredIds.length} ID(s) configurado(s))` : " (todavía sin configurar)"}.
        </p>
      </div>

      {showForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={submit} className="grid sm:grid-cols-3 gap-3">
            <TextInput placeholder="ID de Discord" value={form.discordId} onChange={(e) => setForm((f) => ({ ...f, discordId: e.target.value }))} required />
            <TextInput placeholder="Nombre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <TextInput placeholder="Rol (ej. Moderador)" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
            <div className="sm:col-span-3">
              <PrimaryButton type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}</PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      {loading ? <LoadingBlock /> : members.length === 0 ? (
        <EmptyState icon={UsersRound} text="Todavía no hay miembros en el directorio" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <Card key={m.id} className="p-4 group relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{m.name}</div>
                  <div className="text-xs text-blue-400">{m.role}</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-mono truncate">{m.discordId}</div>
              <div className="text-[11px] text-slate-600 mt-1">Añadido {formatDate(m.addedAt)} por {m.addedBy}</div>
              <button type="button" onClick={() => remove(m.discordId)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

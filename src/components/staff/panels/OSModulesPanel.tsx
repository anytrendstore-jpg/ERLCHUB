"use client";

import { useCallback, useEffect, useState } from "react";
import { Power, Pencil, Monitor, Lock } from "lucide-react";
import { PanelHeader, Card, LoadingBlock, TextInput, TextArea, Button, IconButton, Modal, formatDate, useToast } from "@/components/staff/ui";
import { osApps } from "@/lib/osData";

interface ModuleConfig {
  id: string;
  enabled: boolean;
  requiresStaff: boolean;
  name?: string;
  description?: string;
  updatedAt: string;
  updatedBy: string;
}

export default function OSModulesPanel() {
  const toast = useToast();
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/os-modules", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setModules(data.modules);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
    try {
      const res = await fetch("/api/staff/os-modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle" }),
      });
      const data = await res.json();
      if (!data.success) toast.error(data.error || "No se pudo actualizar el módulo");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const openEdit = (m: ModuleConfig) => {
    setEditing(m.id);
    setName(m.name || osApps.find((a) => a.id === m.id)?.name || "");
    setDescription(m.description || osApps.find((a) => a.id === m.id)?.description || "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff/os-modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing, name, description }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Módulo actualizado"); setEditing(null); }
      else toast.error(data.error || "No se pudo guardar los cambios");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PanelHeader
        title="Módulos del Sistema"
        subtitle="Activa, desactiva y edita las apps del Dashboard del Jugador (sistema operativo). Los cambios se reflejan automáticamente, sin reiniciar."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => {
          const meta = osApps.find((a) => a.id === m.id);
          return (
            <Card key={m.id} className={`p-4 relative ${!m.enabled ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Monitor className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <div className="text-sm font-semibold text-white truncate">{m.name || meta?.name || m.id}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <IconButton icon={Pencil} label="Editar" variant="ghost" size="sm" onClick={() => openEdit(m)} />
                  <IconButton icon={Power} label={m.enabled ? "Desactivar" : "Activar"} variant="ghost" size="sm" className={m.enabled ? "text-emerald-400" : "text-slate-600"} onClick={() => toggle(m.id)} />
                </div>
              </div>
              <p className="text-xs text-slate-400">{m.description || meta?.description || "—"}</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
                {meta?.category && <span className="px-1.5 py-0.5 rounded bg-[#151C2A] uppercase tracking-wide">{meta.category}</span>}
                {m.requiresStaff && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#151C2A]">
                    <Lock className="h-3 w-3" /> Solo staff
                  </span>
                )}
              </div>
              <div className="mt-2 text-[11px] text-slate-600">Actualizado {formatDate(m.updatedAt)} por {m.updatedBy}</div>
            </Card>
          );
        })}
      </div>

      {editing && (
        <Modal
          title="Editar módulo"
          onClose={() => setEditing(null)}
          size="sm"
          footer={<Button onClick={saveEdit} loading={saving}>Guardar</Button>}
        >
          <div className="space-y-3">
            <TextInput placeholder="Nombre mostrado" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
            <TextArea placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full" />
          </div>
        </Modal>
      )}
    </div>
  );
}

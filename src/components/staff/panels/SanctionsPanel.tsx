"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, X, Loader2, Ban, RotateCcw } from "lucide-react";
import { PanelHeader, Card, Chip, TextInput, TextArea, Select, PrimaryButton, LoadingBlock, EmptyState, formatDate, useToast, Pagination, SortToggle } from "@/components/staff/ui";

type SanctionType = "warn" | "kick" | "temp_ban" | "perm_ban" | "restriction" | "suspension";
interface Sanction {
  id: string; type: SanctionType; targetName: string; reason: string; durationHours?: number;
  issuedBy: string; active: boolean; createdAt: string; revokedAt?: string; revokedBy?: string;
}

const TYPE_LABEL: Record<SanctionType, string> = {
  warn: "Advertencia", kick: "Expulsión", temp_ban: "Ban temporal", perm_ban: "Ban permanente",
  restriction: "Restricción", suspension: "Suspensión",
};
const TYPE_CHIP: Record<SanctionType, "amber" | "orange" | "rose" | "slate"> = {
  warn: "amber", kick: "orange", temp_ban: "rose", perm_ban: "rose", restriction: "orange", suspension: "rose",
};
const TIMED_TYPES: SanctionType[] = ["temp_ban", "restriction", "suspension"];

export default function SanctionsPanel({ onChanged }: { onChanged?: () => void }) {
  const toast = useToast();
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [active, setActive] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "warn" as SanctionType, targetName: "", reason: "", durationHours: "24" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), sort });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/staff/sanctions?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) { setSanctions(data.sanctions); setActive(data.active); setTotalPages(data.totalPages || 1); }
    } finally {
      setLoading(false);
    }
  }, [search, page, sort]);

  useEffect(() => { setPage(1); }, [search, sort]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/staff/sanctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${TYPE_LABEL[form.type]} aplicada a ${form.targetName.trim()}`);
        setForm({ type: "warn", targetName: "", reason: "", durationHours: "24" });
        setShowForm(false);
        await load();
        onChanged?.();
      } else {
        toast.error(data.error || "No se pudo aplicar la sanción");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      const res = await fetch("/api/staff/sanctions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (data.success) toast.success("Sanción revocada");
      else toast.error(data.error || "No se pudo revocar la sanción");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  return (
    <div>
      <PanelHeader
        title="Sanciones"
        subtitle={`${active} sanciones activas`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar jugador o motivo..." className="pl-10 w-64" />
            </div>
            <SortToggle value={sort} onChange={setSort} />
            <PrimaryButton onClick={() => setShowForm((v) => !v)}>
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Nueva
            </PrimaryButton>
          </div>
        }
      />

      {showForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SanctionType }))}>
              {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <TextInput placeholder="Jugador sancionado" value={form.targetName} onChange={(e) => setForm((f) => ({ ...f, targetName: e.target.value }))} required />
            {TIMED_TYPES.includes(form.type) && (
              <TextInput type="number" min={1} placeholder="Duración (horas)" value={form.durationHours} onChange={(e) => setForm((f) => ({ ...f, durationHours: e.target.value }))} />
            )}
            <TextArea className="sm:col-span-2" rows={2} placeholder="Motivo de la sanción" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} required />
            <div className="sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar sanción"}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      {loading ? <LoadingBlock /> : sanctions.length === 0 ? (
        <EmptyState icon={Ban} text="No hay sanciones registradas" />
      ) : (
        <div className="space-y-2">
          {sanctions.map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <Chip tone={TYPE_CHIP[s.type]} label={TYPE_LABEL[s.type]} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">{s.targetName}</div>
                  <div className="text-xs text-slate-500 truncate max-w-md">{s.reason}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
                <span>{s.issuedBy} · {formatDate(s.createdAt)}</span>
                {s.active ? (
                  <button type="button" onClick={() => revoke(s.id)} className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition">
                    <RotateCcw className="h-3.5 w-3.5" /> Revocar
                  </button>
                ) : (
                  <Chip tone="slate" label="Revocada" />
                )}
              </div>
            </Card>
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

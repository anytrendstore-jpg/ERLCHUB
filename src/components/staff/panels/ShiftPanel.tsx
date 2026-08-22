"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, PlayCircle, StopCircle, Loader2 } from "lucide-react";
import { PanelHeader, Card, SectionTitle, TextArea, PrimaryButton, LoadingBlock, EmptyState, formatDate, useToast } from "@/components/staff/ui";

interface Shift { id: string; clockIn: string; clockOut?: string; notes?: string; }

function duration(start: string, end: number | string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}

export default function ShiftPanel() {
  const toast = useToast();
  const [open, setOpen] = useState<Shift | null>(null);
  const [history, setHistory] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/shift", { cache: "no-store" });
    const data = await res.json();
    if (data.success) { setOpen(data.open); setHistory(data.history); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const clockIn = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/staff/shift", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clock_in" }) });
      const data = await res.json();
      if (data.success) toast.success("Turno iniciado");
      else toast.error(data.error || "No se pudo iniciar el turno");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const clockOut = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/staff/shift", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clock_out", notes }) });
      const data = await res.json();
      if (data.success) toast.success("Turno cerrado");
      else toast.error(data.error || "No se pudo cerrar el turno");
      setNotes("");
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
      <PanelHeader title="Mi Turno" subtitle="Fichaje de tus horas de servicio" />

      <Card className="p-6 mb-6">
        {open ? (
          <div className="text-center">
            <Clock className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white tabular-nums">{duration(open.clockIn, now)}</div>
            <p className="text-sm text-slate-400 mt-1">Turno en curso desde {formatDate(open.clockIn)}</p>
            <TextArea className="w-full mt-4" rows={2} placeholder="Notas del turno (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button
              type="button"
              onClick={clockOut}
              disabled={saving}
              className="mt-3 h-11 px-6 inline-flex items-center gap-2 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 text-sm font-semibold ring-1 ring-rose-500/30 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />} Cerrar turno
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-4">No tienes ningún turno abierto</p>
            <PrimaryButton onClick={clockIn} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />} Iniciar turno
            </PrimaryButton>
          </div>
        )}
      </Card>

      <SectionTitle className="mb-3">Historial</SectionTitle>
      {history.length === 0 ? (
        <EmptyState icon={Clock} text="Todavía no has fichado ningún turno" />
      ) : (
        <div className="space-y-2">
          {history.map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm text-white">{formatDate(s.clockIn)} {s.clockOut ? `→ ${formatDate(s.clockOut)}` : "(en curso)"}</div>
                {s.notes && <div className="text-xs text-slate-500 mt-0.5">{s.notes}</div>}
              </div>
              <div className="text-sm font-semibold text-blue-400 tabular-nums">{duration(s.clockIn, s.clockOut || now)}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

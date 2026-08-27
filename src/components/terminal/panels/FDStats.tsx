"use client";

import { useEffect, useState } from "react";
import { BarChart3, FileText, Briefcase, Wrench, Award } from "lucide-react";

interface Stats {
  personnel: { total: number; onDuty: number };
  reports: Record<string, number>;
  cases: Record<string, number>;
  equipment: Record<string, number>;
  certifications: { active: number; expiringSoon: number; expired: number; revoked: number };
  calls: { total: number; last7Days: number };
}

function Tile({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="px-3 py-2.5 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
      <p className="text-[#57534a] text-[9px] uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-[#e5e3de] font-mono text-[18px] mt-0.5">{value}</p>
      {sub && <p className="text-[#867e70] text-[10px] mt-0.5">{sub}</p>}
    </div>
  );
}

function Breakdown({ title, icon: Icon, data }: { title: string; icon: typeof BarChart3; data: Record<string, number> }) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-2">
        <Icon className="w-3 h-3" /> {title}
      </div>
      {total === 0 ? (
        <p className="text-[#57534a] px-1">Sin datos todavía.</p>
      ) : (
        <div className="space-y-1">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-[#867e70] w-32 flex-shrink-0 truncate">{k}</span>
              <div className="flex-1 h-1.5 bg-[#1c1a17] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--dept-accent,#d4af37)] rounded-full" style={{ width: total > 0 ? `${(v / total) * 100}%` : "0%" }} />
              </div>
              <span className="text-[#e5e3de] font-mono w-6 text-right flex-shrink-0">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Estadísticas del departamento — agregaciones reales vía /api/fd/stats, sin métricas inventadas. */
export default function FDStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/fd/stats", { cache: "no-store" });
        const data = await res.json();
        if (data.success) setStats(data.stats);
        else setError(data.error || "No se pudieron cargar las estadísticas");
      } catch {
        setError("No se pudieron cargar las estadísticas");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 p-4">
        <BarChart3 className="w-8 h-8" />
        <p className="text-[11px]">{error}</p>
      </div>
    );
  }

  if (!stats) return <p className="text-[#57534a] text-[11px] p-3">Cargando...</p>;

  return (
    <div className="h-full overflow-y-auto p-3 text-[11px] space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Personal en servicio" value={`${stats.personnel.onDuty}/${stats.personnel.total}`} />
        <Tile label="Incidentes (7 días)" value={stats.calls.last7Days} sub={`${stats.calls.total} totales`} />
        <Tile label="Certificaciones activas" value={stats.certifications.active} sub={stats.certifications.expiringSoon > 0 ? `${stats.certifications.expiringSoon} vencen en 30 días` : undefined} />
      </div>

      <Breakdown title="Reportes por estado" icon={FileText} data={stats.reports} />
      <Breakdown title="Investigaciones por estado" icon={Briefcase} data={stats.cases} />
      <Breakdown title="Equipo por estado" icon={Wrench} data={stats.equipment} />

      <div>
        <div className="flex items-center gap-1.5 text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-2">
          <Award className="w-3 h-3" /> Certificaciones
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Tile label="Activas" value={stats.certifications.active} />
          <Tile label="Vencen pronto" value={stats.certifications.expiringSoon} />
          <Tile label="Vencidas" value={stats.certifications.expired} />
          <Tile label="Revocadas" value={stats.certifications.revoked} />
        </div>
      </div>
    </div>
  );
}

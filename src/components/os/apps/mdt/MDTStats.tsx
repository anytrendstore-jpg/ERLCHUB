"use client";

import MDTLayout from "./MDTLayout";
import { BarChart3 } from "lucide-react";

export function MDTStatsContent() {
  return (
    <>
      <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-10 text-center">
        <BarChart3 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Módulo de estadísticas — Próximamente</p>
      </div>
    </>
  );
}

export default function MDTStats() {
  return (
    <MDTLayout title="Estadísticas" subtitle="Métricas de Rendimiento y Análisis">
      <MDTStatsContent />
    </MDTLayout>
  );
}

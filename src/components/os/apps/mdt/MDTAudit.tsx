"use client";

import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import { ScrollText, Clock, User, Activity } from "lucide-react";
import type { AuditAction } from "@/lib/mdtTypes";

const ACTION_LABEL: Record<AuditAction, string> = {
  login: "Inicio de Sesión",
  logout: "Cierre de Sesión",
  search_person: "Búsqueda de Ciudadano",
  search_vehicle: "Búsqueda de Vehículo",
  search_weapon: "Búsqueda de Arma",
  create_report: "Creación de Reporte",
  edit_report: "Edición de Reporte",
  delete_report: "Eliminación de Reporte",
  create_arrest: "Creación de Arresto",
  issue_citation: "Emisión de Multa",
  create_bolo: "Creación de BOLO",
  access_evidence: "Acceso a Evidencia",
  send_message: "Envío de Mensaje",
  modify_call: "Modificación de Llamada",
  other: "Otro",
};

export function MDTAuditContent() {
  const { state } = useMDT();
  const { auditLogs } = state;

  const getActionColor = (action: string) => {
    if (action === "login") return "text-green-400";
    if (action === "logout") return "text-[var(--text-muted)]";
    if (action.includes("delete")) return "text-red-400";
    if (action.includes("create")) return "text-blue-400";
    if (action.includes("edit")) return "text-yellow-400";
    return "text-slate-400";
  };

  return (
    <>
      <div className="space-y-2">
        {auditLogs.length === 0 && (
          <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-10 text-center">
            <ScrollText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Aún no hay registros de auditoría</p>
          </div>
        )}

        {auditLogs.map(log => (
          <div
            key={log.id}
            className="bg-[#0d1424] border border-[#151d31] rounded-lg px-4 py-3 hover:border-[#3c68c9]/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className={`w-3.5 h-3.5 ${getActionColor(log.action)}`} />
                  <span className={`text-xs font-semibold ${getActionColor(log.action)}`}>
                    {(ACTION_LABEL[log.action as AuditAction] || log.action.replace(/_/g, " ")).toUpperCase()}
                  </span>
                </div>
                <p className="text-white text-sm">{log.description}</p>
                {log.metadata && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
              <div className="text-right text-xs space-y-1 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <User className="w-3.5 h-3.5" />
                  <span>{log.officerName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(log.timestamp).toLocaleString("es-ES")}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function MDTAudit() {
  return (
    <MDTLayout title="Registro de Auditoría" subtitle="Actividad del Sistema y Registro de Seguridad">
      <MDTAuditContent />
    </MDTLayout>
  );
}

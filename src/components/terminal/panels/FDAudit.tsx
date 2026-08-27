"use client";

import { useEffect, useState } from "react";
import {
  ScrollText,
  LogIn,
  LogOut,
  FileText,
  FilePenLine,
  Shield,
  Award,
  Ban,
  Wrench,
  MessageSquare,
  Radio,
  HelpCircle,
} from "lucide-react";

interface AuditEntry {
  id: string;
  firefighterId: string;
  firefighterName: string;
  action: string;
  description: string;
  timestamp: string;
}

const ACTION_META: Record<string, { label: string; icon: typeof ScrollText }> = {
  login: { label: "Entró en servicio", icon: LogIn },
  logout: { label: "Salió de servicio", icon: LogOut },
  create_report: { label: "Reporte creado", icon: FileText },
  edit_report: { label: "Reporte editado", icon: FilePenLine },
  assign_command: { label: "Comando asignado", icon: Shield },
  issue_certification: { label: "Certificación emitida", icon: Award },
  revoke_certification: { label: "Certificación revocada", icon: Ban },
  update_equipment: { label: "Equipo actualizado", icon: Wrench },
  send_message: { label: "Mensaje enviado", icon: MessageSquare },
  modify_call: { label: "Incidente modificado", icon: Radio },
  other: { label: "Otro", icon: HelpCircle },
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Registro de auditoría — solo lectura, alimentado server-side por logFDAudit() desde cada ruta /api/fd/*. Solo mando (nivel 4+) puede verlo. */
export default function FDAudit() {
  const [items, setItems] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/fd/audit", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setItems(data.entries);
        } else {
          setItems([]);
          setError(data.error || "No se pudo cargar la auditoría");
        }
      } catch {
        setItems([]);
        setError("No se pudo cargar la auditoría");
      }
    })();
  }, []);

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
        <span className="text-[#867e70] text-[10px] font-medium">Registro de actividad del departamento</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {items === null ? (
          <p className="text-[#57534a]">Cargando...</p>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <ScrollText className="w-8 h-8" />
            <p>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <ScrollText className="w-8 h-8" />
            <p>Sin actividad registrada todavía.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((e) => {
              const meta = ACTION_META[e.action] || ACTION_META.other;
              const Icon = meta.icon;
              return (
                <div
                  key={e.id}
                  className="flex items-start gap-2.5 px-3 py-2 rounded border border-[var(--dept-window-border,#2a2620)] bg-[#141312]"
                >
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--dept-accent,#c1975a)]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold text-[var(--dept-accent,#c1975a)]">{meta.label}</span>
                      <span className="text-[#57534a] text-[9.5px] font-mono ml-auto flex-shrink-0">{fmtTime(e.timestamp)}</span>
                    </div>
                    <p className="text-[#e5e3de]">{e.description}</p>
                    <p className="text-[#867e70] mt-0.5">{e.firefighterName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

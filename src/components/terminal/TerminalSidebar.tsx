"use client";

import {
  LayoutDashboard, Radio, Users, Car, FileWarning, AlertTriangle, FileText,
  ShieldAlert, Receipt, Package, MessageSquare, Map, BarChart3, ScrollText, Briefcase, Lock,
  FolderOpen, Shield, Flame, Siren, Truck, GraduationCap, HeartPulse, DollarSign, Wrench, Handshake, Building2, CalendarClock, Award,
} from "lucide-react";
import { useMDT } from "@/contexts/MDTContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useTerminalWindows } from "@/contexts/TerminalWindowContext";
import { clearanceLevel } from "@/lib/clearance";
import { MODULE_TITLES } from "./moduleContent";
import type { SidebarIconKey } from "@/lib/departments";

const ICONS: Record<SidebarIconKey, React.ElementType> = {
  LayoutDashboard, Radio, Users, Car, FileWarning, AlertTriangle, FileText,
  ShieldAlert, Receipt, Package, MessageSquare, Map, BarChart3, ScrollText, Briefcase,
  FolderOpen, Shield, Flame, Siren, Truck, GraduationCap, HeartPulse, DollarSign, Wrench, Handshake, Building2, CalendarClock, Award,
};

/** Directorio lateral — módulos bloqueados por clearance se ven, pero no se abren. */
export default function TerminalSidebar() {
  const { state } = useMDT();
  const department = useDepartment();
  const { openWindow } = useTerminalWindows();
  const level = clearanceLevel(state.currentOfficer?.rank);

  return (
    <div className="w-40 flex-shrink-0 border-r border-[#1e2a45] bg-[#080b13] flex flex-col overflow-y-auto">
      <div className="px-3 py-2.5 text-[9px] font-semibold tracking-[0.15em] text-[#4a5372] uppercase">System</div>
      {department.sidebarModules.map((mod) => {
        const Icon = ICONS[mod.icon] || FileText;
        const locked = level < mod.minLevel;
        return (
          <button
            key={mod.id}
            disabled={locked}
            title={locked ? `CLEARANCE REQUIRED — LEVEL ${mod.minLevel}` : undefined}
            onClick={() => openWindow(mod.contentKind, { title: MODULE_TITLES[mod.contentKind] || mod.label, maximized: true, focusExisting: true })}
            className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium transition-colors ${locked ? "text-[#3a4256] cursor-not-allowed" : "text-[#6d7999] hover:text-[#dde3f2] hover:bg-[#111a2c]"}`}
          >
            {locked ? <Lock className="w-3.5 h-3.5 flex-shrink-0" /> : <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
            <span className="truncate">{mod.label}</span>
          </button>
        );
      })}
    </div>
  );
}

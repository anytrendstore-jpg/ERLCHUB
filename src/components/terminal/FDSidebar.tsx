"use client";

import {
  LayoutDashboard, Siren, Users, FileText, MessageSquare, Shield, Lock, AlertTriangle, Truck as TruckIcon, Radio as RadioLucide, GraduationCap, Briefcase, BarChart3, ScrollText, Map as MapIcon, HeartPulse,
} from "lucide-react";
import { useFD } from "@/contexts/FDContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useTerminalWindows } from "@/contexts/TerminalWindowContext";
import { FD_MODULE_TITLES } from "./fdModuleContent";
import type { SidebarIconKey } from "@/lib/departments";

const ICONS: Record<SidebarIconKey, React.ElementType> = {
  LayoutDashboard, Radio: RadioLucide, Users, Car: Siren, FileWarning: FileText, AlertTriangle,
  FileText, ShieldAlert: Shield, Receipt: FileText, Package: FileText, MessageSquare, Map: MapIcon,
  BarChart3, ScrollText, Briefcase, FolderOpen: FileText, Shield,
  Flame: Siren, Siren, Truck: TruckIcon, GraduationCap, HeartPulse,
};

/** Directorio lateral de LSFD — mismo patrón que TerminalSidebar.tsx, gatea por rango real. */
export default function FDSidebar() {
  const { state } = useFD();
  const department = useDepartment();
  const { openWindow } = useTerminalWindows();
  const level = state.currentFirefighter?.rankLevel ?? 0;

  return (
    <div className="w-40 flex-shrink-0 border-r border-[#2a2620] bg-[#111110] flex flex-col overflow-y-auto">
      <div className="px-3 py-2.5 text-[9px] font-semibold tracking-[0.15em] text-[#57534a] uppercase">System</div>
      {department.sidebarModules.map((mod) => {
        const Icon = ICONS[mod.icon] || FileText;
        const locked = level < mod.minLevel;
        return (
          <button
            key={mod.id}
            disabled={locked}
            title={locked ? `CLEARANCE REQUIRED — LEVEL ${mod.minLevel}` : undefined}
            onClick={() => openWindow(mod.contentKind, { title: FD_MODULE_TITLES[mod.contentKind] || mod.label, maximized: true, focusExisting: true })}
            className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium transition-colors ${locked ? "text-[#3d3a34] cursor-not-allowed" : "text-[#867e70] hover:text-[#e5e3de] hover:bg-[#181715]"}`}
          >
            {locked ? <Lock className="w-3.5 h-3.5 flex-shrink-0" /> : <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
            <span className="truncate">{mod.label}</span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useMDT } from "@/contexts/MDTContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import type { MDTScreen } from "@/lib/mdtTypes";
import {
  LayoutDashboard,
  Radio,
  Users,
  Car,
  FileWarning,
  AlertTriangle,
  FileText,
  ShieldAlert,
  Receipt,
  Package,
  MessageSquare,
  Map,
  BarChart3,
  ScrollText,
  LogOut,
  Wifi,
  Plus,
  Briefcase,
  Search,
} from "lucide-react";
import MDTGlobalSearch from "./MDTGlobalSearch";

interface NavItem {
  id: MDTScreen;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "cad", label: "CAD / Despacho", icon: Radio },
  { id: "radio", label: "Radio", icon: Wifi },
  { id: "persons", label: "Ciudadanos", icon: Users },
  { id: "vehicles", label: "Vehículos", icon: Car },
  { id: "cases", label: "Casos", icon: Briefcase },
  { id: "warrants", label: "Órdenes", icon: FileWarning },
  { id: "bolos", label: "BOLOs", icon: AlertTriangle },
  { id: "reports", label: "Reportes", icon: FileText },
  { id: "arrests", label: "Arrestos", icon: ShieldAlert },
  { id: "citations", label: "Multas", icon: Receipt },
  { id: "evidence", label: "Evidencias", icon: Package },
  { id: "messages", label: "Mensajes", icon: MessageSquare },
  { id: "map", label: "Mapa Táctico", icon: Map },
  { id: "stats", label: "Estadísticas", icon: BarChart3 },
  { id: "audit", label: "Auditoría", icon: ScrollText },
];

interface MDTLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** El CAD rediseñado dibuja su propio header de 3 columnas; oculta el header genérico. */
  hideHeader?: boolean;
  /** Pantallas como CAD o el Mapa manejan su propio scroll/relleno de borde a borde. */
  fullBleed?: boolean;
}

export default function MDTLayout({ children, title, subtitle, actions, hideHeader, fullBleed }: MDTLayoutProps) {
  const { state, setScreen, logout } = useMDT();
  const department = useDepartment();
  const { currentOfficer, activeScreen, calls, messages, bolos } = state;
  const [hovered, setHovered] = useState<MDTScreen | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const activeCalls = calls.filter((c) => c.status === "Pending" || c.status === "En Route").length;
  const unreadMessages = messages.filter((m) => !m.isRead && m.to === currentOfficer?.id).length;
  const activeBolos = bolos.filter((b) => b.status === "Active").length;

  const navItemsWithBadges = NAV_ITEMS.map((item) => {
    if (item.id === "cad" && activeCalls > 0) return { ...item, badge: activeCalls };
    if (item.id === "messages" && unreadMessages > 0) return { ...item, badge: unreadMessages };
    if (item.id === "bolos" && activeBolos > 0) return { ...item, badge: activeBolos };
    return item;
  });

  const rankShort = currentOfficer ? `${currentOfficer.rank[0]}O` : "";

  return (
    <div className="h-full flex flex-col bg-[#05070d]">
      {/* Franja técnica: identidad de terminal, no solo una app más */}
      <div className="h-6 bg-[#070a12] border-b border-[#1c2740] px-3 flex items-center gap-3 flex-shrink-0 font-mono text-[9.5px] uppercase tracking-wide text-slate-600 flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-[#6f93d6] shadow-[0_0_4px_#6f93d6]" />
          Terminal <b className="text-slate-400 font-medium">{department.terminalKey}</b>
        </span>
        <span>Sesión <b className="text-slate-400 font-medium">Activa</b></span>
        <span className="flex-1" />
        <span className="text-slate-500 normal-case tracking-normal">Agencia: {department.factionAbbreviation} · Red segura{clock ? ` — ${clock}` : ""}</span>
      </div>

      {/* Barra superior: escudo + nombre del departamento, chip del oficial */}
      <div className="h-14 bg-[#0d1424] border-b border-[#151d31] px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img src={department.badge} alt={department.factionAbbreviation} className="h-10 w-auto flex-shrink-0" />
          <div className="min-w-0 leading-tight">
            <h1 className="text-white font-bold text-[12px] tracking-wide truncate uppercase">{department.name}</h1>
            <p className="text-slate-500 text-[10px] tracking-widest truncate uppercase">{department.subtitle}</p>
          </div>
          {currentOfficer && (
            <div className="flex items-center gap-1.5 bg-[#121a2e] border border-[#1e2a45] rounded-full pl-2.5 pr-3 py-1 ml-1">
              <Car className="w-3 h-3 text-[#6f93d6]" />
              <span className="text-white text-[11px] font-medium whitespace-nowrap">
                #{currentOfficer.badgeNumber} {currentOfficer.firstName[0]}. {currentOfficer.lastName} {currentOfficer.rank}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 h-8 px-3 rounded-lg bg-[#121a2e] border border-[#1e2a45] hover:border-[#3c68c9]/50 text-slate-400 hover:text-white text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5" /> Búsqueda global
          </button>
          <div className="flex items-center gap-1.5 bg-[#121a2e] border border-[#1e2a45] rounded-full px-2.5 py-1 text-slate-400 text-[11px]">
            <span className="text-white font-semibold">1</span>
            <Plus className="w-3 h-3" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
      {/* Barra lateral de solo iconos */}
      <nav className="w-14 bg-[#0d1424] border-r border-[#151d31] flex flex-col items-center py-3 gap-1 flex-shrink-0">
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 items-center custom-scrollbar">
          {navItemsWithBadges.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <div key={item.id} className="relative" onMouseEnter={() => setHovered(item.id)} onMouseLeave={() => setHovered(null)}>
                <button
                  onClick={() => setScreen(item.id)}
                  className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? "bg-[#3c68c9] text-white" : "text-slate-500 hover:bg-[#111a2c] hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.badge ? (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
                {hovered === item.id && (
                  <div className="absolute left-11 top-1/2 -translate-y-1/2 z-50 bg-[#121a2e] border border-[#1e2a45] text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={logout}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </nav>

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        {!hideHeader && (
          <div className="h-11 bg-[#0d1424] border-b border-[#151d31] px-5 flex items-center justify-between flex-shrink-0">
            <div className="min-w-0 flex items-baseline gap-2">
              <h2 className="text-white font-semibold text-sm truncate">{title}</h2>
              {subtitle && <p className="text-slate-500 text-xs truncate">· {subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </div>
        )}
        <main className={`flex-1 min-h-0 ${fullBleed ? "overflow-hidden" : "overflow-y-auto custom-scrollbar p-6"}`}>{children}</main>
      </div>
      </div>

      {showSearch && <MDTGlobalSearch onClose={() => setShowSearch(false)} />}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard, Users, Ban, Flag, ScrollText, Ticket, ShieldCheck,
  BarChart3, Building2, Fingerprint, Clock, CalendarOff, Store,
  Percent, ShoppingBag, Share2, Trophy, UsersRound, LineChart,
  Eye, ClipboardList, Skull, ArrowLeft, LogOut, Lock,
  Landmark, Dices, Car, Crosshair, Handshake, Scale, Siren, Bell, Monitor, Heart, Wallet, Package, Server, Coins, Briefcase, KeyRound, Banknote,
} from "lucide-react";
import { Tooltip } from "@/components/staff/ui";
import type { StaffNavGroup, StaffSection, StaffIdentityView } from "@/lib/staffTypes";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Ban, Flag, ScrollText, Ticket, ShieldCheck,
  BarChart3, Building2, Fingerprint, Clock, CalendarOff, Store,
  Percent, ShoppingBag, Share2, Trophy, UsersRound, LineChart,
  Eye, ClipboardList, Skull,
  Landmark, Dices, Car, Crosshair, Handshake, Scale, Siren, Bell, Monitor, Heart, Wallet, Package, Server, Coins, Briefcase, KeyRound, Banknote,
};

const GROUPS: StaffNavGroup[] = [
  {
    title: "Menú principal",
    items: [
      { id: "overview", label: "Dashboard", icon: "LayoutDashboard" },
      { id: "players", label: "Jugadores", icon: "Users" },
      { id: "sanctions", label: "Sanciones", icon: "Ban" },
      { id: "reports", label: "Reportes", icon: "Flag", badgeKey: "reportsPending" },
      { id: "logs", label: "Logs", icon: "ScrollText" },
      { id: "tickets", label: "Tickets", icon: "Ticket", badgeKey: "ticketsOpen" },
      { id: "whitelist", label: "Whitelist", icon: "ShieldCheck", badgeKey: "whitelistPending" },
      { id: "stats", label: "Estadísticas", icon: "BarChart3" },
      { id: "corporate", label: "Corporativo", icon: "Building2" },
      { id: "internal_affairs", label: "Asuntos Internos", icon: "Fingerprint" },
      { id: "shift", label: "Mi Turno", icon: "Clock" },
      { id: "absences", label: "Mis Ausencias", icon: "CalendarOff" },
      { id: "os_modules", label: "Módulos del Sistema", icon: "Monitor" },
      { id: "social", label: "HubSocial", icon: "Heart" },
      { id: "hubcareer", label: "HubCareer", icon: "Briefcase" },
      { id: "permissions", label: "Gestor de Permisos", icon: "KeyRound" },
    ],
  },
  {
    title: "Directivos",
    items: [
      { id: "directive_store", label: "Tienda", icon: "Store" },
      { id: "directive_coupons", label: "Cupones", icon: "Percent" },
      { id: "directive_purchases", label: "Compras", icon: "ShoppingBag" },
      { id: "directive_referrals", label: "Referidos", icon: "Share2" },
      { id: "directive_rankings", label: "Rankings", icon: "Trophy" },
      { id: "staff_list", label: "Staff List", icon: "UsersRound" },
      { id: "directive_store_stats", label: "Stats Tienda", icon: "LineChart" },
    ],
  },
  {
    title: "Facciones",
    items: [
      { id: "factions_overview", label: "Vista General", icon: "Eye" },
      { id: "factions_audit", label: "Auditoría", icon: "ClipboardList" },
      { id: "factions_sanctions", label: "Sanciones Bandas", icon: "Skull" },
    ],
  },
  {
    title: "Economía",
    items: [
      { id: "economy_store", label: "Tienda", icon: "Store", directorOnly: true },
      { id: "economy_tax", label: "Impuestos", icon: "Scale", directorOnly: true },
      { id: "economy_treasury", label: "Tesoro y Presupuestos", icon: "Banknote", directorOnly: true },
      { id: "economy_salaries", label: "Sueldos", icon: "Handshake", directorOnly: true },
      { id: "economy_bank", label: "Maze Bank", icon: "Landmark", directorOnly: true },
      { id: "economy_hubpay", label: "Cuentas HubPay", icon: "Wallet", directorOnly: true },
      { id: "economy_inventory", label: "Inventarios", icon: "Package", directorOnly: true },
      { id: "economy_vps", label: "VPS Deep Web", icon: "Server", directorOnly: true },
      { id: "economy_crypto", label: "Crypto Economy", icon: "Coins", directorOnly: true },
      { id: "economy_casino", label: "Casino", icon: "Dices", directorOnly: true },
      { id: "economy_companies", label: "Empresas", icon: "Building2", directorOnly: true },
      { id: "economy_dealership", label: "Concesionario", icon: "Car", directorOnly: true },
      { id: "economy_weapons", label: "Tienda de Armas", icon: "Crosshair", directorOnly: true },
      { id: "economy_market", label: "Mercado (P2P)", icon: "Share2", directorOnly: true },
      { id: "economy_balance", label: "Balance e Inflación", icon: "LineChart", directorOnly: true },
      { id: "economy_illegal", label: "Subsistemas Ilegales", icon: "Siren", directorOnly: true },
      { id: "economy_logs", label: "Logs Económicos", icon: "ScrollText", directorOnly: true },
      { id: "economy_alerts", label: "Alertas Inteligentes", icon: "Bell", directorOnly: true },
    ],
  },
];

interface Props {
  active: StaffSection;
  onSelect: (section: StaffSection) => void;
  badges: { whitelistPending: number; ticketsOpen: number; reportsPending: number };
  identity: StaffIdentityView | null;
  isDirector: boolean;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function SidebarContent({ active, onSelect, badges, identity, isDirector, onLogout }: Omit<Props, "mobileOpen" | "onCloseMobile">) {
  return (
    <>
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[#1F2937] flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30 p-1.5">
          <Image src="/logo.png" alt="ERLC HUB" width={24} height={24} className="h-full w-auto object-contain" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent tracking-wide">OPS CENTER</div>
          <div className="text-[10px] text-blue-400 font-semibold tracking-widest uppercase">Network Staff</div>
        </div>
      </div>

      <nav className="custom-scrollbar flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {GROUPS.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? "pt-4 border-t border-[#1F2937]/60" : ""}>
            <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon];
                const count = item.badgeKey ? badges[item.badgeKey] : 0;
                const isActive = active === item.id;
                const locked = item.directorOnly && !isDirector;
                const navButton = (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    disabled={locked}
                    className={`relative w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-2 rounded-lg text-sm transition-all duration-150 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/25"
                        : locked
                          ? "text-slate-600 cursor-not-allowed"
                          : "text-slate-400 hover:bg-[#151C2A] hover:text-white hover:translate-x-0.5"
                    }`}
                  >
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-white/90" />}
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${isActive ? "scale-110" : ""}`} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {locked ? (
                      <Lock className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                    ) : count > 0 ? (
                      <span className={`relative text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        isActive ? "bg-white/25 text-white" : "bg-blue-600/20 text-blue-400 shadow-[0_0_8px_-1px_rgba(37,99,235,0.5)]"
                      }`}>
                        {!isActive && <span className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping" />}
                        <span className="relative">{count}</span>
                      </span>
                    ) : null}
                  </button>
                );
                return locked ? (
                  <Tooltip key={item.id} label="Requiere el rol de Director">{navButton}</Tooltip>
                ) : navButton;
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[#1F2937] space-y-1 flex-shrink-0">
        {identity && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-b from-[#161F33] to-[#131A29] ring-1 ring-[#1F2937] shadow-[0_4px_16px_-8px_rgba(0,0,0,0.5)] mb-1">
            {identity.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={identity.avatar} alt={identity.name} className="w-8 h-8 rounded-full ring-2 ring-blue-500/30" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-600/30">
                {identity.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm text-white truncate">{identity.name}</div>
              <div className="text-[11px] text-slate-500">
                {isDirector ? "Director" : "Staff"} · {identity.via === "discord" ? "Discord" : "Contraseña"}
              </div>
            </div>
          </div>
        )}
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-[#151C2A] hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Mi Dashboard
        </Link>
        {identity?.via === "password" && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-[#151C2A] hover:text-white transition"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        )}
      </div>
    </>
  );
}

export default function StaffSidebar(props: Props) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 w-64 bg-[#0E1420] border-r border-[#1F2937] hidden lg:flex flex-col z-30">
        <SidebarContent {...props} />
      </aside>

      {props.mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={props.onCloseMobile} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-[#0E1420] border-r border-[#1F2937] flex flex-col z-50 lg:hidden">
            <SidebarContent {...props} />
          </aside>
        </>
      )}
    </>
  );
}

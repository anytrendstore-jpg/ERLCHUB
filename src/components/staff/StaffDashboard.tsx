"use client";

import { useCallback, useEffect, useState } from "react";
import { Menu, Bell } from "lucide-react";
import StaffSidebar from "@/components/staff/StaffSidebar";
import OverviewPanel from "@/components/staff/panels/OverviewPanel";
import WhitelistPanel from "@/components/staff/panels/WhitelistPanel";
import PlayersPanel from "@/components/staff/panels/PlayersPanel";
import SanctionsPanel from "@/components/staff/panels/SanctionsPanel";
import ReportsPanel from "@/components/staff/panels/ReportsPanel";
import TicketsPanel from "@/components/staff/panels/TicketsPanel";
import LogsPanel from "@/components/staff/panels/LogsPanel";
import StatsPanel from "@/components/staff/panels/StatsPanel";
import ShiftPanel from "@/components/staff/panels/ShiftPanel";
import StaffListPanel from "@/components/staff/panels/StaffListPanel";
import StorePanel from "@/components/staff/panels/StorePanel";
import CouponsPanel from "@/components/staff/panels/CouponsPanel";
import PurchasesPanel from "@/components/staff/panels/PurchasesPanel";
import ReferralsPanel from "@/components/staff/panels/ReferralsPanel";
import RankingsPanel from "@/components/staff/panels/RankingsPanel";
import EconomyRegistryPanel from "@/components/staff/panels/EconomyRegistryPanel";
import TaxPanel from "@/components/staff/panels/TaxPanel";
import MazeBankPanel from "@/components/staff/panels/MazeBankPanel";
import HubPayAccountsPanel from "@/components/staff/panels/HubPayAccountsPanel";
import InventoryPanel from "@/components/staff/panels/InventoryPanel";
import VPSPanel from "@/components/staff/panels/VPSPanel";
import CryptoEconomyPanel from "@/components/staff/panels/CryptoEconomyPanel";
import BalancePanel from "@/components/staff/panels/BalancePanel";
import AlertsPanel from "@/components/staff/panels/AlertsPanel";
import OSModulesPanel from "@/components/staff/panels/OSModulesPanel";
import SocialPanel from "@/components/staff/panels/SocialPanel";
import HubCareerPanel from "@/components/staff/panels/HubCareerPanel";
import AbsencesPanel from "@/components/staff/panels/AbsencesPanel";
import InternalAffairsPanel from "@/components/staff/panels/InternalAffairsPanel";
import FactionsOverviewPanel from "@/components/staff/panels/FactionsOverviewPanel";
import FactionsAuditPanel from "@/components/staff/panels/FactionsAuditPanel";
import FactionsSanctionsPanel from "@/components/staff/panels/FactionsSanctionsPanel";
import PermissionsPanel from "@/components/staff/panels/PermissionsPanel";
import { ToastProvider } from "@/components/staff/ui";
import type { StaffSection, StaffIdentityView } from "@/lib/staffTypes";

interface Props {
  onLogout: () => void;
}

export default function StaffDashboard({ onLogout }: Props) {
  const [section, setSection] = useState<StaffSection>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [identity, setIdentity] = useState<StaffIdentityView | null>(null);
  const [isDirector, setIsDirector] = useState(false);
  const [badges, setBadges] = useState({ whitelistPending: 0, ticketsOpen: 0, reportsPending: 0 });

  const refreshBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/dashboard", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setBadges({
          whitelistPending: data.kpis.whitelistPending,
          ticketsOpen: data.kpis.ticketsOpen,
          reportsPending: data.kpis.reportsPending,
        });
        setIdentity(data.identity);
        setIsDirector(Boolean(data.isDirector));
      }
    } catch {
      // El sidebar simplemente se queda sin contadores si falla la red.
    }
  }, []);

  useEffect(() => {
    refreshBadges();
    const interval = setInterval(refreshBadges, 30000);
    return () => clearInterval(interval);
  }, [refreshBadges]);

  const select = (s: StaffSection) => { setSection(s); setMobileOpen(false); };

  const renderPanel = () => {
    switch (section) {
      case "overview": return <OverviewPanel identity={identity} onNavigate={select} />;
      case "whitelist": return <WhitelistPanel onChanged={refreshBadges} />;
      case "players": return <PlayersPanel />;
      case "sanctions": return <SanctionsPanel onChanged={refreshBadges} />;
      case "reports": return <ReportsPanel onChanged={refreshBadges} />;
      case "tickets": return <TicketsPanel onChanged={refreshBadges} />;
      case "logs": return <LogsPanel />;
      case "stats": return <StatsPanel />;
      case "shift": return <ShiftPanel />;
      case "staff_list": return <StaffListPanel />;
      case "directive_store": return <StorePanel title="Tienda" />;
      case "directive_store_stats": return <StorePanel title="Stats Tienda" />;
      case "directive_coupons": return <CouponsPanel />;
      case "directive_purchases": return <PurchasesPanel />;
      case "directive_referrals": return <ReferralsPanel />;
      case "directive_rankings": return <RankingsPanel />;
      case "corporate": return <HubCareerPanel />;
      case "internal_affairs": return <InternalAffairsPanel />;
      case "absences": return <AbsencesPanel />;
      case "os_modules": return <OSModulesPanel />;
      case "social": return <SocialPanel />;
      case "hubcareer": return <HubCareerPanel />;
      case "permissions": return <PermissionsPanel />;
      case "factions_overview": return <FactionsOverviewPanel isDirector={isDirector} />;
      case "factions_audit": return <FactionsAuditPanel isDirector={isDirector} />;
      case "factions_sanctions": return <FactionsSanctionsPanel isDirector={isDirector} />;

      /* -------- Menú de Economía (solo Directores) -------- */
      case "economy_store": return <EconomyRegistryPanel moduleId="catalog" isDirector={isDirector} />;
      case "economy_tax": return <TaxPanel isDirector={isDirector} />;
      case "economy_salaries": return <EconomyRegistryPanel moduleId="jobs" isDirector={isDirector} />;
      case "economy_bank": return <MazeBankPanel isDirector={isDirector} />;
      case "economy_hubpay": return <HubPayAccountsPanel isDirector={isDirector} />;
      case "economy_inventory": return <InventoryPanel isDirector={isDirector} />;
      case "economy_vps": return <VPSPanel isDirector={isDirector} />;
      case "economy_crypto": return <CryptoEconomyPanel isDirector={isDirector} />;
      case "economy_casino": return <EconomyRegistryPanel moduleId="casino" isDirector={isDirector} />;
      case "economy_companies": return <EconomyRegistryPanel moduleId="companies" isDirector={isDirector} />;
      case "economy_dealership": return <EconomyRegistryPanel moduleId="vehicles" isDirector={isDirector} />;
      case "economy_weapons": return <EconomyRegistryPanel moduleId="weapons" isDirector={isDirector} />;
      case "economy_market": return <EconomyRegistryPanel moduleId="market" isDirector={isDirector} />;
      case "economy_balance": return <BalancePanel isDirector={isDirector} />;
      case "economy_illegal": return <EconomyRegistryPanel moduleId="illegal" isDirector={isDirector} />;
      case "economy_logs": return <LogsPanel fixedCategory="ECONOMIA" isDirector={isDirector} />;
      case "economy_alerts": return <AlertsPanel isDirector={isDirector} />;

      default: return null;
    }
  };

  return (
    <ToastProvider>
    <div className="min-h-screen bg-[#0B0F17] text-slate-200">
      <StaffSidebar
        active={section}
        onSelect={select}
        badges={badges}
        identity={identity}
        isDirector={isDirector}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="lg:pl-64">
        <header
          className="sticky top-0 z-20 h-16 bg-[#0E1420]/95 backdrop-blur border-b border-[#1F2937] flex items-center gap-3 px-4 lg:px-8"
          style={{ boxShadow: "0 1px 0 0 rgba(59,130,246,0.15) inset" }}
        >
          <button type="button" onClick={() => setMobileOpen(true)} className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#151C2A] transition">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button type="button" onClick={refreshBadges} className="relative h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#151C2A] transition-all duration-150 hover:scale-105 active:scale-95">
            <Bell className="h-4 w-4" />
            {badges.whitelistPending + badges.ticketsOpen + badges.reportsPending > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_-1px_rgba(37,99,235,0.7)]">
                {badges.whitelistPending + badges.ticketsOpen + badges.reportsPending}
              </span>
            )}
          </button>
          {identity && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#1F2937]">
              {identity.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={identity.avatar} alt={identity.name} className="w-8 h-8 rounded-full ring-2 ring-blue-500/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-600/30">
                  {identity.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:flex items-center gap-1.5 text-sm text-white">
                {identity.name}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>
          )}
        </header>

        <main className="p-4 lg:p-8">{renderPanel()}</main>
      </div>
    </div>
    </ToastProvider>
  );
}

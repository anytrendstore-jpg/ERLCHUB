"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TerminalWindowProvider, useTerminalWindows } from "@/contexts/TerminalWindowContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import TerminalTopBar from "./TerminalTopBar";
import TerminalSidebar from "./TerminalSidebar";
import TerminalFuncBar from "./TerminalFuncBar";
import TerminalWindow from "./TerminalWindow";
import InstitutionalTransition from "@/components/os/InstitutionalTransition";
import { rememberPersonalChoice } from "@/lib/systemChoice";
import MDTGlobalSearch from "@/components/os/apps/mdt/MDTGlobalSearch";
import { MODULE_CONTENT, MODULE_TITLES } from "./moduleContent";
import DashboardOverviewPanel from "./panels/DashboardOverviewPanel";
import RadioPanel from "./panels/RadioPanel";
import PersonSearchPanel from "./panels/PersonSearchPanel";
import CaseFilePanel from "./panels/CaseFilePanel";
import DocumentViewerPanel from "./panels/DocumentViewerPanel";
import SystemLogPanel from "./panels/SystemLogPanel";
import FileManagerPanel from "./panels/FileManagerPanel";
import AdminFactionPanel from "./panels/AdminFactionPanel";

const HOME_PANEL_CONTENT: Record<string, React.ComponentType> = {
  "dashboard-overview": DashboardOverviewPanel,
  "radio-preview": RadioPanel,
  "person-search": PersonSearchPanel,
  "case-file-preview": CaseFilePanel,
  "document-viewer": DocumentViewerPanel,
  "system-log": SystemLogPanel,
  files: FileManagerPanel,
  admin: AdminFactionPanel,
};

const ALL_CONTENT: Record<string, React.ComponentType> = { ...HOME_PANEL_CONTENT, ...MODULE_CONTENT };

function WindowsLayer() {
  const { windows } = useTerminalWindows();
  return (
    <>
      {windows.map((win) => {
        const Content = ALL_CONTENT[win.kind];
        return (
          <TerminalWindow key={win.id} win={win}>
            {Content ? <Content /> : <div className="p-3 text-[#454f6b] text-xs">Módulo no disponible.</div>}
          </TerminalWindow>
        );
      })}
    </>
  );
}

function DesktopWorkspace() {
  const { openWindow } = useTerminalWindows();
  const openedDefaults = useRef(false);

  useEffect(() => {
    if (openedDefaults.current) return;
    openedDefaults.current = true;
    openWindow("dashboard-overview", { title: "Dashboard Overview", position: { x: 16, y: 16 }, size: { width: 380, height: 230 } });
    openWindow("radio-preview", { title: "Radio Communications", position: { x: 700, y: 16 }, size: { width: 320, height: 230 } });
    openWindow("person-search", { title: "MDT — Person Search", position: { x: 16, y: 262 }, size: { width: 320, height: 300 } });
    openWindow("case-file-preview", { title: "Case File", position: { x: 350, y: 262 }, size: { width: 340, height: 300 } });
    openWindow("document-viewer", { title: "Document Viewer", position: { x: 704, y: 262 }, size: { width: 316, height: 380 } });
    openWindow("system-log", { title: "System Log", position: { x: 350, y: 574 }, size: { width: 340, height: 190 } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#151d31 1px, transparent 1px), linear-gradient(90deg, #151d31 1px, transparent 1px)", backgroundSize: "34px 34px" }}
      />
      <WindowsLayer />
    </div>
  );
}

/**
 * El escritorio del terminal institucional — barra técnica, directorio,
 * capa de ventanas de verdad (arrastrables/redimensionables/varias
 * instancias), barra de funciones. F6 dispara la transición inversa hacia
 * el escritorio personal.
 */
export default function TerminalDesktop() {
  const department = useDepartment();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (loggingOut) {
    return (
      <InstitutionalTransition
        direction="to-personal"
        department={department}
        onComplete={() => { rememberPersonalChoice(); router.replace("/dashboard"); }}
      />
    );
  }

  return (
    <TerminalWindowProvider>
      <div className="h-full w-full flex flex-col bg-[#05070d]">
        <TerminalTopBar />
        <div className="flex-1 flex min-h-0">
          <TerminalSidebar />
          <DesktopWorkspace />
        </div>
        <SearchTrigger show={showSearch} onOpen={() => setShowSearch(true)} onClose={() => setShowSearch(false)} />
        <FuncBarWithWindows onLogout={() => setLoggingOut(true)} onSearch={() => setShowSearch(true)} />
      </div>
    </TerminalWindowProvider>
  );
}

function SearchTrigger({ show, onOpen, onClose }: { show: boolean; onOpen: () => void; onClose: () => void }) {
  if (!show) return null;
  return <MDTGlobalSearch onClose={onClose} />;
}

function FuncBarWithWindows({ onLogout, onSearch }: { onLogout: () => void; onSearch: () => void }) {
  const { openWindow } = useTerminalWindows();
  return (
    <TerminalFuncBar
      onSearch={onSearch}
      onDirectory={() => openWindow("cad", { title: MODULE_TITLES.cad, maximized: true, focusExisting: true })}
      onLogout={onLogout}
    />
  );
}

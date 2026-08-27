"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TerminalWindowProvider, useTerminalWindows } from "@/contexts/TerminalWindowContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import FDTopBar from "./FDTopBar";
import FDSidebar from "./FDSidebar";
import TerminalFuncBar from "./TerminalFuncBar";
import TerminalWindow from "./TerminalWindow";
import InstitutionalTransition from "@/components/os/InstitutionalTransition";
import { rememberPersonalChoice } from "@/lib/systemChoice";
import { FD_MODULE_CONTENT, FD_MODULE_TITLES } from "./fdModuleContent";
import FDGlobalSearch from "@/components/os/apps/fd/FDGlobalSearch";

function WindowsLayer() {
  const { windows } = useTerminalWindows();
  return (
    <>
      {windows.map((win) => {
        const Content = FD_MODULE_CONTENT[win.kind];
        return (
          <TerminalWindow key={win.id} win={win}>
            {Content ? <Content /> : <div className="p-3 text-[#57534a] text-xs">Módulo no disponible.</div>}
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
    openWindow("fd-dashboard", { title: FD_MODULE_TITLES["fd-dashboard"], position: { x: 16, y: 16 }, size: { width: 380, height: 300 } });
    openWindow("fd-cad", { title: FD_MODULE_TITLES["fd-cad"], position: { x: 420, y: 16 }, size: { width: 560, height: 420 } });
    openWindow("fd-personnel", { title: FD_MODULE_TITLES["fd-personnel"], position: { x: 16, y: 340 }, size: { width: 380, height: 260 } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#1a1917 1px, transparent 1px), linear-gradient(90deg, #1a1917 1px, transparent 1px)", backgroundSize: "34px 34px" }}
      />
      <WindowsLayer />
    </div>
  );
}

/**
 * Escritorio de la terminal LSFD — espejo de TerminalDesktop.tsx con
 * identidad propia (FDSidebar/FDTopBar/fdModuleContent), reusando lo que
 * ya es agnóstico de departamento: TerminalFuncBar, TerminalWindow,
 * TerminalWindowProvider, InstitutionalTransition.
 */
export default function FDDesktop() {
  const department = useDepartment();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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
      <div className="h-full w-full flex flex-col bg-[#0a0a0c]">
        <FDTopBar />
        <div className="flex-1 flex min-h-0 relative">
          <FDSidebar />
          <DesktopWorkspace />
          {showSearch && <FDGlobalSearch onClose={() => setShowSearch(false)} />}
        </div>
        <FuncBarWithWindows onLogout={() => setLoggingOut(true)} onSearch={() => setShowSearch(true)} />
      </div>
    </TerminalWindowProvider>
  );
}

function FuncBarWithWindows({ onLogout, onSearch }: { onLogout: () => void; onSearch: () => void }) {
  const { openWindow } = useTerminalWindows();
  return (
    <TerminalFuncBar
      onSearch={onSearch}
      onDirectory={() => openWindow("fd-personnel", { title: FD_MODULE_TITLES["fd-personnel"], maximized: true, focusExisting: true })}
      onSettings={() => openWindow("fd-settings", { title: FD_MODULE_TITLES["fd-settings"], maximized: true, focusExisting: true })}
      onLogout={onLogout}
    />
  );
}

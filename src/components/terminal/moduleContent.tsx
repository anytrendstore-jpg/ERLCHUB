"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { MDTPersonsContent } from "@/components/os/apps/mdt/MDTPersons";
import { MDTVehiclesContent } from "@/components/os/apps/mdt/MDTVehicles";
import { MDTCasesContent } from "@/components/os/apps/mdt/MDTCases";
import { MDTWarrantsContent } from "@/components/os/apps/mdt/MDTWarrants";
import { MDTBOLOsContent } from "@/components/os/apps/mdt/MDTBOLOs";
import { MDTReportsContent } from "@/components/os/apps/mdt/MDTReports";
import { MDTCitationsContent } from "@/components/os/apps/mdt/MDTCitations";
import { MDTArrestsContent } from "@/components/os/apps/mdt/MDTArrests";
import { MDTEvidenceContent } from "@/components/os/apps/mdt/MDTEvidence";
import { MDTMessagesContent } from "@/components/os/apps/mdt/MDTMessages";
import { MDTMapContent } from "@/components/os/apps/mdt/MDTMap";
import { MDTStatsContent } from "@/components/os/apps/mdt/MDTStats";
import { MDTAuditContent } from "@/components/os/apps/mdt/MDTAudit";
import { MDTRadioContent } from "@/components/os/apps/mdt/MDTRadio";
import { MDTCADContent } from "@/components/os/apps/mdt/MDTCAD";

/**
 * Registro de contenidos de módulo completo para las ventanas del terminal.
 * Los módulos que en MDTLayout tenían un botón de acción en el header
 * (`actions`) recrean acá esa mini-barra — el resto de la pantalla la
 * provee TerminalTopBar/TerminalSidebar, así que no hace falta duplicar
 * el rail ni el título grande de MDTLayout.
 */
function withAction(label: string, Content: React.ComponentType<{ showNew: boolean; setShowNew: (v: boolean) => void }>, padded = true) {
  return function ModuleWithAction() {
    const [showNew, setShowNew] = useState(false);
    return (
      <div className="h-full flex flex-col">
        <div className="h-8 flex items-center justify-end px-2.5 border-b border-[#151d31] flex-shrink-0">
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[#6f93d6] hover:text-white transition-colors">
            <Plus className="w-3 h-3" /> {label}
          </button>
        </div>
        <div className={`flex-1 min-h-0 overflow-y-auto ${padded ? "p-3" : ""}`}>
          <Content showNew={showNew} setShowNew={setShowNew} />
        </div>
      </div>
    );
  };
}

function bare(Content: React.ComponentType, padded = true) {
  return function ModuleBare() {
    return <div className={`h-full overflow-y-auto ${padded ? "p-3" : ""}`}><Content /></div>;
  };
}

function bareFullBleed(Content: React.ComponentType) {
  return function ModuleFullBleed() {
    return <div className="h-full overflow-hidden"><Content /></div>;
  };
}

export const MODULE_TITLES: Record<string, string> = {
  cad: "CAD / Despacho",
  cases: "Casos",
  persons: "Personas",
  vehicles: "Vehículos",
  warrants: "Órdenes Judiciales",
  bolos: "BOLOs",
  reports: "Reportes",
  arrests: "Arrestos",
  citations: "Multas",
  evidence: "Evidencias",
  messages: "Mensajes",
  map: "Mapa Táctico",
  stats: "Estadísticas",
  audit: "Auditoría",
  radio: "Radio",
  files: "Archivos",
  admin: "Administración",
};

export const MODULE_CONTENT: Record<string, React.ComponentType> = {
  cad: bareFullBleed(MDTCADContent),
  cases: bare(MDTCasesContent),
  persons: withAction("Agregar", MDTPersonsContent as any),
  vehicles: withAction("Agregar", MDTVehiclesContent as any),
  warrants: withAction("Nueva orden", MDTWarrantsContent as any),
  bolos: withAction("Nuevo BOLO", MDTBOLOsContent as any),
  reports: withAction("Nuevo reporte", MDTReportsContent as any),
  arrests: withAction("Nuevo arresto", MDTArrestsContent as any),
  citations: withAction("Nueva multa", MDTCitationsContent as any),
  evidence: withAction("Nueva evidencia", MDTEvidenceContent as any),
  messages: withAction("Redactar", MDTMessagesContent as any),
  map: bareFullBleed(MDTMapContent),
  stats: bare(MDTStatsContent),
  audit: bare(MDTAuditContent),
  radio: bareFullBleed(MDTRadioContent),
};

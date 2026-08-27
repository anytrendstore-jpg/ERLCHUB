"use client";

import FDDashboardPanel from "./panels/FDDashboardPanel";
import FDPersonnelPanel from "./panels/FDPersonnelPanel";
import FDAlertsPanel from "./panels/FDAlertsPanel";
import AdminFactionPanel from "./panels/AdminFactionPanel";
import FDCAD from "@/components/os/apps/fd/FDCAD";
import FDReports from "@/components/os/apps/fd/FDReports";
import FDMessages from "@/components/os/apps/fd/FDMessages";
import FDIncidentCommand from "@/components/os/apps/fd/FDIncidentCommand";
import FDEquipment from "@/components/os/apps/fd/FDEquipment";
import RadioApp from "@/components/os/apps/RadioApp";

function bareFullBleed(Content: React.ComponentType) {
  return function ModuleFullBleed() {
    return <div className="h-full overflow-hidden"><Content /></div>;
  };
}

export const FD_MODULE_TITLES: Record<string, string> = {
  "fd-dashboard": "Dashboard",
  "fd-cad": "Despacho",
  "fd-radio": "Radio",
  "fd-alerts": "Alertas",
  "fd-command": "Comando de Incidentes",
  "fd-equipment": "Equipo",
  "fd-personnel": "Personal",
  "fd-reports": "Reportes",
  "fd-messages": "Mensajes",
  admin: "Administración",
};

/**
 * Registro de contenidos de módulo de la terminal LSFD — espejo de
 * moduleContent.tsx. "fd-radio" reusa <RadioApp/> sin modificar: ya es un
 * sistema de radio real, compartido entre facciones (canales Bomberos/
 * Paramédicos ya existen), la misma consola que usa LSPD — no tiene sentido
 * bifurcarlo en un radio "propio" de LSFD.
 */
export const FD_MODULE_CONTENT: Record<string, React.ComponentType> = {
  "fd-dashboard": bareFullBleed(FDDashboardPanel),
  "fd-cad": bareFullBleed(FDCAD),
  "fd-radio": bareFullBleed(RadioApp),
  "fd-alerts": bareFullBleed(FDAlertsPanel),
  "fd-command": bareFullBleed(FDIncidentCommand),
  "fd-equipment": bareFullBleed(FDEquipment),
  "fd-personnel": bareFullBleed(FDPersonnelPanel),
  "fd-reports": bareFullBleed(FDReports),
  "fd-messages": bareFullBleed(FDMessages),
  admin: AdminFactionPanel,
};

"use client";

import FDDashboardPanel from "./panels/FDDashboardPanel";
import FDPersonnelPanel from "./panels/FDPersonnelPanel";
import FDAlertsPanel from "./panels/FDAlertsPanel";
import AdminFactionPanel from "./panels/AdminFactionPanel";
import FDCAD from "@/components/os/apps/fd/FDCAD";
import FDReports from "@/components/os/apps/fd/FDReports";
import FDInvestigations from "@/components/os/apps/fd/FDInvestigations";
import FDMessages from "@/components/os/apps/fd/FDMessages";
import FDIncidentCommand from "@/components/os/apps/fd/FDIncidentCommand";
import FDMap from "@/components/os/apps/fd/FDMap";
import FDEquipment from "@/components/os/apps/fd/FDEquipment";
import FDPatients from "@/components/os/apps/fd/FDPatients";
import FDAcademy from "@/components/os/apps/fd/FDAcademy";
import FDAudit from "./panels/FDAudit";
import FDSettings from "./panels/FDSettings";
import FDStats from "./panels/FDStats";
import FDBudget from "@/components/os/apps/fd/FDBudget";
import FDServiceOrders from "@/components/os/apps/fd/FDServiceOrders";
import FDMutualAid from "@/components/os/apps/fd/FDMutualAid";
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
  "fd-map": "Mapa Operativo",
  "fd-patients": "Pacientes",
  "fd-equipment": "Equipo",
  "fd-academy": "Academia",
  "fd-personnel": "Personal",
  "fd-reports": "Reportes",
  "fd-investigations": "Investigaciones",
  "fd-messages": "Mensajes",
  "fd-budget": "Presupuesto",
  "fd-service-orders": "Órdenes de Servicio",
  "fd-mutual-aid": "Mutual Aid",
  "fd-stats": "Estadísticas",
  "fd-audit": "Auditoría",
  "fd-settings": "Configuración",
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
  "fd-map": bareFullBleed(FDMap),
  "fd-patients": bareFullBleed(FDPatients),
  "fd-equipment": bareFullBleed(FDEquipment),
  "fd-academy": bareFullBleed(FDAcademy),
  "fd-personnel": bareFullBleed(FDPersonnelPanel),
  "fd-reports": bareFullBleed(FDReports),
  "fd-investigations": bareFullBleed(FDInvestigations),
  "fd-messages": bareFullBleed(FDMessages),
  "fd-budget": bareFullBleed(FDBudget),
  "fd-service-orders": bareFullBleed(FDServiceOrders),
  "fd-mutual-aid": bareFullBleed(FDMutualAid),
  "fd-stats": bareFullBleed(FDStats),
  "fd-audit": bareFullBleed(FDAudit),
  "fd-settings": bareFullBleed(FDSettings),
  admin: AdminFactionPanel,
};

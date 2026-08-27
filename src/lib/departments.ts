/** Ícono resuelto en TerminalSidebar.tsx (nombre de componente de lucide-react). */
export type SidebarIconKey =
  | "LayoutDashboard" | "Radio" | "Users" | "Car" | "FileWarning" | "AlertTriangle"
  | "FileText" | "ShieldAlert" | "Receipt" | "Package" | "MessageSquare" | "Map"
  | "BarChart3" | "ScrollText" | "Briefcase" | "FolderOpen" | "Shield"
  | "Flame" | "Siren" | "Truck" | "GraduationCap" | "HeartPulse";

export interface SidebarModule {
  id: string;
  label: string;
  icon: SidebarIconKey;
  /** Nivel de clearance mínimo (ver src/lib/clearance.ts) para abrir este módulo. */
  minLevel: number;
  /** Qué contenido monta la ventana — ver el registro de paneles/contenidos en TerminalDesktop.tsx. */
  contentKind: string;
}

export interface DepartmentConfig {
  /** Slug de ruta: /terminal/[slug] */
  slug: string;
  /** Abreviación exacta de la facción en el panel de Staff (gate de acceso). */
  factionAbbreviation: string;
  name: string;
  subtitle: string;
  /** Ruta pública al escudo real (PNG con transparencia). */
  badge: string;
  /** Identificador de terminal mostrado en la franja técnica, ej. LS-04. */
  terminalKey: string;
  /** Directorio del terminal — solo módulos con contenido real (nada de entradas decorativas). */
  sidebarModules: SidebarModule[];
  /** Qué identidad/datos monta terminal/[dept]/page.tsx: MDT (policía) o FD (bomberos) — cada uno con su propio contexto y colecciones, sin compartir identidad de personal. */
  kind: "police" | "fire";
  /**
   * Color de acento del departamento (hex sólido) — usado por las piezas del
   * shell que SÍ se comparten entre departamentos (TerminalWindow,
   * TerminalFuncBar, AdminFactionPanel) vía la variable CSS --dept-accent
   * que arma terminal/[dept]/page.tsx. Tomado del escudo real de cada uno.
   */
  accentColor: string;
  /** Color de texto legible sobre accentColor sólido (blanco para el azul de LSPD, casi negro para el dorado de LSFD). */
  accentForeground: string;
  /**
   * Fondos neutros del marco de ventana (TerminalWindow.tsx) — sin esto el
   * chrome de las ventanas queda con el navy azulado de LSPD sin importar
   * el departamento, aunque el borde de acento ya varíe.
   */
  windowChrome: {
    titleActive: string;
    titleInactive: string;
    body: string;
    border: string;
    /** El tono más oscuro del shell (barra de funciones, spinners de carga). */
    deep: string;
  };
}

const LSPD_SIDEBAR: SidebarModule[] = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", minLevel: 1, contentKind: "dashboard-overview" },
  { id: "cad", label: "CAD / Despacho", icon: "Radio", minLevel: 1, contentKind: "cad" },
  { id: "cases", label: "Casos", icon: "Briefcase", minLevel: 1, contentKind: "cases" },
  { id: "persons", label: "Personas", icon: "Users", minLevel: 1, contentKind: "persons" },
  { id: "vehicles", label: "Vehículos", icon: "Car", minLevel: 1, contentKind: "vehicles" },
  { id: "warrants", label: "Órdenes", icon: "FileWarning", minLevel: 2, contentKind: "warrants" },
  { id: "bolos", label: "BOLOs", icon: "AlertTriangle", minLevel: 1, contentKind: "bolos" },
  { id: "reports", label: "Reportes", icon: "FileText", minLevel: 1, contentKind: "reports" },
  { id: "arrests", label: "Arrestos", icon: "ShieldAlert", minLevel: 1, contentKind: "arrests" },
  { id: "citations", label: "Multas", icon: "Receipt", minLevel: 1, contentKind: "citations" },
  { id: "evidence", label: "Evidencias", icon: "Package", minLevel: 2, contentKind: "evidence" },
  { id: "messages", label: "Mensajes", icon: "MessageSquare", minLevel: 1, contentKind: "messages" },
  { id: "map", label: "Mapa Táctico", icon: "Map", minLevel: 1, contentKind: "map" },
  { id: "stats", label: "Estadísticas", icon: "BarChart3", minLevel: 2, contentKind: "stats" },
  { id: "audit", label: "Auditoría", icon: "ScrollText", minLevel: 4, contentKind: "audit" },
  { id: "files", label: "Archivos", icon: "FolderOpen", minLevel: 1, contentKind: "files" },
  // Sin minLevel: el panel se auto-gatea por rango REAL dentro de la facción (no el rango del MDT).
  { id: "admin", label: "Administración", icon: "Shield", minLevel: 0, contentKind: "admin" },
];

const LSFD_SIDEBAR: SidebarModule[] = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", minLevel: 1, contentKind: "fd-dashboard" },
  { id: "cad", label: "Despacho", icon: "Siren", minLevel: 1, contentKind: "fd-cad" },
  { id: "radio", label: "Radio", icon: "Radio", minLevel: 1, contentKind: "fd-radio" },
  { id: "alerts", label: "Alertas", icon: "AlertTriangle", minLevel: 1, contentKind: "fd-alerts" },
  { id: "command", label: "Comando", icon: "Shield", minLevel: 1, contentKind: "fd-command" },
  { id: "map", label: "Mapa Operativo", icon: "Map", minLevel: 1, contentKind: "fd-map" },
  { id: "patients", label: "Pacientes", icon: "HeartPulse", minLevel: 1, contentKind: "fd-patients" },
  { id: "equipment", label: "Equipo", icon: "Truck", minLevel: 1, contentKind: "fd-equipment" },
  { id: "academy", label: "Academia", icon: "GraduationCap", minLevel: 1, contentKind: "fd-academy" },
  { id: "personnel", label: "Personal", icon: "Users", minLevel: 1, contentKind: "fd-personnel" },
  { id: "reports", label: "Reportes", icon: "FileText", minLevel: 1, contentKind: "fd-reports" },
  { id: "investigations", label: "Investigaciones", icon: "Briefcase", minLevel: 1, contentKind: "fd-investigations" },
  { id: "messages", label: "Mensajes", icon: "MessageSquare", minLevel: 1, contentKind: "fd-messages" },
  { id: "stats", label: "Estadísticas", icon: "BarChart3", minLevel: 2, contentKind: "fd-stats" },
  { id: "audit", label: "Auditoría", icon: "ScrollText", minLevel: 4, contentKind: "fd-audit" },
  // Sin minLevel: el panel se auto-gatea por rango REAL dentro de la facción (no un rango de terminal).
  { id: "admin", label: "Administración", icon: "Shield", minLevel: 0, contentKind: "admin" },
];

/**
 * Registro central de departamentos con terminal institucional propia.
 * Agregar uno nuevo de policía es: conseguir el escudo real, sumar una
 * entrada acá y crear la facción correspondiente en el panel de Staff —
 * nada de código nuevo, la ruta /terminal/[dept] y el MDT ya son genéricos.
 * Los departamentos `kind:"fire"` usan su propia identidad/colecciones
 * (ver src/contexts/FDContext.tsx, src/lib/fdServer.ts) — no comparten
 * `mdt_officers`/`OfficerRank` con la policía.
 */
export const DEPARTMENTS: Record<string, DepartmentConfig> = {
  lspd: {
    slug: "lspd",
    factionAbbreviation: "LSPD",
    name: "Los Santos Police Department",
    subtitle: "Davis",
    badge: "/LogoLSPD.png",
    terminalKey: "LS-04",
    sidebarModules: LSPD_SIDEBAR,
    kind: "police",
    accentColor: "#3c68c9",
    accentForeground: "#ffffff",
    windowChrome: { titleActive: "#1c2436", titleInactive: "#121a2e", body: "#0d1424", border: "#1e2a45", deep: "#080b13" },
  },
  lsfd: {
    slug: "lsfd",
    factionAbbreviation: "LSFD",
    name: "Los Santos Fire Department",
    subtitle: "Davis",
    badge: "/LogoLSFD.png",
    terminalKey: "LS-07",
    sidebarModules: LSFD_SIDEBAR,
    kind: "fire",
    accentColor: "#d4af37",
    accentForeground: "#0a0a0c",
    windowChrome: { titleActive: "#201f1c", titleInactive: "#161514", body: "#141312", border: "#2a2620", deep: "#0a0a0c" },
  },
};

export function getDepartment(slug: string): DepartmentConfig | null {
  return DEPARTMENTS[slug.toLowerCase()] || null;
}

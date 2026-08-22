/** Ícono resuelto en TerminalSidebar.tsx (nombre de componente de lucide-react). */
export type SidebarIconKey =
  | "LayoutDashboard" | "Radio" | "Users" | "Car" | "FileWarning" | "AlertTriangle"
  | "FileText" | "ShieldAlert" | "Receipt" | "Package" | "MessageSquare" | "Map"
  | "BarChart3" | "ScrollText" | "Briefcase" | "FolderOpen" | "Shield";

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

/**
 * Registro central de departamentos con terminal institucional propia.
 * Agregar uno nuevo es: conseguir el escudo real, sumar una entrada acá y
 * crear la facción correspondiente en el panel de Staff — nada de código
 * nuevo, la ruta /terminal/[dept] y el MDT ya son genéricos.
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
  },
};

export function getDepartment(slug: string): DepartmentConfig | null {
  return DEPARTMENTS[slug.toLowerCase()] || null;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Loader2, Lock, X, CheckCircle2, XCircle, Info, AlertTriangle, RotateCcw, ChevronLeft, ChevronRight, ArrowUpDown, type LucideIcon } from "lucide-react";

/**
 * Permisos efectivos de quien está usando el panel ahora mismo, según el
 * motor de permisos (`/api/staff/permissions/me`). Solo para decidir qué
 * mostrar en la UI — el backend vuelve a validar cada acción igual.
 */
export function useStaffPermissions() {
  const [state, setState] = useState<{ all: boolean; keys: string[] }>({ all: false, keys: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/staff/permissions/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setState({ all: data.permissions.includes("*"), keys: data.permissions });
      })
      .finally(() => setLoaded(true));
  }, []);

  return { has: (key: string) => state.all || state.keys.includes(key), loaded };
}

/** Bloques de UI compartidos por los paneles del panel de staff (tema azul/gris oscuro). */

/**
 * Escala tipográfica del Staff Panel — tres niveles, sin tamaños arbitrarios:
 *   PanelHeader  h1  text-xl  (20px)  título de la pantalla
 *   SectionTitle h2  text-base (16px) sección dentro de un panel
 *   CardTitle    h3  text-sm  (14px)  encabezado dentro de una Card
 * El cuerpo es text-sm y los datos auxiliares text-xs / text-[11px].
 */

export function PanelHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Sección dentro de un panel (por encima de una lista, grilla o Card). */
export function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-base font-semibold text-white ${className}`}>{children}</h2>;
}

/** Encabezado dentro de una Card — un escalón por debajo de `SectionTitle`. */
export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-sm font-semibold text-white ${className}`}>{children}</h3>;
}

export function Card({ children, className = "", hoverable = false, ...rest }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string; hoverable?: boolean }) {
  return (
    <div
      {...rest}
      className={`bg-gradient-to-b from-[#141D30] to-[#0F1523] border border-[#1F2937] rounded-xl shadow-[0_4px_20px_-8px_rgba(0,0,0,0.45)] transition-colors duration-200 hover:border-[#2A3752] ${
        hoverable ? "hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-8px_rgba(37,99,235,0.25)] transition-transform" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Resplandor de color a juego con el tono del icono (se deduce del nombre del color en `ring`).
const GLOW_BY_COLOR: Record<string, string> = {
  blue: "hover:shadow-[0_0_24px_-4px_rgba(59,130,246,0.35)] hover:border-blue-500/40",
  emerald: "hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.35)] hover:border-emerald-500/40",
  amber: "hover:shadow-[0_0_24px_-4px_rgba(245,158,11,0.35)] hover:border-amber-500/40",
  rose: "hover:shadow-[0_0_24px_-4px_rgba(244,63,94,0.35)] hover:border-rose-500/40",
  purple: "hover:shadow-[0_0_24px_-4px_rgba(168,85,247,0.35)] hover:border-purple-500/40",
  sky: "hover:shadow-[0_0_24px_-4px_rgba(14,165,233,0.35)] hover:border-sky-500/40",
};

const TINT_BY_COLOR: Record<string, string> = {
  blue: "hover:bg-blue-500/[0.025]", emerald: "hover:bg-emerald-500/[0.025]", amber: "hover:bg-amber-500/[0.025]",
  rose: "hover:bg-rose-500/[0.025]", purple: "hover:bg-purple-500/[0.025]", sky: "hover:bg-sky-500/[0.025]",
};

export function Kpi({ label, value, icon: Icon, tone, ring }: { label: string; value: number | string; icon: LucideIcon; tone: string; ring: string }) {
  const colorKey = Object.keys(GLOW_BY_COLOR).find((c) => ring.includes(c)) || "blue";
  return (
    <Card className={`p-4 transition-all duration-200 hover:-translate-y-0.5 ${GLOW_BY_COLOR[colorKey]} ${TINT_BY_COLOR[colorKey]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`relative w-9 h-9 rounded-lg ${ring} flex items-center justify-center ring-1 ring-white/10`}>
          <div className={`absolute inset-0 rounded-lg ${ring} blur-md opacity-60 -z-10`} aria-hidden="true" />
          <Icon className={`h-4 w-4 ${tone}`} />
        </div>
        <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </Card>
  );
}

export function LoadingBlock() {
  return (
    <div className="py-20 flex items-center justify-center">
      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
    </div>
  );
}

export function EmptyState({ icon: Icon, text, description }: { icon: LucideIcon; text: string; description?: string }) {
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#1B2436] to-[#151C2A] ring-1 ring-[#1F2937] shadow-[0_4px_16px_-6px_rgba(0,0,0,0.5)] flex items-center justify-center mx-auto mb-3.5">
        <Icon className="h-5 w-5 text-slate-600" />
      </div>
      <p className="text-slate-300 text-sm font-medium">{text}</p>
      {description && <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">{description}</p>}
    </div>
  );
}

export function AccessDenied({ title }: { title: string }) {
  return (
    <div>
      <PanelHeader title={title} />
      <Card className="p-16 text-center">
        <Lock className="h-10 w-10 text-slate-700 mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-1">Solo para Directores</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          El Menú de Economía requiere el rol de Director. Pídele a un Director que te
          añada a <code className="px-1 py-0.5 rounded bg-black/30 font-mono text-xs">STAFF_DIRECTOR_IDS</code>.
        </p>
      </Card>
    </div>
  );
}

export function ErrorBlock({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 ring-1 ring-rose-500/20 flex items-center justify-center mx-auto mb-3.5">
        <AlertTriangle className="h-5 w-5 text-rose-400" />
      </div>
      <p className="text-white text-sm font-semibold">No pudimos cargar esta información</p>
      <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#151C2A] hover:bg-[#1B2436] ring-1 ring-[#1F2937] text-slate-300 text-xs font-medium transition"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reintentar
        </button>
      )}
    </div>
  );
}

export function Chip({ tone, label }: { tone: "amber" | "blue" | "emerald" | "rose" | "orange" | "slate"; label: string }) {
  const map: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
    blue: "bg-blue-500/10 text-blue-300 ring-blue-500/30",
    emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
    rose: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
    orange: "bg-orange-500/10 text-orange-300 ring-orange-500/30",
    slate: "bg-slate-500/10 text-slate-300 ring-slate-500/30",
  };
  const dot: Record<string, string> = {
    amber: "bg-amber-400", blue: "bg-blue-400", emerald: "bg-emerald-400",
    rose: "bg-rose-400", orange: "bg-orange-400", slate: "bg-slate-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ring-1 shadow-sm ${map[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[tone]} shadow-[0_0_5px_currentColor]`} />
      {label}
    </span>
  );
}

export function PrimaryButton({ children, onClick, disabled, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="h-10 px-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all duration-150 hover:-translate-y-px active:translate-y-0"
    >
      {children}
    </button>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 px-3 bg-[#0B0F17] border border-[#1F2937] rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition ${props.className || ""}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`px-3 py-2 bg-[#0B0F17] border border-[#1F2937] rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-none ${props.className || ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 px-3 bg-[#0B0F17] border border-[#1F2937] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition ${props.className || ""}`}
    />
  );
}

export function formatDate(value?: string | Date) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ *
 * Design System — Fase 0 (ver propuesta). Todo lo de abajo es aditivo:
 * ningún componente existente cambia de firma, así que no hay pantalla
 * que se rompa por esto. `PrimaryButton` se mantiene tal cual (lo usan
 * decenas de paneles) — `Button` es la forma canónica para código nuevo
 * y para la migración progresiva de paneles existentes.
 * ------------------------------------------------------------------ */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-600/25",
  secondary: "bg-[#151C2A] hover:bg-[#1B2436] text-slate-300 ring-1 ring-[#1F2937]",
  ghost: "bg-transparent hover:bg-white/5 text-slate-400 hover:text-white",
  danger: "bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 ring-1 ring-rose-500/30",
  success: "bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/30",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  icon?: LucideIcon;
  loading?: boolean;
}

/** Botón canónico del Staff Panel — mismo radio/alto/tipografía/focus en las 5 variantes. */
export function Button({ variant = "primary", size = "md", icon: Icon, loading, disabled, className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm"} ${BUTTON_VARIANT_CLASS[variant]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  label: string;
}

/** Botón compacto solo-ícono. `label` es obligatorio (accesibilidad: se usa como aria-label). */
export function IconButton({ icon: Icon, variant = "secondary", size = "md", label, className = "", ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${size === "sm" ? "h-8 w-8" : "h-10 w-10"} ${BUTTON_VARIANT_CLASS[variant]} ${className}`}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </button>
  );
}

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const MODAL_WIDTH: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl",
};

/**
 * Modal canónico — reemplaza el `fixed inset-0 bg-black/60 ...` a mano que
 * hoy se repite en 15+ paneles. Cierra con Escape y con click en el overlay.
 */
export function Modal({ title, description, onClose, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-[3px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <Card className={`w-full ${MODAL_WIDTH[size]} max-h-[85vh] overflow-y-auto shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65),0_0_0_1px_rgba(59,130,246,0.08)] animate-in zoom-in-95 duration-150`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[#1F2937]">
          <div className="min-w-0">
            <h3 className="text-white font-semibold truncate">{title}</h3>
            {description && <p className="text-slate-500 text-xs mt-1">{description}</p>}
          </div>
          <IconButton icon={X} label="Cerrar" variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0" />
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-5 pb-5">{footer}</div>}
      </Card>
    </div>
  );
}

/** Modal de confirmación para acciones destructivas — variante lista de `Modal`. */
export function ConfirmModal({
  title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar", danger = true, loading, onConfirm, onClose,
}: {
  title: string; description: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; loading?: boolean;
  onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose} size="sm" footer={
      <>
        <Button variant="ghost" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>
    }>
      <p className="text-sm text-slate-400">{description}</p>
    </Modal>
  );
}

/* ---------------------- Toasts ---------------------- */

type ToastType = "success" | "error" | "info";
interface ToastItem { id: string; type: ToastType; message: string; }

const ToastContext = createContext<{ push: (type: ToastType, message: string) => void } | null>(null);

const TOAST_ICON: Record<ToastType, LucideIcon> = { success: CheckCircle2, error: XCircle, info: Info };
const TOAST_BORDER: Record<ToastType, string> = { success: "border-l-emerald-500", error: "border-l-rose-500", info: "border-l-sky-500" };
const TOAST_ICON_COLOR: Record<ToastType, string> = { success: "text-emerald-400", error: "text-rose-400", info: "text-sky-400" };

/** Envolvé el Staff Panel una vez con esto (ver `StaffDashboard.tsx`) para habilitar `useToast()` en cualquier panel hijo. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-xs pointer-events-none">
        {items.map((item) => {
          const Icon = TOAST_ICON[item.type];
          return (
            <div key={item.id} className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-lg bg-[#111827] border border-[#1F2937] border-l-2 shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200 ${TOAST_BORDER[item.type]}`}>
              <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${TOAST_ICON_COLOR[item.type]}`} />
              <p className="text-sm text-slate-200">{item.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** `const toast = useToast(); toast.success("Sanción aplicada"); toast.error("No se pudo guardar");` */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fuera de un <ToastProvider> (p. ej. mientras se migra un panel): no rompe, solo no muestra nada.
    return { success: () => {}, error: () => {}, info: () => {} };
  }
  return {
    success: (message: string) => ctx.push("success", message),
    error: (message: string) => ctx.push("error", message),
    info: (message: string) => ctx.push("info", message),
  };
}

/* ---------------------- Tabla ---------------------- */

export interface TableColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: (value: any, row: T) => React.ReactNode;
}

/** Tabla genérica — reemplaza el HTML `<table>` a mano y las grillas-de-cards usadas como tabla en distintos paneles. */
export function Table<T extends { id?: string }>({
  columns, rows, emptyIcon, emptyText, onRowClick,
}: {
  columns: TableColumn<T>[]; rows: T[]; emptyIcon?: LucideIcon; emptyText?: string; onRowClick?: (row: T) => void;
}) {
  if (rows.length === 0) {
    return emptyIcon ? <EmptyState icon={emptyIcon} text={emptyText || "Sin datos"} /> : <p className="text-slate-500 text-sm py-8 text-center">{emptyText || "Sin datos"}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1F2937] text-left text-[11px] uppercase tracking-wide text-slate-500">
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-3 font-medium whitespace-nowrap ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1F2937]">
          {rows.map((row: any, i) => (
            <tr key={row.id ?? i} onClick={() => onRowClick?.(row)} className={onRowClick ? "cursor-pointer hover:bg-white/[0.03] transition" : ""}>
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2.5 text-slate-300 whitespace-nowrap ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""}`}>
                  {c.format ? c.format(row[c.key], row) : (row[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------- Skeletons ---------------------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1F2937]/70 rounded-md ${className}`} />;
}

/** Placeholder de una tarjeta Kpi mientras carga — reemplaza el spinner centrado de página completa. */
export function SkeletonKpi() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="w-10 h-6" />
      </div>
      <Skeleton className="w-24 h-3" />
    </Card>
  );
}

/** Placeholder de una fila de lista (avatar + 2 líneas de texto) mientras carga. */
export function SkeletonRow() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-1/3 h-3.5" />
          <Skeleton className="w-1/2 h-3" />
        </div>
      </div>
    </Card>
  );
}

/* ---------------------- Tooltip ---------------------- */

/** Tooltip simple por hover — para íconos sin texto o abreviaturas. */
export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap px-2 py-1 rounded-md bg-[#1B2436] border border-[#1F2937] text-[11px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        {label}
      </span>
    </span>
  );
}

/* ---------------------- Paginación / orden ---------------------- */

/** Paginador compartido — se oculta solo cuando todo entra en una página. */
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-5">
      <IconButton icon={ChevronLeft} label="Página anterior" variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} />
      <span className="text-xs text-slate-500 tabular-nums">Página {page} de {totalPages}</span>
      <IconButton icon={ChevronRight} label="Página siguiente" variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)} />
    </div>
  );
}

/** Toggle simple más reciente / más antiguo — para listas ordenadas por fecha. */
export function SortToggle({ value, onChange }: { value: "newest" | "oldest"; onChange: (value: "newest" | "oldest") => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value === "newest" ? "oldest" : "newest")}
      className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#111827] text-slate-400 border border-[#1F2937] hover:text-white text-xs font-medium transition flex-shrink-0"
    >
      <ArrowUpDown className="h-3.5 w-3.5" /> {value === "newest" ? "Más reciente" : "Más antiguo"}
    </button>
  );
}

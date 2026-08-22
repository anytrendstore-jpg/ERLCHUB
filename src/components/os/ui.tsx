"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Loader2, X, CheckCircle2, XCircle, Info, type LucideIcon } from "lucide-react";

/**
 * Design System del Player Dashboard — kit compartido para todas las apps
 * del sistema operativo (equivalente a `staff/ui.tsx` del lado del Staff).
 *
 * No existía ningún archivo así antes de esta pasada: cada app definía sus
 * propios botones/cards/toasts con Tailwind suelto. Este archivo formaliza
 * lo que YA era el estándar de facto en la mayoría de las apps (`bg-white/5
 * border border-white/10 rounded-xl`, texto en escala de opacidad blanca,
 * `emerald`/`red`/`amber` para éxito/error/advertencia) en vez de inventar
 * algo nuevo.
 *
 * Acento: cada control "primary" usa `var(--os-accent)` por defecto — el
 * color que el jugador elige en Configuración — para que la personalización
 * de verdad se vea en todos lados. Una app puede pasar `accent="#22D3EE"`
 * (ej. Casino) para mantener su propia identidad puntual sin tocar el resto
 * del sistema de ventanas/toasts/controles, que siempre se comparte.
 */

const DEFAULT_ACCENT = "var(--os-accent, #3B82F6)";

/* ---------------------- Card ---------------------- */

export function Card({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }) {
  return (
    <div {...rest} className={`bg-white/5 border border-white/10 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

/** Card con el tratamiento "hero" translúcido usado por widgets destacados (saldo, resumen). */
export function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

/* ---------------------- Botones ---------------------- */

export type OSButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface OSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: OSButtonVariant;
  size?: "sm" | "md";
  icon?: LucideIcon;
  loading?: boolean;
  /** Color puntual para mantener identidad de app (ej. Casino cyan). Por defecto usa el acento del jugador. */
  accent?: string;
}

const OS_VARIANT_BASE: Record<Exclude<OSButtonVariant, "primary">, string> = {
  secondary: "bg-white/8 hover:bg-white/14 text-white border border-white/10",
  ghost: "bg-transparent hover:bg-white/8 text-white/60 hover:text-white",
  danger: "bg-red-500/15 hover:bg-red-500/25 text-red-400",
};

/** Botón canónico del Player Dashboard. `primary` toma `--os-accent` salvo que se pase `accent`. */
export function Button({ variant = "primary", size = "md", icon: Icon, loading, accent, disabled, className = "", children, style, ...rest }: OSButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={isPrimary ? { background: accent || DEFAULT_ACCENT, boxShadow: `0 8px 20px -8px ${accent || DEFAULT_ACCENT}`, ...style } : style}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm"} ${isPrimary ? "text-white" : OS_VARIANT_BASE[variant]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

interface OSIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  size?: "sm" | "md";
  label: string;
  active?: boolean;
}

export function IconButton({ icon: Icon, size = "md", label, active, className = "", ...rest }: OSIconButtonProps) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-lg transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${size === "sm" ? "h-8 w-8" : "h-10 w-10"} ${active ? "bg-white/15 text-white" : "bg-white/8 hover:bg-white/14 text-white/70 hover:text-white"} ${className}`}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </button>
  );
}

/* ---------------------- Badge / Chip ---------------------- */

export type OSBadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

const OS_BADGE_CLASS: Record<OSBadgeTone, string> = {
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  danger: "bg-red-500/15 text-red-400",
  info: "bg-blue-500/15 text-blue-400",
  neutral: "bg-white/10 text-white/60",
};

export function Badge({ tone, label }: { tone: OSBadgeTone; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${OS_BADGE_CLASS[tone]}`}>
      {label}
    </span>
  );
}

/* ---------------------- Tabs ---------------------- */

export function Tabs<T extends string>({ tabs, active, onChange, accent }: { tabs: { id: T; label: string }[]; active: T; onChange: (id: T) => void; accent?: string }) {
  return (
    <div className="inline-flex gap-0.5 bg-white/5 p-1 rounded-xl">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={active === t.id ? { background: accent || DEFAULT_ACCENT } : undefined}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${active === t.id ? "text-white" : "text-white/45 hover:text-white/80"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------- Modal ---------------------- */

interface OSModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const OS_MODAL_WIDTH: Record<NonNullable<OSModalProps["size"]>, string> = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" };

/** Modal canónico del OS — vidrio translúcido, coherente con el resto de la ventana. */
export function Modal({ title, description, onClose, children, footer, size = "md" }: OSModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${OS_MODAL_WIDTH[size]} max-h-[85vh] overflow-y-auto bg-[#0A0A0F]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-150`}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-white/10">
          <div className="min-w-0">
            <h3 className="text-white font-semibold truncate">{title}</h3>
            {description && <p className="text-white/40 text-xs mt-1">{description}</p>}
          </div>
          <IconButton icon={X} label="Cerrar" size="sm" onClick={onClose} className="flex-shrink-0" />
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-5 pb-5">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------------- Toasts ---------------------- */

type OSToastType = "success" | "error" | "info";
interface OSToastItem { id: string; type: OSToastType; message: string; }

const OSToastContext = createContext<{ push: (type: OSToastType, message: string) => void } | null>(null);

const OS_TOAST_ICON: Record<OSToastType, LucideIcon> = { success: CheckCircle2, error: XCircle, info: Info };
const OS_TOAST_BORDER: Record<OSToastType, string> = { success: "border-l-emerald-400", error: "border-l-red-400", info: "border-l-blue-400" };
const OS_TOAST_COLOR: Record<OSToastType, string> = { success: "text-emerald-400", error: "text-red-400", info: "text-blue-400" };

/**
 * Envolvé el árbol del OS una vez (en `OSDesktop.tsx`) para reemplazar los
 * ~4 mecanismos de toast distintos que hoy conviven (Hub Store, Casino,
 * Crypto Wallet, panel de notificaciones) por uno solo.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<OSToastItem[]>([]);

  const push = useCallback((type: OSToastType, message: string) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4000);
  }, []);

  return (
    <OSToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-16 right-4 z-[100] flex flex-col gap-2 w-full max-w-xs pointer-events-none">
        {items.map((item) => {
          const Icon = OS_TOAST_ICON[item.type];
          return (
            <div key={item.id} className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl bg-[#0A0A0F]/95 backdrop-blur-xl border border-white/10 border-l-2 shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200 ${OS_TOAST_BORDER[item.type]}`}>
              <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${OS_TOAST_COLOR[item.type]}`} />
              <p className="text-sm text-white/90">{item.message}</p>
            </div>
          );
        })}
      </div>
    </OSToastContext.Provider>
  );
}

/** `const toast = useToast(); toast.success("Transferencia enviada");` */
export function useToast() {
  const ctx = useContext(OSToastContext);
  if (!ctx) return { success: () => {}, error: () => {}, info: () => {} };
  return {
    success: (message: string) => ctx.push("success", message),
    error: (message: string) => ctx.push("error", message),
    info: (message: string) => ctx.push("info", message),
  };
}

/* ---------------------- Skeletons ---------------------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/8 rounded-lg ${className}`} />;
}

export function SkeletonRow() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-1/3 h-3.5" />
          <Skeleton className="w-1/2 h-3" />
        </div>
      </div>
    </Card>
  );
}

/* ---------------------- Tooltip ---------------------- */

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap px-2 py-1 rounded-lg bg-[#1a1a24] border border-white/10 text-[11px] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        {label}
      </span>
    </span>
  );
}

/* ---------------------- Empty state ---------------------- */

export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="py-16 text-center">
      <Icon className="h-10 w-10 text-white/20 mx-auto mb-3" />
      <h3 className="text-white/80 text-sm font-medium mb-1">{title}</h3>
      {text && <p className="text-white/40 text-xs max-w-xs mx-auto">{text}</p>}
    </div>
  );
}

export function formatDate(value?: string | Date) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

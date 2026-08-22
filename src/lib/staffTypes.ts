/** Tipos compartidos por los paneles del cliente del panel de staff. */

export type StaffSection =
  | "overview"
  | "players"
  | "sanctions"
  | "reports"
  | "logs"
  | "tickets"
  | "whitelist"
  | "stats"
  | "corporate"
  | "internal_affairs"
  | "shift"
  | "absences"
  | "directive_store"
  | "directive_coupons"
  | "directive_purchases"
  | "directive_referrals"
  | "directive_rankings"
  | "staff_list"
  | "directive_store_stats"
  | "factions_overview"
  | "factions_audit"
  | "factions_sanctions"
  | "economy_store"
  | "economy_tax"
  | "economy_salaries"
  | "economy_bank"
  | "economy_hubpay"
  | "economy_inventory"
  | "economy_vps"
  | "economy_crypto"
  | "economy_casino"
  | "economy_companies"
  | "economy_dealership"
  | "economy_weapons"
  | "economy_market"
  | "economy_balance"
  | "economy_illegal"
  | "economy_logs"
  | "economy_alerts"
  | "os_modules"
  | "social"
  | "hubcareer"
  | "permissions";

export interface StaffNavItem {
  id: StaffSection;
  label: string;
  icon: string;
  badgeKey?: "whitelistPending" | "ticketsOpen" | "reportsPending";
  /** Solo visible/usable para Directores (permisos jerárquicos). */
  directorOnly?: boolean;
}

export interface StaffNavGroup {
  title: string;
  items: StaffNavItem[];
}

export interface StaffIdentityView {
  id: string;
  name: string;
  avatar?: string;
  via: "discord" | "password";
}

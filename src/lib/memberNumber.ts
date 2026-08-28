/** Formato consistente para números secuenciales (staff, miembros de whitelist) en toda la web: #001, #002... */
export function formatMemberNumber(n: number): string {
  return `#${String(n).padStart(3, '0')}`;
}

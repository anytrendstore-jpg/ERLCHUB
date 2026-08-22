/**
 * Recuerda, solo para esta pestaña/sesión de navegador, que la cuenta eligió
 * quedarse en su escritorio personal — así no se le vuelve a preguntar en
 * cada carga de /dashboard, y volver desde la terminal (F6) no rebota de
 * nuevo hacia ella.
 */
const KEY = 'os_system_choice';

export function getStoredSystemChoice(): 'personal' | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(KEY) === 'personal' ? 'personal' : null;
}

export function rememberPersonalChoice(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KEY, 'personal');
}

export function clearSystemChoice(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(KEY);
}

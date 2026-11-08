/** Utilitaires de dates (format ISO local YYYY-MM-DD, sans décalage UTC). */

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Libellé court et humain d'une échéance + état (overdue/today/soon/later). */
export function describeDue(iso) {
  if (!iso) return null;
  const today = todayISO();
  if (iso < today) return { label: formatShort(iso), tone: 'overdue' };
  if (iso === today) return { label: "Aujourd'hui", tone: 'today' };
  if (iso === addDaysISO(1)) return { label: 'Demain', tone: 'soon' };
  return { label: formatShort(iso), tone: 'later' };
}

function formatShort(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatLongToday() {
  const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Bonne nuit';
  if (h < 18) return 'Bonjour';
  return 'Bonsoir';
}

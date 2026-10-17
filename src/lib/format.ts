// Formatage fr-FR (FCFA), identique au site.
const number = new Intl.NumberFormat('fr-FR');

export const money = (v: number | null | undefined) => (v == null ? '—' : `${number.format(v).replace(/ | /g, ' ')} FCFA`);

export const score = (v: number | null | undefined, digits = 2) =>
  v == null ? '—' : Number(v).toLocaleString('fr-FR', { maximumFractionDigits: digits });

export function date(v: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  if (!v) return '—';
  const d = new Date(v.length === 10 ? `${v}T12:00:00` : v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('fr-FR', opts);
}

export const longDate = (v: string | null | undefined) => date(v, { weekday: 'long', day: 'numeric', month: 'long' });

export function relative(v: string) {
  const d = new Date(v);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'à l’instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 7 * 86400) return `il y a ${Math.floor(diff / 86400)} j`;
  return date(v);
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

/** « ABCD-EF23-GH45 » pendant la saisie (alphabet sans 0/O, 1/I/L côté serveur). */
export function formatAccessCode(input: string) {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  return raw.match(/.{1,4}/g)?.join('-') ?? '';
}

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

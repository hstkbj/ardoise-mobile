/**
 * Identité Ardoise — mêmes jetons que le site (resources/css/app.css) :
 * un seul accent vert ardoise, des neutres chauds, des teintes pastel pour les états.
 */
export const colors = {
  brand50: '#F1F7F4',
  brand100: '#E7F0EC',
  brand200: '#C9DED6',
  brand300: '#9DB8AF',
  brand500: '#2D7A66',
  brand600: '#1D5C4D',
  brand700: '#174A3E',
  brand800: '#123F35',

  ink: '#15171C',
  body: '#3A3F48',
  muted: '#4F5560',
  subtle: '#6B7079',
  line: '#E4E4E0',
  lineSoft: '#ECECE8',
  lineStrong: '#D6D6D0',
  ground: '#F6F6F3',
  groundSoft: '#FAFAF8',
  white: '#FFFFFF',

  warn50: '#FBF1E4',
  warn700: '#8A4205',
  danger50: '#FBEAEA',
  danger600: '#A12B2B',
  info50: '#EEF0F6',
  info700: '#34426B',

  sun: '#F2B33D',
  sunSoft: '#FDF3DC',
  cream: '#FBF7EE',
  mint: '#EAF4EF',
  lavender: '#F0EEFA',
  sky: '#EAF2FB',
  blush: '#FBEFEC',
} as const;

/** Instrument Sans, comme le site (chargée dans app/_layout.tsx). */
export const fonts = {
  regular: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semibold: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

/** Statuts renvoyés par l'API → libellé et teinte (resources/js/config/statuses.js). */
export const STATUSES: Record<string, { label: string; tone: Tone }> = {
  paid: { label: 'Payé', tone: 'success' },
  partial: { label: 'Partiel', tone: 'warning' },
  pending: { label: 'En attente', tone: 'warning' },
  overdue: { label: 'En retard', tone: 'danger' },
  failed: { label: 'Échoué', tone: 'danger' },
  cancelled: { label: 'Annulé', tone: 'neutral' },
  published: { label: 'Disponible', tone: 'success' },
  upcoming: { label: 'À venir', tone: 'neutral' },
  withheld: { label: 'Retenu', tone: 'danger' },
  absent: { label: 'Absence', tone: 'danger' },
  late: { label: 'Retard', tone: 'warning' },
  justified: { label: 'Justifiée', tone: 'success' },
  unjustified: { label: 'À justifier', tone: 'warning' },
  done: { label: 'Fait', tone: 'success' },
  todo: { label: 'À faire', tone: 'info' },
};

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.brand100, fg: colors.brand700 },
  warning: { bg: colors.warn50, fg: colors.warn700 },
  danger: { bg: colors.danger50, fg: colors.danger600 },
  info: { bg: colors.info50, fg: colors.info700 },
  neutral: { bg: colors.ground, fg: colors.muted },
};

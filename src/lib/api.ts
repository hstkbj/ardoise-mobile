import type { Announcement, AppNotification, CheckoutResult, Child, Me, PaymentCheck, ReportCard, SchoolDocument, TimetableEntry } from './types';

/**
 * Client de l'API Laravel (/api/v1). L'adresse vient de EXPO_PUBLIC_API_URL
 * (fichier .env) : domaine central de la plateforme, ex. https://ardoise.app/api/v1.
 * Le jeton « t_{école}.{id}|{secret} » désigne l'école : aucun identifiant d'école n'est envoyé.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: () => void = () => {};

export function setApiToken(value: string | null) {
  token = value;
}
export function getApiToken() {
  return token;
}
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

const FALLBACK: Record<number, string> = {
  401: 'Votre session a expiré. Reconnectez-vous avec votre code.',
  403: 'Accès non autorisé.',
  404: 'Élément introuvable.',
  423: 'L’accès à l’établissement est suspendu. Contactez l’école.',
  429: 'Trop de tentatives. Patientez une minute avant de réessayer.',
};

export function authHeaders(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
        ...(headers as Record<string, string>),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError('Connexion au serveur impossible. Vérifiez votre connexion internet.', 0);
  }

  const body = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized();
    const errors = (body?.errors ?? {}) as Record<string, string[]>;
    const first = Object.values(errors)[0]?.[0];
    throw new ApiError((response.status === 422 && first) || body?.message || FALLBACK[response.status] || 'Une erreur est survenue. Réessayez.', response.status, errors);
  }

  return body as T;
}

const data = <T>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const api = {
  /** POST /parent/login — code d'accès remis par l'école */
  login: (code: string, deviceName: string) =>
    request<{ data: Me; token: string }>('/parent/login', { method: 'POST', json: { code, device_name: deviceName } }),
  me: () => data(request<{ data: Me }>('/auth/me')),
  logout: () => request('/auth/logout', { method: 'POST' }),

  children: () => data(request<{ data: Child[] }>('/parent/children')),
  reportCard: (studentId: number, termId: number) => data(request<{ data: ReportCard }>(`/report-cards/${studentId}?term_id=${termId}`)),
  timetable: (studentId: number) => data(request<{ data: TimetableEntry[] }>(`/parent/timetable?student_id=${studentId}`)),
  homeworkDone: (homeworkId: number, studentId: number, done: boolean) =>
    request<{ message: string }>(`/parent/homework/${homeworkId}/done`, { method: 'POST', json: { student_id: studentId, done } }),
  justify: (attendanceId: number, reason: string, file?: { uri: string; name: string; mimeType?: string; file?: File } | null) => {
    const form = new FormData();
    form.append('reason', reason);
    if (file) {
      // Web : objet File ; mobile : { uri, name, type } compris par fetch de React Native
      form.append('file', (file.file ?? { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' }) as unknown as Blob);
    }
    return request<{ message: string }>(`/parent/attendance/${attendanceId}/justify`, { method: 'POST', body: form });
  },

  checkout: (installmentId: number, payload: { method?: string; phone?: string | null; amount?: number }) =>
    data(request<{ data: CheckoutResult }>(`/parent/payments/${installmentId}/checkout`, { method: 'POST', json: payload })),
  verifyPayment: (reference: string) => data(request<{ data: PaymentCheck }>('/parent/payments/verify', { method: 'POST', json: { reference } })),

  announcements: () => data(request<{ data: Announcement[] }>('/parent/announcements')),
  documents: (studentId: number) => data(request<{ data: SchoolDocument[] }>(`/parent/documents?student_id=${studentId}`)),
  requestDocument: (studentId: number, type: string) =>
    request<{ message: string }>('/parent/document-requests', { method: 'POST', json: { student_id: studentId, type } }),

  notifications: (page = 1) =>
    request<{ data: AppNotification[]; meta: { current_page: number; last_page: number; unread: number } }>(`/notifications?page=${page}&per_page=30`),
  readNotification: (id: string) => request(`/notifications/${id}/read`, { method: 'POST' }),
  readAllNotifications: () => request('/notifications/read-all', { method: 'POST' }),

  updateProfile: (payload: { name: string; email: string | null; phone: string | null }) =>
    data(request<{ data: Me }>('/profile', { method: 'PUT', json: payload })),
};

/** Chemins des fichiers (PDF, reçus) téléchargés avec le jeton — voir lib/download.ts */
export const files = {
  reportCardPdf: (studentId: number, termId: number) => `/report-cards/${studentId}/pdf?term_id=${termId}`,
  receipt: (installmentId: number) => `/payments/${installmentId}/receipt`,
  document: (documentId: number) => `/documents/${documentId}/download`,
};

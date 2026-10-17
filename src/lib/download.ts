import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { API_URL, ApiError, authHeaders } from './api';

/**
 * Télécharge un fichier protégé (bulletin PDF, reçu, document) avec le jeton,
 * puis ouvre la feuille de partage du téléphone (enregistrer, imprimer, WhatsApp…).
 * Sur le web : téléchargement direct par le navigateur.
 */
export async function downloadAndShare(path: string, filename: string, mimeType = 'application/pdf') {
  const url = `${API_URL}${path}`;

  if (Platform.OS === 'web') {
    const response = await fetch(url, { headers: authHeaders() });
    if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
    const blob = await response.blob();
    const href = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), { href, download: filename });
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 2000);
    return;
  }

  const folder = new Directory(Paths.cache, 'ardoise');
  if (!folder.exists) folder.create({ intermediates: true });
  let uri: string;
  try {
    uri = (await File.downloadFileAsync(url, new File(folder, filename), { headers: authHeaders(), idempotent: true })).uri;
  } catch (e) {
    const status = Number(String((e as Error).message).match(/\b(4\d\d|5\d\d)\b/)?.[1] ?? 0);
    throw new ApiError(
      status === 403 ? 'Ce document n’est pas accessible. Rapprochez-vous de l’établissement.' : status === 404 ? 'Document pas encore disponible.' : 'Téléchargement impossible. Réessayez.',
      status,
    );
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: filename, UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined });
  }
}

async function errorMessage(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.message || (response.status === 403 ? 'Ce document n’est pas accessible.' : 'Téléchargement impossible.');
}

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Jeton de connexion : trousseau du téléphone (Keychain / Keystore).
 * Sur le web (aperçu de développement), stockage du navigateur.
 */
const KEY = 'ardoise.token';

export async function readToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(KEY);
}

export async function writeToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (token) globalThis.localStorage?.setItem(KEY, token);
      else globalThis.localStorage?.removeItem(KEY);
    } catch {
      /* navigation privée */
    }
    return;
  }
  if (token) await SecureStore.setItemAsync(KEY, token);
  else await SecureStore.deleteItemAsync(KEY);
}

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { readPushToken, writePushToken } from '@/lib/storage';

/**
 * Notifications push (notes, absences, bulletins, paiements, devoirs, annonces).
 *
 * Le téléphone obtient un jeton Expo, l'envoie au serveur (POST /parent/push-token) ; le serveur
 * passe par le service d'Expo, qui relaie vers Firebase (Android) et Apple (iOS) : la notification
 * s'affiche même application fermée. Ne fonctionne pas dans Expo Go : il faut une version EAS.
 */

// Application ouverte : la notification s'affiche quand même en bannière
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/** Écran à ouvrir selon le type de notification (même logique que l'écran Notifications). */
const ROUTES: Record<string, string> = {
  grade: '/notes',
  report_card: '/notes',
  attendance: '/absences',
  payment: '/paiements',
  homework: '/devoirs',
  announcement: '/annonces',
};

export function routeFor(type: unknown): string | null {
  return typeof type === 'string' ? (ROUTES[type] ?? null) : null;
}

/** Demande l'autorisation, récupère le jeton du téléphone et l'enregistre côté serveur. Sans effet sur le web ou un simulateur. */
export async function registerForPush(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notes, absences et annonces',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.brand600,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;

    // Identifiant du projet EAS (écrit dans app.json par « eas init »)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('Notifications push : lancez « eas init » pour renseigner extra.eas.projectId dans app.json.');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const saved = await readPushToken();
    await api.registerPushToken(token, Platform.OS, Device.modelName ?? undefined);
    if (saved !== token) await writePushToken(token);
    return token;
  } catch (e) {
    // Expo Go, pas de Google Play Services, réseau… : l'application fonctionne sans push
    console.warn('Notifications push indisponibles :', (e as Error).message);
    return null;
  }
}

/** À la déconnexion : ce téléphone ne reçoit plus les notifications de ce compte. */
export async function unregisterPush(): Promise<void> {
  const token = await readPushToken();
  if (!token) return;
  try {
    await api.deletePushToken(token);
  } catch {
    /* session déjà fermée côté serveur */
  }
  await writePushToken(null);
}

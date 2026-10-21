import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import { colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { readPushToken, writePushToken } from '@/lib/storage';

/**
 * Notifications push (notes, absences, bulletins, paiements, devoirs, annonces).
 *
 * Le téléphone obtient un jeton Expo, l'envoie au serveur (POST /parent/push-token) ; le serveur
 * passe par le service d'Expo, qui relaie vers Firebase (Android) et Apple (iOS) : la notification
 * s'affiche même application fermée.
 *
 * Expo Go (SDK 53+) n'embarque plus le module natif des notifications push : le simple import
 * d'expo-notifications y fait planter l'application. Le module n'est donc chargé que dans une
 * vraie version (build EAS, APK de test) ; dans Expo Go et sur le web, l'application fonctionne sans push.
 */

/** true dans l'application Expo Go */
export const IN_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let loaded: typeof NotificationsModule | null | undefined;

/** Module expo-notifications, ou null quand le push n'est pas disponible (Expo Go, web). */
export function notifications(): typeof NotificationsModule | null {
  if (loaded !== undefined) return loaded;
  if (Platform.OS === 'web' || IN_EXPO_GO) return (loaded = null);

  try {
    // Chargement à la demande : voir ci-dessus
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module: typeof NotificationsModule = require('expo-notifications');
    // Application ouverte : la notification s'affiche quand même en bannière
    module.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
    loaded = module;
  } catch (e) {
    console.warn('Notifications push indisponibles :', (e as Error).message);
    loaded = null;
  }

  return loaded;
}

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
  const Notifications = notifications();
  if (!Notifications || !Device.isDevice) return null;

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

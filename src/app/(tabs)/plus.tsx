import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { Alert, Platform, View } from 'react-native';

import type { IconName } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Badge, Card, Divider, Row } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { api } from '@/lib/api';
import { initials } from '@/lib/format';
import { useAuth } from '@/providers/auth';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout, hasFeature } = useAuth();
  const notifications = useQuery({ queryKey: ['notifications', 1], queryFn: () => api.notifications(1) });
  const unread = notifications.data?.meta.unread ?? 0;

  const items: { label: string; to: Href; icon: IconName; feature?: string; badge?: number }[] = [
    { label: 'Notifications', to: '/notifications', icon: 'bell', badge: unread },
    { label: 'Devoirs', to: '/devoirs', icon: 'list', feature: 'homework' },
    { label: 'Emploi du temps', to: '/emploi-du-temps', icon: 'clock', feature: 'timetable' },
    { label: 'Annonces de l’école', to: '/annonces', icon: 'megaphone' },
    { label: 'Documents', to: '/documents', icon: 'folder', feature: 'documents' },
  ];

  function confirmLogout() {
    const go = () => void logout();
    if (Platform.OS === 'web') return go();
    Alert.alert('Se déconnecter ?', 'Vous devrez saisir à nouveau votre code d’accès.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: go },
    ]);
  }

  return (
    <Screen title="Plus">
      <Card padded={false}>
        <Row
          title={user?.name ?? ''}
          subtitle={[user?.tenant?.name, user?.phone].filter(Boolean).join(' · ')}
          right={
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' }}>
              <Text weight="bold" color={colors.brand700}>
                {initials(user?.name)}
              </Text>
            </View>
          }
          onPress={() => router.push('/profil')}
          chevron
        />
      </Card>

      <Card padded={false}>
        {items
          .filter((i) => !i.feature || hasFeature(i.feature))
          .map((item, i) => (
            <View key={item.label}>
              {i > 0 && <Divider />}
              <Row icon={item.icon} title={item.label} right={item.badge ? <Badge label={String(item.badge)} tone="danger" /> : undefined} onPress={() => router.push(item.to)} chevron />
            </View>
          ))}
      </Card>

      <Card padded={false}>
        <Row icon="logout" iconBg={colors.danger50} iconColor={colors.danger600} title="Se déconnecter" onPress={confirmLogout} />
      </Card>

      <View style={{ alignItems: 'center', gap: space.xs, paddingTop: space.lg }}>
        <Logo size={24} />
        <Text variant="caption">Application parents · version 1.0</Text>
      </View>
    </Screen>
  );
}

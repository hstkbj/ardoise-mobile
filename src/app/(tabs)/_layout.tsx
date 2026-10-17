import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/providers/auth';

/** Onglets : les modules absents du plan de l'école (notes, absences, finances) sont masqués. */
function tabIcon(name: IconName) {
  return function TabIcon({ color }: { color: unknown }) {
    return <Icon name={name} size={22} color={String(color ?? colors.subtle)} />;
  };
}

export default function TabsLayout() {
  const { hasFeature } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand600,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 68 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6 },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="notes" options={{ title: 'Notes', tabBarIcon: tabIcon('file'), href: hasFeature('grades') ? undefined : null }} />
      <Tabs.Screen name="absences" options={{ title: 'Absences', tabBarIcon: tabIcon('check-circle'), href: hasFeature('attendance') ? undefined : null }} />
      <Tabs.Screen name="paiements" options={{ title: 'Paiements', tabBarIcon: tabIcon('wallet'), href: hasFeature('finance') ? undefined : null }} />
      <Tabs.Screen name="plus" options={{ title: 'Plus', tabBarIcon: tabIcon('grid') }} />
    </Tabs>
  );
}

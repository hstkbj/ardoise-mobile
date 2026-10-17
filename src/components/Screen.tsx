import { RefreshControl, ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@/constants/theme';
import { ChildSwitcher } from './ChildSwitcher';
import { Text } from './Text';

/**
 * Écran défilant avec « tirer pour actualiser ».
 * `title` : en-tête des onglets (titre + choix de l'enfant).
 */
export function Screen({
  title,
  subtitle,
  childSwitcher = false,
  refreshing = false,
  onRefresh,
  children,
  contentContainerStyle,
  ...props
}: ScrollViewProps & { title?: string; subtitle?: string; childSwitcher?: boolean; refreshing?: boolean; onRefresh?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      {...props}
      style={{ flex: 1, backgroundColor: colors.ground }}
      contentContainerStyle={[{ padding: space.lg, paddingTop: title ? insets.top + space.md : space.lg, paddingBottom: space.xxl * 2, gap: space.lg }, contentContainerStyle]}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand600} colors={[colors.brand600]} /> : undefined}
      keyboardShouldPersistTaps="handled">
      {title && (
        <View style={{ gap: space.md }}>
          <View>
            <Text variant="title" accessibilityRole="header">
              {title}
            </Text>
            {!!subtitle && <Text variant="small">{subtitle}</Text>}
          </View>
          {childSwitcher && <ChildSwitcher />}
        </View>
      )}
      {children}
    </ScrollView>
  );
}

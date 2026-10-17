import { Pressable, View } from 'react-native';

import { colors, radius, space } from '@/constants/theme';
import { Text } from './Text';

/** Tuile chiffre clé de l'accueil (fonds pastel du site : mint, blush, sky, sun). */
export function StatTile({ label, value, unit, detail, bg, onPress, basis = '47%' }: { label: string; value: string; unit?: string; detail?: string; bg: string; onPress?: () => void; basis?: `${number}%` }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label} : ${value}${unit ?? ''}${detail ? `, ${detail}` : ''}`}
      style={({ pressed }) => ({ flexBasis: basis, flexGrow: 1, backgroundColor: bg, borderRadius: radius.lg, padding: space.lg, opacity: pressed ? 0.85 : 1 })}>
      <Text variant="caption" color={colors.muted}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
        <Text variant="number" adjustsFontSizeToFit numberOfLines={1} style={value.length > 9 ? { fontSize: 19, lineHeight: 30 } : undefined}>
          {value}
        </Text>
        {!!unit && (
          <Text variant="small" color={colors.subtle}>
            {unit}
          </Text>
        )}
      </View>
      {!!detail && (
        <Text variant="caption" color={colors.brand700}>
          {detail}
        </Text>
      )}
    </Pressable>
  );
}

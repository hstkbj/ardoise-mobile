import { View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { score } from '@/lib/format';
import { Text } from './Text';

/** Évolution des notes (sur 20) : barres simples, seuil de 10 en pointillé, sous la moyenne en orange. */
export function BarChart({ items, max = 20, threshold = 10, height = 120 }: { items: { label: string; value: number }[]; max?: number; threshold?: number; height?: number }) {
  if (!items.length) return null;
  const last = items.slice(-8);
  return (
    <View accessibilityLabel={`Évolution des notes : ${last.map((i) => `${i.label} ${score(i.value, 1)}`).join(', ')}`}>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: (threshold / max) * height, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong }} />
        {last.map((item, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height }}>
            <Text variant="caption" color={colors.body} style={{ marginBottom: 2 }}>
              {score(item.value, 1)}
            </Text>
            <View
              style={{
                width: '70%',
                maxWidth: 28,
                height: Math.max(4, (Math.min(item.value, max) / max) * (height - 18)),
                borderRadius: radius.sm,
                backgroundColor: item.value < threshold ? colors.sun : colors.brand500,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        {last.map((item, i) => (
          <Text key={i} variant="caption" style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

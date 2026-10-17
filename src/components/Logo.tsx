import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/constants/theme';
import { Text } from './Text';

/** Logo Ardoise (resources/js/components/layout/BrandLogo.vue). `light` : version sur fond vert. */
export function Logo({ size = 32, light = false, withName = true }: { size?: number; light?: boolean; withName?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.32 }} accessibilityRole="image" accessibilityLabel="Ardoise">
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Rect width={32} height={32} rx={9} fill={light ? colors.white : colors.brand600} />
        <Path d="M9 22.5 15.2 9h1.6L23 22.5" fill="none" stroke={light ? colors.brand600 : colors.white} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M11.6 17.5h8.8" stroke={colors.sun} strokeWidth={2.4} strokeLinecap="round" />
      </Svg>
      {withName && (
        <Text weight="semibold" style={{ fontSize: size * 0.56, letterSpacing: -0.3, color: light ? colors.white : colors.ink }}>
          Ardoise
        </Text>
      )}
    </View>
  );
}

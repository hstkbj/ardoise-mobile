import { Text as RNText, type TextProps } from 'react-native';

import { colors, fonts } from '@/constants/theme';

type Variant = 'title' | 'heading' | 'body' | 'small' | 'caption' | 'number';

const VARIANTS: Record<Variant, { fontSize: number; lineHeight: number; color: string; weight: keyof typeof fonts }> = {
  title: { fontSize: 26, lineHeight: 32, color: colors.ink, weight: 'semibold' },
  heading: { fontSize: 17, lineHeight: 22, color: colors.ink, weight: 'semibold' },
  body: { fontSize: 15, lineHeight: 21, color: colors.body, weight: 'regular' },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted, weight: 'regular' },
  caption: { fontSize: 12, lineHeight: 16, color: colors.subtle, weight: 'medium' },
  number: { fontSize: 24, lineHeight: 30, color: colors.ink, weight: 'semibold' },
};

export function Text({ variant = 'body', weight, color, style, ...props }: TextProps & { variant?: Variant; weight?: keyof typeof fonts; color?: string }) {
  const v = VARIANTS[variant];
  return (
    <RNText
      {...props}
      maxFontSizeMultiplier={1.6}
      style={[
        { fontFamily: fonts[weight ?? v.weight], fontSize: v.fontSize, lineHeight: v.lineHeight, color: color ?? v.color },
        variant === 'number' && { fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
        style,
      ]}
    />
  );
}

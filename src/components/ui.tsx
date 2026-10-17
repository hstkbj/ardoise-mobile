import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type PressableProps, type TextInputProps, type ViewProps, type ViewStyle } from 'react-native';

import { colors, fonts, radius, space, STATUSES, TONES, type Tone } from '@/constants/theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** Carte blanche à bord fin, comme `.card` sur le site. */
export function Card({ style, padded = true, ...props }: ViewProps & { padded?: boolean }) {
  return <View {...props} style={[styles.card, padded && { padding: space.lg }, style]} />;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <Text variant="heading">{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link">
          <Text variant="small" weight="semibold" color={colors.brand600}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function Badge({ status, label, tone }: { status?: string; label?: string; tone?: Tone }) {
  const def = status ? STATUSES[status] : undefined;
  const t = TONES[tone ?? def?.tone ?? 'neutral'];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text variant="caption" weight="semibold" color={t.fg}>
        {label ?? def?.label ?? status}
      </Text>
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  icon,
  variant = 'primary',
  loading,
  disabled,
  size = 'md',
  style,
  ...props
}: PressableProps & { title: string; icon?: IconName; variant?: ButtonVariant; loading?: boolean; size?: 'sm' | 'md' | 'lg'; style?: ViewStyle }) {
  const palette = {
    primary: { bg: colors.brand600, fg: colors.white, border: colors.brand600 },
    secondary: { bg: colors.white, fg: colors.ink, border: colors.lineStrong },
    ghost: { bg: 'transparent', fg: colors.brand600, border: 'transparent' },
    danger: { bg: colors.danger600, fg: colors.white, border: colors.danger600 },
  }[variant];
  const height = { sm: 36, md: 46, lg: 54 }[size];
  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { height, backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}>
      {loading ? <ActivityIndicator color={palette.fg} /> : icon ? <Icon name={icon} size={18} color={palette.fg} /> : null}
      <Text weight="semibold" style={{ fontSize: size === 'sm' ? 13 : 15 }} color={palette.fg}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Field({ label, error, hint, style, ...props }: TextInputProps & { label: string; error?: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="small" weight="medium" color={colors.body}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.subtle}
        {...props}
        style={[styles.input, !!error && { borderColor: colors.danger600 }, style]}
        accessibilityLabel={label}
      />
      {error ? (
        <Text variant="small" color={colors.danger600}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption">{hint}</Text>
      ) : null}
    </View>
  );
}

/** Ligne de liste : icône ronde, titre, sous-titre, contenu à droite. */
export function Row({
  icon,
  iconBg = colors.brand50,
  iconColor = colors.brand600,
  title,
  subtitle,
  right,
  onPress,
  chevron,
}: {
  icon?: IconName;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string | null;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}) {
  const content = (
    <>
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={18} color={iconColor} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text weight="medium" color={colors.ink} numberOfLines={2}>
          {title}
        </Text>
        {!!subtitle && (
          <Text variant="small" numberOfLines={3}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
      {chevron && <Icon name="chevron-right" size={18} color={colors.subtle} />}
    </>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.groundSoft }]}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: space.lg }} />;
}

export function Banner({ tone = 'warning', icon = 'alert', title, children }: { tone?: Tone; icon?: IconName; title: string; children?: React.ReactNode }) {
  const t = TONES[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }]} accessibilityRole="alert">
      <Icon name={icon} size={18} color={t.fg} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="semibold" color={t.fg}>
          {title}
        </Text>
        {typeof children === 'string' ? (
          <Text variant="small" color={t.fg}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

export function EmptyState({ icon = 'info', title, text }: { icon?: IconName; title: string; text?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={22} color={colors.brand600} />
      </View>
      <Text weight="semibold" color={colors.ink} style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {!!text && (
        <Text variant="small" style={{ textAlign: 'center' }}>
          {text}
        </Text>
      )}
    </View>
  );
}

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.brand600} />
      <Text variant="small">{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.danger50 }]}>
        <Icon name="alert" size={22} color={colors.danger600} />
      </View>
      <Text style={{ textAlign: 'center' }}>{message}</Text>
      {onRetry && <Button title="Réessayer" variant="secondary" size="sm" onPress={onRetry} />}
    </View>
  );
}

export const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, overflow: 'hidden' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.lg },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.lg },
  empty: { alignItems: 'center', justifyContent: 'center', gap: space.md, paddingVertical: 40, paddingHorizontal: space.xl },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
});

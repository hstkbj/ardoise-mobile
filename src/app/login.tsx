import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { Text } from '@/components/Text';
import { Banner, Button } from '@/components/ui';
import { colors, fonts, radius, space } from '@/constants/theme';
import { formatAccessCode } from '@/lib/format';
import { useAuth } from '@/providers/auth';

/** Connexion par le code d'accès remis par l'établissement (12 caractères, ex. ABCD-EF23-GH45). */
export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const complete = code.replace(/-/g, '').length === 12;

  async function submit() {
    setError('');
    if (!complete) return setError('Le code d’accès comporte 12 caractères (ex. ABCD-EF23-GH45).');
    setLoading(true);
    try {
      await login(code);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.brand600 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Bandeau vert, comme la page de connexion du site */}
        <View style={{ paddingTop: insets.top + space.xxl, paddingHorizontal: space.xl, paddingBottom: space.xxl * 1.5, gap: space.xl }}>
          <Logo size={40} light />
          <Text style={{ fontFamily: fonts.semibold, fontSize: 28, lineHeight: 34, color: colors.white }}>
            Toute la vie de l’école,{' '}
            <Text style={{ fontFamily: fonts.semibold, fontSize: 28, lineHeight: 34 }} color={colors.sun}>
              dans votre poche.
            </Text>
          </Text>
          <Text color={colors.brand100}>Notes, absences, bulletins et paiements de vos enfants, en temps réel.</Text>
        </View>

        <View style={{ flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: space.xl, gap: space.lg, paddingBottom: insets.bottom + space.xl }}>
          <View>
            <Text variant="title">Connexion</Text>
            <Text variant="small">Espace parents</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.mint }}>
            <Icon name="key" size={18} color={colors.brand600} />
            <Text variant="small" color={colors.body} style={{ flex: 1 }}>
              Saisissez le <Text variant="small" weight="semibold" color={colors.ink}>code d’accès</Text> remis par l’établissement de votre enfant. Aucun mot de passe n’est nécessaire.
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text variant="small" weight="medium" color={colors.body} nativeID="code-label">
              Code d’accès
            </Text>
            <TextInput
              accessibilityLabelledBy="code-label"
              accessibilityLabel="Code d’accès"
              value={code}
              onChangeText={(v) => setCode(formatAccessCode(v))}
              placeholder="XXXX-XXXX-XXXX"
              placeholderTextColor={colors.lineStrong}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              returnKeyType="go"
              onSubmitEditing={submit}
              maxLength={14}
              style={{
                height: 60,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: error ? colors.danger600 : colors.lineStrong,
                backgroundColor: colors.white,
                textAlign: 'center',
                fontFamily: fonts.semibold,
                fontSize: 22,
                letterSpacing: 3,
                color: colors.ink,
              }}
            />
          </View>

          {!!error && <Banner tone="danger" title="Connexion impossible">{error}</Banner>}

          <Button title={loading ? 'Connexion…' : 'Se connecter'} size="lg" loading={loading} disabled={!complete} onPress={submit} />

          <Text variant="small" style={{ textAlign: 'center' }}>
            Code perdu ? Demandez-en un nouveau au secrétariat : l’ancien sera désactivé.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

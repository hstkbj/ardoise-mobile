import { useState } from 'react';
import { Alert } from 'react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button, Card, Field } from '@/components/ui';
import { space } from '@/constants/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth';

/** Coordonnées de contact du parent (utilisées par l'école pour les e-mails et SMS). */
export default function ProfileScreen() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    setErrors({});
    if (!name.trim()) return setErrors({ name: 'Le nom est obligatoire.' });
    setSaving(true);
    try {
      setUser(await api.updateProfile({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null }));
      Alert.alert('Profil', 'Vos coordonnées ont été mises à jour.');
    } catch (e) {
      const errs = (e as { errors?: Record<string, string[]> }).errors ?? {};
      setErrors(Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, v[0]])));
      if (!Object.keys(errs).length) Alert.alert('Profil', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Card style={{ gap: space.lg }}>
        <Field label="Nom complet" value={name} onChangeText={setName} error={errors.name} autoComplete="name" />
        <Field label="Téléphone" value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" hint="Utilisé par l’école pour les SMS importants." />
        <Field label="E-mail" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      </Card>
      <Button title="Enregistrer" loading={saving} onPress={save} />
      <Text variant="small">
        Vous vous connectez avec le code d’accès remis par l’établissement. En cas de perte, demandez-en un nouveau au secrétariat : l’ancien sera désactivé.
      </Text>
    </Screen>
  );
}

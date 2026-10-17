import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button, Card, Field } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { api } from '@/lib/api';
import { longDate } from '@/lib/format';
import { useChildren } from '@/providers/children';

const REASONS = ['Maladie', 'Rendez-vous médical', 'Raison familiale', 'Transport'];

/** Justifier une absence : motif + pièce jointe facultative (photo ou PDF, 5 Mo). */
export default function JustifyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { child } = useChildren();
  const record = child?.attendance.find((a) => String(a.id) === id);
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function pick() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'application/pdf'], copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 5 * 1024 * 1024) return setError('Fichier trop lourd : 5 Mo maximum.');
    setError('');
    setFile(asset);
  }

  async function submit() {
    if (!reason.trim()) return setError('Indiquez le motif de l’absence.');
    setSending(true);
    try {
      const out = await api.justify(Number(id), reason.trim(), file);
      await queryClient.invalidateQueries({ queryKey: ['children'] });
      Alert.alert('Absence justifiée', out.message || 'Le justificatif a été transmis au secrétariat.');
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen>
      {record && (
        <Card>
          <Text variant="caption">{child?.full_name}</Text>
          <Text variant="heading">
            {record.type === 'late' ? 'Retard' : 'Absence'} du {longDate(record.date)}
          </Text>
          {!!record.slot && <Text variant="small">Cours de {record.slot}</Text>}
        </Card>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {REASONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => setReason(r)}
            accessibilityRole="button"
            accessibilityState={{ selected: reason === r }}
            style={{ paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: reason === r ? colors.brand600 : colors.line, backgroundColor: reason === r ? colors.brand600 : colors.white }}>
            <Text variant="small" weight="medium" color={reason === r ? colors.white : colors.body}>
              {r}
            </Text>
          </Pressable>
        ))}
      </View>

      <Field label="Motif" value={reason} onChangeText={setReason} placeholder="Ex. fièvre, certificat médical joint" maxLength={255} multiline style={{ height: 96, paddingTop: space.md, textAlignVertical: 'top' }} />

      <Pressable onPress={pick} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, backgroundColor: colors.white }}>
        <Icon name="upload" color={colors.brand600} />
        <View style={{ flex: 1 }}>
          <Text weight="medium" color={colors.ink}>
            {file ? file.name : 'Joindre un justificatif'}
          </Text>
          <Text variant="caption">{file ? 'Touchez pour changer' : 'Photo ou PDF · facultatif · 5 Mo max.'}</Text>
        </View>
      </Pressable>

      {!!error && (
        <Text variant="small" color={colors.danger600}>
          {error}
        </Text>
      )}
      <Button title="Envoyer au secrétariat" icon="send" loading={sending} onPress={submit} />
    </Screen>
  );
}

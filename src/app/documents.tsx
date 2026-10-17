import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { ChildGate } from '@/components/Gate';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button, Card, Divider, EmptyState, ErrorState, Loading, Row, SectionTitle } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { api, files } from '@/lib/api';
import { downloadAndShare } from '@/lib/download';
import { date } from '@/lib/format';
import { useChildren } from '@/providers/children';

const REQUESTS = ['Certificat de scolarité', 'Attestation de fréquentation', 'Relevé de notes', 'Certificat de radiation'];

export default function DocumentsScreen() {
  return (
    <ChildGate>
      <Documents />
    </ChildGate>
  );
}

function Documents() {
  const { child } = useChildren();
  const query = useQuery({ queryKey: ['documents', child?.id], queryFn: () => api.documents(child!.id), enabled: !!child });
  const [downloading, setDownloading] = useState<number | null>(null);
  const [type, setType] = useState(REQUESTS[0]);
  const [sending, setSending] = useState(false);

  async function download(id: number, name: string, mime: string) {
    setDownloading(id);
    try {
      await downloadAndShare(files.document(id), name, mime);
    } catch (e) {
      Alert.alert('Document', (e as Error).message);
    } finally {
      setDownloading(null);
    }
  }

  async function request() {
    setSending(true);
    try {
      const out = await api.requestDocument(child!.id, type);
      Alert.alert('Demande envoyée', out.message || 'Le secrétariat a reçu votre demande.');
    } catch (e) {
      Alert.alert('Demande', (e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen childSwitcher refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : !query.data?.length ? (
        <Card>
          <EmptyState icon="folder" title="Aucun document" text="Certificats, attestations et documents de l’école apparaîtront ici." />
        </Card>
      ) : (
        <Card padded={false}>
          {query.data.map((d, i) => (
            <View key={d.id}>
              {i > 0 && <Divider />}
              <Row
                icon="file"
                title={d.name}
                subtitle={[d.category, d.size, date(d.uploaded_at)].filter(Boolean).join(' · ')}
                right={downloading === d.id ? <Text variant="caption">…</Text> : undefined}
                onPress={() => download(d.id, d.name, d.mime)}
                chevron
              />
            </View>
          ))}
        </Card>
      )}

      <View>
        <SectionTitle title="Demander un document" />
        <Card style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {REQUESTS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setType(r)}
                accessibilityRole="radio"
                accessibilityState={{ checked: type === r }}
                style={{ paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: type === r ? colors.brand600 : colors.line, backgroundColor: type === r ? colors.brand50 : colors.white }}>
                <Text variant="small" weight="medium" color={type === r ? colors.brand700 : colors.body}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button title="Envoyer la demande" icon="send" variant="secondary" loading={sending} onPress={request} />
        </Card>
      </View>
    </Screen>
  );
}

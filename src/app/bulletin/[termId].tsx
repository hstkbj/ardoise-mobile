import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button, Card, Divider, ErrorState, Loading } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { api, files } from '@/lib/api';
import { downloadAndShare } from '@/lib/download';
import { score } from '@/lib/format';
import { useChildren } from '@/providers/children';

/** Bulletin publié (GET /report-cards/{élève}?term_id=) + téléchargement du PDF. */
export default function ReportCardScreen() {
  const { termId } = useLocalSearchParams<{ termId: string }>();
  const { child } = useChildren();
  const [downloading, setDownloading] = useState(false);
  const query = useQuery({
    queryKey: ['report-card', child?.id, termId],
    queryFn: () => api.reportCard(child!.id, Number(termId)),
    enabled: !!child,
  });
  const card = query.data;

  async function download() {
    if (!child || !card) return;
    setDownloading(true);
    try {
      await downloadAndShare(files.reportCardPdf(child.id, card.term_id), `bulletin-${child.first_name}-${card.term}.pdf`.replace(/\s+/g, '-').toLowerCase());
    } catch (e) {
      Alert.alert('Bulletin', (e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Stack.Screen options={{ title: card ? `Bulletin · ${card.term}` : 'Bulletin' }} />
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState
          message={(query.error as { status?: number }).status === 403 ? 'Ce bulletin est retenu par l’établissement. Rapprochez-vous du secrétariat.' : query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : card ? (
        <>
          <Card style={{ gap: 4 }}>
            <Text variant="caption">
              {card.school} · {card.academic_year}
            </Text>
            <Text variant="heading">{card.student.full_name}</Text>
            <Text variant="small">
              {card.student.class_name} · matricule {card.student.matricule}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.lg, marginTop: space.md }}>
              <Stat label="Moyenne" value={`${score(card.general_average)}/20`} />
              {card.show_rank && card.rank != null && <Stat label="Rang" value={`${card.rank}/${card.class_size}`} />}
              <Stat label="Moy. classe" value={score(card.class_average)} />
            </View>
          </Card>

          <Card padded={false}>
            {card.subjects.map((s, i) => (
              <View key={s.name}>
                {i > 0 && <Divider />}
                <View style={{ padding: space.lg, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
                    <Text weight="semibold" color={colors.ink} style={{ flex: 1 }}>
                      {s.name}
                    </Text>
                    <Text weight="bold" color={s.average != null && s.average < 10 ? colors.warn700 : colors.ink}>
                      {score(s.average)}
                    </Text>
                  </View>
                  <Text variant="caption">
                    coef. {s.coefficient}
                    {s.class_average != null ? ` · moy. classe ${score(s.class_average)}` : ''}
                  </Text>
                  {!!s.appreciation && <Text variant="small">« {s.appreciation} »</Text>}
                </View>
              </View>
            ))}
          </Card>

          {(card.head_teacher_comment || card.council_decision) && (
            <Card style={{ gap: space.sm }}>
              {!!card.head_teacher_comment && (
                <>
                  <Text variant="caption">Appréciation du professeur principal</Text>
                  <Text>{card.head_teacher_comment}</Text>
                </>
              )}
              {!!card.council_decision && (
                <>
                  <Text variant="caption">Décision du conseil</Text>
                  <Text weight="semibold" color={colors.ink}>
                    {card.council_decision}
                  </Text>
                </>
              )}
            </Card>
          )}

          <Text variant="small">
            Absences : {card.absences} h · retards : {card.late}
          </Text>
          <Button title="Télécharger le PDF" icon="download" loading={downloading} onPress={download} />
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text variant="caption">{label}</Text>
      <Text weight="bold" color={colors.ink} style={{ fontSize: 18 }}>
        {value}
      </Text>
    </View>
  );
}

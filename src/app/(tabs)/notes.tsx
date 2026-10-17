import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { ChildGate } from '@/components/Gate';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Badge, Button, Card, Divider, Row, SectionTitle } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { files } from '@/lib/api';
import { downloadAndShare } from '@/lib/download';
import { date, money, score } from '@/lib/format';
import type { ReportCardEntry } from '@/lib/types';
import { useChildren } from '@/providers/children';

export default function NotesScreen() {
  return (
    <ChildGate title="Notes">
      <Notes />
    </ChildGate>
  );
}

function Notes() {
  const router = useRouter();
  const { child, refetch, isRefetching } = useChildren();
  const [downloading, setDownloading] = useState<number | null>(null);
  if (!child) return null;

  async function download(card: ReportCardEntry) {
    setDownloading(card.term_id);
    try {
      await downloadAndShare(files.reportCardPdf(child!.id, card.term_id), `bulletin-${child!.first_name}-${card.term}.pdf`.replace(/\s+/g, '-').toLowerCase());
    } catch (e) {
      Alert.alert('Bulletin', (e as Error).message);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Screen title="Notes" subtitle={child.term ? `Période en cours : ${child.term}` : undefined} childSwitcher refreshing={isRefetching} onRefresh={() => void refetch()}>
      {/* Moyenne générale */}
      <Card style={{ backgroundColor: colors.brand600, borderColor: colors.brand600 }}>
        <Text variant="caption" color={colors.brand100}>
          Moyenne générale
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ fontSize: 40, lineHeight: 48 }} weight="bold" color={colors.white}>
            {score(child.general_average)}
          </Text>
          <Text color={colors.brand200}>/20</Text>
        </View>
        {child.rank != null && (
          <Text variant="small" color={colors.brand100}>
            {child.rank}
            {child.rank === 1 ? 'er' : 'e'} sur {child.class_size} élèves · {child.class_name}
          </Text>
        )}
      </Card>

      {/* Bulletins : disponibles, à venir, ou retenus pour impayés */}
      <View>
        <SectionTitle title="Bulletins" />
        <Card padded={false}>
          {child.report_cards.length === 0 ? (
            <Text variant="small" style={{ padding: space.lg }}>
              Aucun bulletin pour cette année.
            </Text>
          ) : (
            child.report_cards.map((card, i) => (
              <View key={`${card.id}-${card.term_id}`}>
                {i > 0 && <Divider />}
                <View style={{ padding: space.lg, gap: space.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                    <View style={{ flex: 1 }}>
                      <Text weight="semibold" color={colors.ink}>
                        {card.term}
                      </Text>
                      <Text variant="small">
                        {card.status === 'published'
                          ? `Publié le ${date(card.published_at)}`
                          : card.status === 'withheld'
                            ? 'Publié, mais retenu par l’établissement'
                            : 'Pas encore publié'}
                      </Text>
                    </View>
                    <Badge status={card.status} />
                  </View>
                  {card.status === 'published' && (
                    <View style={{ flexDirection: 'row', gap: space.sm }}>
                      <Button
                        title="Consulter"
                        icon="eye"
                        variant="secondary"
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => router.push({ pathname: '/bulletin/[termId]', params: { termId: String(card.term_id) } })}
                      />
                      <Button title="Télécharger" icon="download" size="sm" style={{ flex: 1 }} loading={downloading === card.term_id} onPress={() => download(card)} />
                    </View>
                  )}
                  {card.status === 'withheld' && (
                    <View style={{ backgroundColor: colors.danger50, borderRadius: radius.md, padding: space.md }}>
                      <Text variant="small" color={colors.danger600}>
                        {child.finance_notice?.late_amount
                          ? `Le bulletin sera disponible après le règlement des ${money(child.finance_notice.late_amount)} en retard. `
                          : ''}
                        Rapprochez-vous de l’établissement.
                      </Text>
                      {!!child.finance_notice?.late_amount && (
                        <Button title="Régler maintenant" icon="wallet" size="sm" variant="danger" style={{ marginTop: space.sm }} onPress={() => router.push('/paiements')} />
                      )}
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>
      </View>

      {/* Moyennes par matière */}
      {child.subjects.length > 0 && (
        <View>
          <SectionTitle title="Par matière" />
          <Card padded={false}>
            {child.subjects.map((s, i) => (
              <View key={s.name}>
                {i > 0 && <Divider />}
                <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text weight="medium" color={colors.ink}>
                      {s.name}
                    </Text>
                    <Text weight="semibold" color={s.average != null && s.average < 10 ? colors.warn700 : colors.ink}>
                      {score(s.average)}
                    </Text>
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.ground }}>
                    <View
                      style={{
                        width: `${Math.min(100, ((s.average ?? 0) / 20) * 100)}%`,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: s.average != null && s.average < 10 ? colors.sun : colors.brand500,
                      }}
                    />
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Toutes les notes validées */}
      <View>
        <SectionTitle title="Toutes les notes" />
        <Card padded={false}>
          {child.grades.length === 0 ? (
            <Text variant="small" style={{ padding: space.lg }}>
              Aucune note publiée pour le moment.
            </Text>
          ) : (
            child.grades.map((g, i) => (
              <View key={g.id}>
                {i > 0 && <Divider />}
                <Row
                  title={`${g.subject} · ${g.title}`}
                  subtitle={[date(g.date), `coef. ${g.coefficient}`, g.class_average != null ? `moy. classe ${score(g.class_average)}` : null, g.comment].filter(Boolean).join(' · ')}
                  right={
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text weight="bold" color={g.score != null && g.score < g.max / 2 ? colors.warn700 : colors.ink}>
                        {g.score == null ? 'Abs.' : score(g.score)}
                      </Text>
                      <Text variant="caption">/{g.max}</Text>
                    </View>
                  }
                />
              </View>
            ))
          )}
        </Card>
      </View>
    </Screen>
  );
}

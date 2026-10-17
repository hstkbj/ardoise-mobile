import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { BarChart } from '@/components/BarChart';
import { ChildGate } from '@/components/Gate';
import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { StatTile } from '@/components/StatTile';
import { Text } from '@/components/Text';
import { Banner, Button, Card, Divider, Row, SectionTitle } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { api } from '@/lib/api';
import { latestReportCard, remainingDue, todoHomework } from '@/lib/child';
import { date, money, score } from '@/lib/format';
import { useAuth } from '@/providers/auth';
import { useChildren } from '@/providers/children';

export default function HomeScreen() {
  const { user, hasFeature } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <ChildGate title={`Bonjour ${firstName}`}>
      <Home firstName={firstName} hasFeature={hasFeature} school={user?.tenant?.name} />
    </ChildGate>
  );
}

function Home({ firstName, hasFeature, school }: { firstName: string; hasFeature: (f: string) => boolean; school?: string }) {
  const router = useRouter();
  const { child, refetch, isRefetching } = useChildren();
  const news = useQuery({ queryKey: ['announcements'], queryFn: api.announcements });
  if (!child) return null;

  const due = remainingDue(child);
  const homework = todoHomework(child);
  const card = latestReportCard(child);

  return (
    <Screen
      title={`Bonjour ${firstName}`}
      subtitle={school}
      childSwitcher
      refreshing={isRefetching}
      onRefresh={() => {
        void refetch();
        void news.refetch();
      }}>
      {child.finance_notice && (
        <Banner tone={child.finance_notice.blocked ? 'danger' : 'warning'} icon="wallet" title={child.finance_notice.blocked ? 'Accès aux bulletins suspendu' : 'Paiement en retard'}>
          {`${money(child.finance_notice.late_amount)} sont en retard de paiement.${child.finance_notice.blocked ? ' Les bulletins seront disponibles après régularisation.' : ''}`}
        </Banner>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {hasFeature('grades') && (
          <StatTile
            bg={colors.mint}
            label={`Moyenne · ${child.term ?? 'période'}`}
            value={score(child.general_average)}
            unit="/20"
            detail={child.rank ? `${child.rank}${child.rank === 1 ? 'er' : 'e'} sur ${child.class_size}` : undefined}
            onPress={() => router.push('/notes')}
          />
        )}
        {hasFeature('attendance') && (
          <StatTile bg={colors.blush} label="Absences" value={String(child.absences)} detail={`${child.late} retard(s)`} onPress={() => router.push('/absences')} />
        )}
        {hasFeature('homework') && <StatTile bg={colors.sky} label="Devoirs à faire" value={String(homework.length)} onPress={() => router.push('/devoirs')} />}
        {hasFeature('finance') && <StatTile bg={colors.sunSoft} label="Reste à payer" value={money(due)} onPress={() => router.push('/paiements')} />}
      </View>

      {hasFeature('grades') && card && (
        <Card padded={false}>
          <Row
            icon="file"
            title={`Bulletin · ${card.term}`}
            subtitle={card.status === 'withheld' ? 'Retenu : rapprochez-vous de l’établissement.' : 'Disponible à la consultation et au téléchargement.'}
            iconBg={card.status === 'withheld' ? colors.danger50 : colors.brand50}
            iconColor={card.status === 'withheld' ? colors.danger600 : colors.brand600}
            chevron={card.status === 'published'}
            onPress={card.status === 'published' ? () => router.push({ pathname: '/bulletin/[termId]', params: { termId: String(card.term_id) } }) : undefined}
          />
        </Card>
      )}

      {hasFeature('grades') && child.evolution.length > 0 && (
        <Card>
          <SectionTitle title="Évolution des notes" />
          <Text variant="caption" style={{ marginTop: -6, marginBottom: space.md }}>
            Notes ramenées sur 20
          </Text>
          <BarChart items={child.evolution} />
        </Card>
      )}

      {hasFeature('grades') && (
        <View>
          <SectionTitle title="Dernières notes" action="Tout voir" onAction={() => router.push('/notes')} />
          <Card padded={false}>
            {child.grades.length === 0 ? (
              <Text variant="small" style={{ padding: space.lg }}>
                Aucune note publiée pour le moment.
              </Text>
            ) : (
              child.grades.slice(0, 4).map((g, i) => (
                <View key={g.id}>
                  {i > 0 && <Divider />}
                  <Row
                    title={g.subject}
                    subtitle={`${g.title} · ${date(g.date)}`}
                    right={
                      <Text weight="semibold" color={colors.ink}>
                        {g.score == null ? 'Abs.' : score(g.score)}
                        <Text variant="caption">/{g.max}</Text>
                      </Text>
                    }
                  />
                </View>
              ))
            )}
          </Card>
        </View>
      )}

      {hasFeature('homework') && homework.length > 0 && (
        <View>
          <SectionTitle title="À faire" action="Devoirs" onAction={() => router.push('/devoirs')} />
          <Card padded={false}>
            {homework.slice(0, 3).map((h, i) => (
              <View key={h.id}>
                {i > 0 && <Divider />}
                <Row icon="list" iconBg={colors.sky} iconColor={colors.info700} title={[h.subject, h.title].filter(Boolean).join(' · ')} subtitle={`Pour le ${date(h.due)}`} />
              </View>
            ))}
          </Card>
        </View>
      )}

      <View>
        <SectionTitle title="Annonces de l’école" action="Toutes" onAction={() => router.push('/annonces')} />
        <Card padded={false}>
          {(news.data ?? []).length === 0 ? (
            <Text variant="small" style={{ padding: space.lg }}>
              {news.isLoading ? 'Chargement…' : 'Aucune annonce.'}
            </Text>
          ) : (
            (news.data ?? []).slice(0, 3).map((a, i) => (
              <View key={a.id}>
                {i > 0 && <Divider />}
                <Row icon="megaphone" title={a.title} subtitle={a.body} onPress={() => router.push('/annonces')} />
              </View>
            ))
          )}
        </Card>
      </View>

      {hasFeature('finance') && due > 0 && <Button title={`Payer la scolarité · ${money(due)}`} icon="wallet" onPress={() => router.push('/paiements')} />}

      <View style={{ alignItems: 'center', paddingTop: space.lg, opacity: 0.6 }}>
        <Logo size={20} />
      </View>
    </Screen>
  );
}

import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ChildGate } from '@/components/Gate';
import { Screen } from '@/components/Screen';
import { StatTile } from '@/components/StatTile';
import { Text } from '@/components/Text';
import { Badge, Button, Card, Divider, EmptyState, Row } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { unjustified } from '@/lib/child';
import { longDate } from '@/lib/format';
import { useChildren } from '@/providers/children';

export default function AbsencesScreen() {
  return (
    <ChildGate title="Absences">
      <Absences />
    </ChildGate>
  );
}

function Absences() {
  const router = useRouter();
  const { child, refetch, isRefetching } = useChildren();
  if (!child) return null;
  const toJustify = unjustified(child);

  return (
    <Screen title="Absences" subtitle="Présence en classe et retards" childSwitcher refreshing={isRefetching} onRefresh={() => void refetch()}>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatTile basis="30%" bg={colors.blush} label="Absences" value={String(child.absences)} />
        <StatTile basis="30%" bg={colors.sunSoft} label="Retards" value={String(child.late)} />
        <StatTile basis="30%" bg={toJustify.length ? colors.warn50 : colors.mint} label="À justifier" value={String(toJustify.length)} />
      </View>

      {child.attendance.length === 0 ? (
        <Card>
          <EmptyState icon="check-circle" title="Aucune absence" text={`${child.first_name} a été présent(e) à tous les cours enregistrés.`} />
        </Card>
      ) : (
        <Card padded={false}>
          {child.attendance.map((a, i) => (
            <View key={a.id}>
              {i > 0 && <Divider />}
              <Row
                icon={a.type === 'late' ? 'clock' : 'calendar'}
                iconBg={a.type === 'late' ? colors.sunSoft : colors.blush}
                iconColor={a.type === 'late' ? colors.warn700 : colors.danger600}
                title={`${a.type === 'late' ? 'Retard' : 'Absence'} · ${longDate(a.date)}`}
                subtitle={[a.slot && `cours de ${a.slot}`, a.minutes ? `${a.minutes} min` : null, a.reason ? `Motif : ${a.reason}` : null].filter(Boolean).join(' · ')}
                right={<Badge status={a.justified ? 'justified' : 'unjustified'} />}
                onPress={a.justified ? undefined : () => router.push({ pathname: '/justifier/[id]', params: { id: String(a.id) } })}
              />
            </View>
          ))}
        </Card>
      )}

      {toJustify.length > 0 && (
        <>
          <Text variant="small">Touchez une absence pour envoyer un motif (et un justificatif) au secrétariat.</Text>
          <Button title="Justifier la plus récente" icon="pencil" variant="secondary" onPress={() => router.push({ pathname: '/justifier/[id]', params: { id: String(toJustify[0].id) } })} />
        </>
      )}
    </Screen>
  );
}

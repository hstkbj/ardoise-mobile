import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ChildGate } from '@/components/Gate';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card, EmptyState, ErrorState, Loading } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { api } from '@/lib/api';
import { DAYS } from '@/lib/format';
import { useChildren } from '@/providers/children';

export default function TimetableScreen() {
  return (
    <ChildGate>
      <Timetable />
    </ChildGate>
  );
}

function Timetable() {
  const { child } = useChildren();
  const today = Math.min(5, Math.max(0, (new Date().getDay() + 6) % 7));
  const [day, setDay] = useState(today);
  const query = useQuery({ queryKey: ['timetable', child?.id], queryFn: () => api.timetable(child!.id), enabled: !!child });
  const entries = (query.data ?? []).filter((e) => e.day === day).sort((a, b) => a.start.localeCompare(b.start));

  return (
    <Screen childSwitcher refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} accessibilityRole="tablist">
        {DAYS.map((label, i) => (
          <Pressable
            key={label}
            onPress={() => setDay(i)}
            accessibilityRole="tab"
            accessibilityState={{ selected: day === i }}
            style={{ paddingHorizontal: space.lg, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: day === i ? colors.brand600 : colors.white, borderWidth: 1, borderColor: day === i ? colors.brand600 : colors.line }}>
            <Text variant="small" weight="semibold" color={day === i ? colors.white : colors.body}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState icon="calendar" title="Pas de cours" text={`Aucun cours prévu le ${DAYS[day].toLowerCase()}.`} />
        </Card>
      ) : (
        <View style={{ gap: space.sm }}>
          {entries.map((e) => (
            <Card key={e.id} style={{ flexDirection: 'row', gap: space.lg }}>
              <View style={{ width: 54 }}>
                <Text weight="bold" color={colors.ink}>
                  {e.start}
                </Text>
                <Text variant="caption">{e.end}</Text>
              </View>
              <View style={{ width: 3, borderRadius: 2, backgroundColor: colors.brand500 }} />
              <View style={{ flex: 1 }}>
                <Text weight="semibold" color={colors.ink}>
                  {e.subject ?? 'Cours'}
                </Text>
                <Text variant="small">{[e.teacher, e.room && `salle ${e.room}`].filter(Boolean).join(' · ')}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

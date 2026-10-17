import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pressable, View } from 'react-native';

import { ChildGate } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card, EmptyState, SectionTitle } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { api } from '@/lib/api';
import { longDate } from '@/lib/format';
import type { Child, Homework } from '@/lib/types';
import { useChildren } from '@/providers/children';

export default function HomeworkScreen() {
  return (
    <ChildGate>
      <HomeworkList />
    </ChildGate>
  );
}

function HomeworkList() {
  const queryClient = useQueryClient();
  const { child, refetch, isRefetching } = useChildren();

  // Coché / décoché tout de suite, puis enregistré (annulé en cas d'erreur)
  const toggle = useMutation({
    mutationFn: (h: Homework) => api.homeworkDone(h.id, child!.id, !h.done),
    onMutate: async (h) => {
      const previous = queryClient.getQueryData<Child[]>(['children']);
      queryClient.setQueryData<Child[]>(['children'], (list) =>
        list?.map((c) => (c.id === child!.id ? { ...c, homework: c.homework.map((x) => (x.id === h.id ? { ...x, done: !x.done } : x)) } : c)),
      );
      return { previous };
    },
    onError: (_e, _h, context) => queryClient.setQueryData(['children'], context?.previous),
  });

  if (!child) return null;
  const todo = child.homework.filter((h) => !h.done);
  const done = child.homework.filter((h) => h.done);

  return (
    <Screen childSwitcher refreshing={isRefetching} onRefresh={() => void refetch()}>
      {child.homework.length === 0 ? (
        <Card>
          <EmptyState icon="list" title="Aucun devoir" text="Les devoirs donnés par les enseignants apparaîtront ici." />
        </Card>
      ) : (
        [
          ['À faire', todo],
          ['Faits', done],
        ].map(([title, list]) =>
          (list as Homework[]).length ? (
            <View key={title as string}>
              <SectionTitle title={`${title} (${(list as Homework[]).length})`} />
              <View style={{ gap: space.sm }}>
                {(list as Homework[]).map((h) => (
                  <Card key={h.id} style={{ flexDirection: 'row', gap: space.md, opacity: h.done ? 0.7 : 1 }}>
                    <Pressable
                      onPress={() => toggle.mutate(h)}
                      hitSlop={10}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: h.done }}
                      accessibilityLabel={`Marquer « ${h.title} » comme ${h.done ? 'à faire' : 'fait'}`}
                      style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: h.done ? colors.brand600 : colors.lineStrong, backgroundColor: h.done ? colors.brand600 : colors.white, alignItems: 'center', justifyContent: 'center' }}>
                      {h.done && <Icon name="check" size={16} color={colors.white} strokeWidth={3} />}
                    </Pressable>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="caption" color={colors.brand600}>
                        {h.subject ?? 'Devoir'}
                      </Text>
                      <Text weight="semibold" color={colors.ink} style={h.done ? { textDecorationLine: 'line-through' } : undefined}>
                        {h.title}
                      </Text>
                      {!!h.instructions && <Text variant="small">{h.instructions}</Text>}
                      <Text variant="caption">Pour le {longDate(h.due)}</Text>
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          ) : null,
        )
      )}
    </Screen>
  );
}

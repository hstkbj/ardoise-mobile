import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { api } from '@/lib/api';
import { relative } from '@/lib/format';
import type { AppNotification } from '@/lib/types';

const ICONS: Record<string, IconName> = { grade: 'pencil', attendance: 'check-circle', payment: 'wallet', report_card: 'file', announcement: 'megaphone', homework: 'list' };
/** Lien du site → écran de l'application */
const ROUTES: Record<string, string> = { grade: '/notes', report_card: '/notes', attendance: '/absences', payment: '/paiements', homework: '/devoirs', announcement: '/annonces' };

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => api.notifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  const unread = query.data?.pages[0]?.meta.unread ?? 0;

  const readAll = useMutation({
    mutationFn: api.readAllNotifications,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  function open(n: AppNotification) {
    if (!n.read) void api.readNotification(n.id).then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }));
    const target = ROUTES[n.type];
    if (target) router.push(target as never);
  }

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.ground }}
      data={items}
      keyExtractor={(n) => n.id}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.brand600} />}
      onEndReached={() => query.hasNextPage && void query.fetchNextPage()}
      ListHeaderComponent={
        unread > 0 ? (
          <View style={{ padding: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="small">{unread} non lue(s)</Text>
            <Button title="Tout marquer comme lu" variant="ghost" size="sm" onPress={() => readAll.mutate()} />
          </View>
        ) : undefined
      }
      ListEmptyComponent={<EmptyState icon="bell" title="Aucune notification" text="Notes, absences, bulletins et paiements vous seront signalés ici." />}
      ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.lineSoft }} />}
      renderItem={({ item: n }) => (
        <Pressable onPress={() => open(n)} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', gap: space.md, padding: space.lg, backgroundColor: pressed ? colors.groundSoft : colors.white })}>
          <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: n.read ? colors.ground : colors.brand100 }}>
            <Icon name={ICONS[n.type] ?? 'bell'} size={17} color={n.read ? colors.subtle : colors.brand700} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
              <Text weight={n.read ? 'regular' : 'semibold'} color={colors.ink} style={{ flex: 1 }}>
                {n.title}
              </Text>
              <Text variant="caption">{relative(n.created_at)}</Text>
            </View>
            {!!n.body && <Text variant="small">{n.body}</Text>}
          </View>
          {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand600, marginTop: 6 }} />}
        </Pressable>
      )}
    />
  );
}

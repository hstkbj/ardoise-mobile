import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card, EmptyState, ErrorState, Loading } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { api } from '@/lib/api';
import { date } from '@/lib/format';

export default function AnnouncementsScreen() {
  const query = useQuery({ queryKey: ['announcements'], queryFn: api.announcements });

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : !query.data?.length ? (
        <Card>
          <EmptyState icon="megaphone" title="Aucune annonce" text="Les informations de l’école apparaîtront ici." />
        </Card>
      ) : (
        query.data.map((a) => (
          <Card key={a.id} style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
              <Text variant="caption" color={colors.brand600}>
                {a.audience}
              </Text>
              <Text variant="caption">{date(a.published_at)}</Text>
            </View>
            <Text variant="heading">{a.title}</Text>
            <Text>{a.body}</Text>
            <Text variant="caption">{a.author}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

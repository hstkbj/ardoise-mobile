import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { ChildGate } from '@/components/Gate';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Badge, Banner, Button, Card, EmptyState } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { files } from '@/lib/api';
import { isPayable, overdue, remainingDue } from '@/lib/child';
import { downloadAndShare } from '@/lib/download';
import { date, money } from '@/lib/format';
import type { FeeInstallment } from '@/lib/types';
import { useAuth } from '@/providers/auth';
import { useChildren } from '@/providers/children';

export default function PaymentsScreen() {
  return (
    <ChildGate title="Paiements">
      <Payments />
    </ChildGate>
  );
}

function Payments() {
  const router = useRouter();
  const { user } = useAuth();
  const { child, refetch, isRefetching } = useChildren();
  const [downloading, setDownloading] = useState<number | null>(null);
  if (!child) return null;

  const due = remainingDue(child);
  const late = overdue(child);
  const paid = child.payments.reduce((a, p) => a + Number(p.paid_amount), 0);
  const total = child.payments.reduce((a, p) => a + Number(p.amount), 0);

  async function receipt(p: FeeInstallment) {
    setDownloading(p.id);
    try {
      await downloadAndShare(files.receipt(p.id), `recu-${p.reference || p.id}.pdf`);
    } catch (e) {
      Alert.alert('Reçu', (e as Error).message);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Screen title="Paiements" subtitle="Scolarité et frais de l’année" childSwitcher refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Card style={{ backgroundColor: colors.brand600, borderColor: colors.brand600, gap: space.sm }}>
        <Text variant="caption" color={colors.brand100}>
          Reste à payer
        </Text>
        <Text style={{ fontSize: 32, lineHeight: 40 }} weight="bold" color={colors.white}>
          {money(due)}
        </Text>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.brand800 }}>
          <View style={{ width: `${total ? Math.min(100, (paid / total) * 100) : 0}%`, height: 8, borderRadius: 4, backgroundColor: colors.sun }} />
        </View>
        <Text variant="small" color={colors.brand100}>
          {money(paid)} réglés sur {money(total)}
        </Text>
      </Card>

      {late.length > 0 && (
        <Banner tone="danger" icon="clock" title={`${late.length} échéance(s) en retard`}>
          {`${money(late.reduce((a, p) => a + Number(p.remaining), 0))} à régulariser.${child.finance_notice?.blocked ? ' Les bulletins sont retenus jusqu’au règlement.' : ''}`}
        </Banner>
      )}

      {!user?.online_payment && due > 0 && (
        <Banner tone="info" icon="info" title="Paiement en ligne non activé">
          Votre demande de paiement sera transmise à la comptabilité, qui la confirmera à réception.
        </Banner>
      )}

      {child.payments.length === 0 ? (
        <Card>
          <EmptyState icon="wallet" title="Aucun frais" text="Aucune échéance n’est enregistrée pour cette année." />
        </Card>
      ) : (
        child.payments.map((p) => (
          <Card key={p.id} style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text weight="semibold" color={colors.ink}>
                  {p.fee_name}
                </Text>
                <Text variant="small">{p.status === 'paid' ? `Réglé le ${date(p.paid_at)}` : p.due_date ? `Échéance le ${date(p.due_date)}` : 'Sans échéance'}</Text>
              </View>
              <Badge status={p.status} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Amount label="Montant" value={money(p.amount)} />
              <Amount label="Payé" value={money(p.paid_amount)} />
              <Amount label="Reste" value={money(p.remaining)} strong={Number(p.remaining) > 0} />
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.ground }}>
              <View style={{ width: `${p.amount ? Math.min(100, (p.paid_amount / p.amount) * 100) : 0}%`, height: 6, borderRadius: 3, backgroundColor: p.status === 'overdue' ? colors.danger600 : colors.brand500 }} />
            </View>

            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {Number(p.paid_amount) > 0 && (
                <Button title="Reçu" icon="download" variant="secondary" size="sm" style={{ flex: 1 }} loading={downloading === p.id} onPress={() => receipt(p)} />
              )}
              {isPayable(p) && (
                <Button title={`Payer ${money(p.remaining)}`} icon="wallet" size="sm" style={{ flex: 2 }} onPress={() => router.push({ pathname: '/payer/[id]', params: { id: String(p.id) } })} />
              )}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

function Amount({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ borderRadius: radius.sm }}>
      <Text variant="caption">{label}</Text>
      <Text weight={strong ? 'bold' : 'medium'} color={strong ? colors.ink : colors.body} variant="small">
        {value}
      </Text>
    </View>
  );
}

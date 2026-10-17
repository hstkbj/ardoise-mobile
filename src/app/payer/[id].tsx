import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Banner, Button, Card, Field } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import type { PaymentCheck } from '@/lib/types';
import { useAuth } from '@/providers/auth';
import { useChildren } from '@/providers/children';

const METHODS: { value: string; label: string; icon: IconName; hint: string }[] = [
  { value: 'Mobile money', label: 'Mobile Money', icon: 'smartphone', hint: 'MTN, Moov, Orange, Wave…' },
  { value: 'Carte', label: 'Carte bancaire', icon: 'wallet', hint: 'Visa, Mastercard' },
];

type Step = { kind: 'form' } | { kind: 'checking'; reference: string } | { kind: 'result'; check?: PaymentCheck; message?: string };

/**
 * Paiement d'une échéance.
 *  - FedaPay activé par l'école : page de paiement sécurisée dans le navigateur, puis vérification.
 *  - Sinon : demande transmise à la comptabilité, avec les instructions de l'école.
 */
export default function PayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { child } = useChildren();
  const installment = child?.payments.find((p) => String(p.id) === id);
  const online = !!user?.online_payment;

  const [amount, setAmount] = useState(String(installment?.remaining ?? ''));
  const [method, setMethod] = useState(METHODS[0].value);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>({ kind: 'form' });

  if (!installment) {
    return (
      <Screen>
        <Banner tone="info" title="Échéance introuvable">Elle a peut-être déjà été réglée.</Banner>
      </Screen>
    );
  }

  const value = Number(amount.replace(/\D/g, ''));

  async function verify(reference: string) {
    setStep({ kind: 'checking', reference });
    try {
      const check = await api.verifyPayment(reference);
      setStep({ kind: 'result', check });
      await queryClient.invalidateQueries({ queryKey: ['children'] });
    } catch (e) {
      setStep({ kind: 'result', message: (e as Error).message });
    }
  }

  async function submit() {
    setError('');
    if (!value || value < 1) return setError('Indiquez un montant.');
    if (value > installment!.remaining) return setError(`Le montant ne peut pas dépasser ${money(installment!.remaining)}.`);
    setLoading(true);
    try {
      const out = await api.checkout(installment!.id, { method: online ? 'FedaPay' : method, phone: phone || null, amount: value });
      if (out.redirect_url) {
        // Page FedaPay sécurisée ; au retour (fermeture du navigateur), on vérifie le paiement
        await WebBrowser.openBrowserAsync(out.redirect_url, { toolbarColor: colors.brand600, controlsColor: colors.white, dismissButtonStyle: 'close' });
        await verify(out.reference);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['children'] });
        setStep({ kind: 'result', message: out.message ?? 'Votre demande de paiement a été transmise à l’établissement.' });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (step.kind === 'checking') {
    return (
      <Screen>
        <Card style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxl }}>
          <Icon name="refresh" size={28} color={colors.brand600} />
          <Text variant="heading">Vérification du paiement…</Text>
        </Card>
      </Screen>
    );
  }

  if (step.kind === 'result') {
    const status = step.check?.status;
    const ok = status === 'paid';
    const pending = status === 'pending' || (!step.check && !!step.message && !online);
    return (
      <Screen>
        <Card style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxl }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? colors.brand100 : pending ? colors.sunSoft : colors.danger50 }}>
            <Icon name={ok ? 'check' : pending ? 'clock' : 'alert'} size={30} color={ok ? colors.brand600 : pending ? colors.warn700 : colors.danger600} />
          </View>
          <Text variant="heading" style={{ textAlign: 'center' }}>
            {ok ? 'Paiement confirmé. Merci !' : pending ? 'Paiement en cours de confirmation' : 'Paiement non abouti'}
          </Text>
          <Text style={{ textAlign: 'center' }}>
            {step.message ??
              (ok
                ? `${money(step.check?.amount)} reçus. Le reçu est disponible dans Paiements.`
                : pending
                  ? 'La confirmation peut prendre quelques minutes. Vous recevrez une notification.'
                  : 'Le paiement a été refusé ou annulé. Aucun montant n’a été débité.')}
          </Text>
        </Card>
        {pending && step.check && <Button title="Vérifier à nouveau" icon="refresh" variant="secondary" onPress={() => verify(step.check!.reference)} />}
        {!ok && !pending && <Button title="Réessayer" variant="secondary" onPress={() => setStep({ kind: 'form' })} />}
        <Button title="Terminé" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={{ gap: 4 }}>
        <Text variant="caption">{child?.full_name}</Text>
        <Text variant="heading">{installment.fee_name}</Text>
        <Text variant="small">Reste à payer : {money(installment.remaining)}</Text>
      </Card>

      <Field
        label="Montant (FCFA)"
        value={amount}
        onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        hint="Vous pouvez payer en plusieurs fois."
        error={error && /montant/i.test(error) ? error : undefined}
      />

      {!online && (
        <View style={{ gap: space.sm }}>
          <Text variant="small" weight="medium" color={colors.body}>
            Moyen de paiement
          </Text>
          {METHODS.map((m) => (
            <Pressable
              key={m.value}
              onPress={() => setMethod(m.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: method === m.value }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1.5, borderColor: method === m.value ? colors.brand600 : colors.line, backgroundColor: method === m.value ? colors.brand50 : colors.white }}>
              <Icon name={m.icon} color={colors.brand600} />
              <View style={{ flex: 1 }}>
                <Text weight="semibold" color={colors.ink}>
                  {m.label}
                </Text>
                <Text variant="caption">{m.hint}</Text>
              </View>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: method === m.value ? colors.brand600 : colors.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
                {method === m.value && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand600 }} />}
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Field label="Téléphone Mobile Money" value={phone ?? ''} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+229 97 00 00 00" hint="Facultatif · pré-remplit la page de paiement." />

      {online ? (
        <Banner tone="success" icon="shield" title="Paiement sécurisé par FedaPay">
          Mobile Money ou carte bancaire. Vous serez redirigé vers la page de paiement, puis ramené dans l’application.
        </Banner>
      ) : (
        <Banner tone="info" icon="info" title="Confirmation par l’établissement">
          Votre demande est transmise à la comptabilité, qui confirmera le paiement à réception.
        </Banner>
      )}

      {!!error && !/montant/i.test(error) && (
        <Text variant="small" color={colors.danger600}>
          {error}
        </Text>
      )}
      <Button title={`Payer ${value ? money(value) : ''}`} icon="wallet" size="lg" loading={loading} onPress={submit} />
    </Screen>
  );
}

import type { ReactNode } from 'react';

import { useChildren } from '@/providers/children';
import { Screen } from './Screen';
import { EmptyState, ErrorState, Loading } from './ui';

/** Affiche chargement / erreur / « aucun enfant » avant le contenu d'un écran qui dépend de l'enfant choisi. */
export function ChildGate({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  const { child, isLoading, error, refetch, isRefetching } = useChildren();

  if (child) return <>{children}</>;

  return (
    <Screen title={title} subtitle={subtitle} refreshing={isRefetching} onRefresh={() => void refetch()}>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : (
        <EmptyState icon="users" title="Aucun enfant rattaché" text="Votre compte n’est lié à aucun élève. Rapprochez-vous du secrétariat de l’établissement." />
      )}
    </Screen>
  );
}

import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { api } from '@/lib/api';
import type { Child } from '@/lib/types';
import { useAuth } from './auth';

/**
 * Enfants du parent (/parent/children : notes, absences, devoirs, échéances,
 * bulletins de chacun) et enfant sélectionné, partagé par tous les écrans.
 */
interface ChildrenState {
  children: Child[];
  child: Child | null;
  selectChild: (id: number) => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  isRefetching: boolean;
}

const ChildrenContext = createContext<ChildrenState | null>(null);

export function ChildrenProvider({ children: content }: { children: ReactNode }) {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['children'], queryFn: api.children, enabled: !!user });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const list = useMemo(() => query.data ?? [], [query.data]);

  const value = useMemo<ChildrenState>(
    () => ({
      children: list,
      // Enfant choisi, ou le premier (aussi quand l'enfant choisi n'est plus rattaché)
      child: list.find((c) => c.id === selectedId) ?? list[0] ?? null,
      selectChild: setSelectedId,
      isLoading: query.isLoading,
      error: query.error,
      refetch: query.refetch,
      isRefetching: query.isRefetching,
    }),
    [list, selectedId, query.isLoading, query.error, query.refetch, query.isRefetching],
  );

  return <ChildrenContext.Provider value={value}>{content}</ChildrenContext.Provider>;
}

export function useChildren() {
  const ctx = useContext(ChildrenContext);
  if (!ctx) throw new Error('useChildren doit être utilisé dans <ChildrenProvider>');
  return ctx;
}

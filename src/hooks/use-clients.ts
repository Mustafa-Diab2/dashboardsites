'use client';

import { useSupabaseCollection } from '@/hooks/use-supabase-data';

export function useClients() {
  const { data: clients, isLoading } = useSupabaseCollection('clients');

  if (isLoading || !clients) {
    return [];
  }

  return clients;
}

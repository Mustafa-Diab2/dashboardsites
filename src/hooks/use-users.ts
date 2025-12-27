'use client';

import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection, useSupabaseDoc } from '@/hooks/use-supabase-data';
import { useCallback } from 'react';

export function useUsers(userRole: string | null | undefined) {
  const { user } = useSupabase();

  const shouldFetchAllUsers = userRole === 'admin';
  const shouldFetchOwnUser = user && userRole && userRole !== 'admin';

  const fetchUsers = useCallback((query: any) =>
    shouldFetchAllUsers ? query : query.eq('id', 'non-existent-id'),
    [shouldFetchAllUsers]);

  const { data: allUsers } = useSupabaseCollection(
    'profiles',
    fetchUsers
  );

  const { data: singleUser } = useSupabaseDoc(
    'profiles',
    shouldFetchOwnUser ? user?.id : null
  );

  if (userRole === 'admin') {
    return allUsers;
  }

  return singleUser ? [singleUser] : [];
}

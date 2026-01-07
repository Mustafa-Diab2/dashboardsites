'use client';

import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection, useSupabaseDoc } from '@/hooks/use-supabase-data';
import { useCallback } from 'react';

export function useUsers(userRole: string | null | undefined) {
  const { user } = useSupabase();

  const shouldFetchAllUsers = userRole === 'admin';

  // Use useMemo to stabilize the query function
  const fetchUsers = useCallback((query: any) => {
    if (shouldFetchAllUsers) {
      return query.order('full_name', { ascending: true });
    }
    // If not admin, return empty or dummy query for the collection part
    return query.eq('id', user?.id || '00000000-0000-0000-0000-000000000000');
  }, [shouldFetchAllUsers, user?.id]);

  const { data: allUsers, isLoading } = useSupabaseCollection(
    'profiles',
    fetchUsers
  );

  if (shouldFetchAllUsers) {
    return allUsers || [];
  }

  // For regular users, we can just filter the allUsers which would only contain them
  // or return the specific data
  return allUsers || [];
}

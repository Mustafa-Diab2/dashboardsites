'use client';

import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection, useSupabaseDoc } from '@/hooks/use-supabase-data';
import { useCallback, useEffect } from 'react';

export function useUsers(userRole: string | null | undefined) {
  const { user } = useSupabase();

  // Define who can see the team list
  const canSeeTeam = userRole === 'admin' || userRole === 'developer' || userRole === 'manager';

  const fetchUsers = useCallback((query: any) => {
    if (canSeeTeam) {
      // Just fetch all profiles, ordered by name
      return query.order('full_name', { ascending: true });
    }
    // Regular users: only fetch their own
    return query.eq('id', user?.id || '00000000-0000-0000-0000-000000000000');
  }, [canSeeTeam, user?.id]);

  const { data: allUsers, isLoading, error } = useSupabaseCollection(
    'profiles',
    fetchUsers
  );

  useEffect(() => {
    if (error) {
      console.error('TEAM FETCH ERROR:', error);
    }
    if (allUsers) {
      console.log(`TEAM DATA: Received ${allUsers.length} members for role: ${userRole}`);
    }
  }, [allUsers, error, userRole]);

  return allUsers || [];
}

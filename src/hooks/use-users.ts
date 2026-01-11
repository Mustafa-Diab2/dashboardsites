'use client';

import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection, useSupabaseDoc } from '@/hooks/use-supabase-data';
import { useCallback, useEffect, useRef } from 'react';

export function useUsers(userRole: string | null | undefined) {
  const { user } = useSupabase();

  // ✅ استخدام ref لتجنب إعادة إنشاء الدالة عند تغيير الـ role
  const userRoleRef = useRef(userRole);
  const userIdRef = useRef(user?.id);

  // ✅ تحديث الـ refs عند تغيير القيم
  useEffect(() => {
    userRoleRef.current = userRole;
    userIdRef.current = user?.id;
  }, [userRole, user?.id]);

  // Define who can see the team list
  const canSeeTeam = userRole === 'admin' || userRole === 'developer' || userRole === 'manager';

  // ✅ الدالة الآن stable ولن تتغير
  const fetchUsers = useCallback((query: any) => {
    const currentRole = userRoleRef.current;
    const currentUserId = userIdRef.current;
    const currentCanSee = currentRole === 'admin' || currentRole === 'developer' || currentRole === 'manager';

    if (currentCanSee) {
      // Just fetch all profiles, ordered by name
      return query.order('full_name', { ascending: true });
    }
    // Regular users: only fetch their own
    return query.eq('id', currentUserId || '00000000-0000-0000-0000-000000000000');
  }, []); // ✅ لا توجد dependencies - الدالة stable تماماً

  const { data: allUsers } = useSupabaseCollection(
    'profiles',
    fetchUsers
  );

  return allUsers || [];
}

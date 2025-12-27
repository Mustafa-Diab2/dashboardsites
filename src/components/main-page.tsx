'use client';

import { useCallback } from 'react';
import type { Task } from '@/lib/data';
import ReportsDashboard from '@/components/reports-dashboard';
import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection, useSupabaseDoc } from '@/hooks/use-supabase-data';
import { AuthCard } from '@/components/auth-card';

export default function MainPage() {
  const { user, isLoading: isAuthLoading, role } = useSupabase();

  const { data: userData, isLoading: isUserDocLoading } = useSupabaseDoc(
    'profiles',
    user?.id
  );

  // Prefer userData role because useSupabaseDoc uses real-time subscriptions
  const userRole = (userData as any)?.role || role;

  console.log('Current User Debug:', {
    id: user?.id,
    email: user?.email,
    contextRole: role,
    dbRole: (userData as any)?.role,
    finalRole: userRole
  });

  const fetchTasks = useCallback((query: any) => {
    if (!user) return query;
    if (userRole === 'admin') return query;
    return query.contains('assigned_to', [user.id]);
  }, [user, userRole]);

  const { data: tasks, isLoading: isTasksLoading } = useSupabaseCollection(
    'tasks',
    fetchTasks
  );

  // We only block the entire dashboard if auth is still loading.
  // Other data (tasks, profile) can load progressively.
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="flex flex-col items-center gap-6 max-w-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <div className="space-y-2">
            <p className="text-xl font-medium animate-pulse">Loading Identity...</p>
            <p className="text-sm text-muted-foreground">
              If this takes too long, your browser might be blocking storage or the connection is unstable.
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="text-xs text-muted-foreground underline hover:text-primary transition-colors"
          >
            Clear Browser Cache & Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthCard />;
  }

  const taskData: Task[] = (tasks as Task[]) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ReportsDashboard tasks={taskData} userRole={userRole} />
    </div>
  );
}

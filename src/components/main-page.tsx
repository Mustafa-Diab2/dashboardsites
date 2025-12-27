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

  const userRole = role || (userData as any)?.role;

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Loading Identity...</p>
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

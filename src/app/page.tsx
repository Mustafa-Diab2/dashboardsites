'use client';

import type { Task, User } from '@/lib/data';
import { useEffect, useState } from 'react';
import ReportsDashboard from '@/components/reports-dashboard';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { AuthCard } from '@/components/auth-card';
import { useUsers } from '@/hooks/use-users';

export default function Home() {
  const { user, isUserLoading } = useFirebase();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userRole = useUsers(user?.uid)?.find(u => u.id === user?.uid)?.role;

  const tasksQuery = useMemoFirebase(
    () => {
      if (!user) return null;
      if (userRole === 'admin') {
        return query(collection(user.firestore, 'tasks'));
      }
      return query(
        collection(user.firestore, 'tasks'),
        where('assigned_to', 'array-contains', user.uid)
      );
    },
    [user, userRole]
  );
  
  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  if (!isMounted || isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthCard />;
  }
  
  if (isTasksLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Loading Dashboard...</p>
        </div>
    )
  }

  return <ReportsDashboard tasks={tasks as Task[]} userRole={userRole} />;
}

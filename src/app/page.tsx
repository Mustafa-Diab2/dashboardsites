'use client';

import { useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, where } from 'firebase/firestore';
import { AuthCard } from '@/components/auth-card';
import type { Task } from '@/lib/data';
import ReportsDashboard from '@/components/reports-dashboard';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const { firestore, user, isUserLoading } = useFirebase();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);
  const userRole = (userData as any)?.role;

  const tasksQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      if (userRole === 'admin') {
        return query(collection(firestore, 'tasks'));
      }
      return query(
        collection(firestore, 'tasks'),
        where('assigned_to', 'array-contains', user.uid)
      );
    },
    [firestore, user, userRole]
  );

  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  const isLoading =
    !isMounted || isUserLoading || isUserDocLoading || (user && isTasksLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading...</p>
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

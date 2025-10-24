'use client';

import ReportsDashboard from '@/components/reports-dashboard';
import { useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, where } from 'firebase/firestore';
import { AuthCard } from '@/components/auth-card';
import type { Task } from '@/lib/data';

export default function Home() {
  const { firestore, user, isUserLoading } = useFirebase();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);
  const userRole = (userData as any)?.role || 'frontend';


  const tasksQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      // Admins see all tasks. The dashboard will handle the view logic.
      if ((userData as any)?.role === 'admin') {
        return query(collection(firestore, 'tasks'));
      }
      // Regular users only query for their own tasks.
      return query(collection(firestore, 'tasks'), where('assigneeId', '==', user.uid));
    },
    [firestore, user, userData]
  );

  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  const isLoading = isUserLoading || isUserDocLoading || (user && isTasksLoading);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthCard />;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  const taskData: Task[] = (tasks as Task[]) || [];
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-headline font-bold tracking-tight">
            Xfuse Sites
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            An overview of your team's performance and task distribution.
          </p>
        </div>
      </header>
      <main>
        <ReportsDashboard tasks={taskData} userRole={userRole} />
      </main>
    </div>
  );
}

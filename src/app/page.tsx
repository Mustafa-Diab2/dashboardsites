'use client';

import ReportsDashboard from '@/components/reports-dashboard';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { AuthCard } from '@/components/auth-card';
import { mockTasks } from '@/lib/data';

export default function Home() {
  const { firestore, user, isUserLoading } = useFirebase();

  const tasksQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'tasks')) : null),
    [firestore]
  );
  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  if (isUserLoading || (tasks === null && isTasksLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthCard />;
  }
  
  // In a real app, you would fetch this data from a database like Firestore.
  const taskData = tasks || mockTasks;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-headline font-bold tracking-tight">
            TaskWise Reports
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            An overview of your team's performance and task distribution.
          </p>
        </div>
      </header>
      <main>
        <ReportsDashboard tasks={taskData} />
      </main>
    </div>
  );
}

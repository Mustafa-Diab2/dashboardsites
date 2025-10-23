import ReportsDashboard from '@/components/reports-dashboard';
import { mockTasks } from '@/lib/data';

export default function Home() {
  // In a real app, you would fetch this data from a database like Firestore.
  const tasks = mockTasks;

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
        <ReportsDashboard tasks={tasks} />
      </main>
    </div>
  );
}

'use client';

import type { Task } from '@/lib/data';
import { useMemo, useState } from 'react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from './ui/button';
import { FileDown, Plus, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MemberTasksBarChart } from './charts/member-tasks-bar-chart';
import { CompletionRatioPieChart } from './charts/completion-ratio-pie-chart';
import { DetailedBreakdownTable } from './detailed-breakdown-table';
import AIInsights from './ai-insights';
import { TaskForm } from './task-form';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query } from 'firebase/firestore';
import Attendance from './attendance';
import AttendanceAdmin from './attendance-admin';
import Courses from './courses';
import MyTasks from './my-tasks';
import { useLanguage } from '@/context/language-context';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';


export type UserReport = {
  name: string;
  total: number;
  backlog: number;
  in_progress: number;
  review: number;
  done: number;
};

export default function ReportsDashboard({ tasks, userRole }: { tasks: Task[], userRole: string }) {
  const [isTaskFormOpen, setTaskFormOpen] = useState(false);
  const { auth, firestore, user } = useFirebase();
  const { t } = useLanguage();

  // Query all users for filter
  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  const { data: users } = useCollection(usersQuery);


  const byUser = useMemo(() => {
    const nameOf = (uid?: string) => {
      if (!uid) return 'Unassigned';
      // If users aren't loaded yet, just return the ID.
      if (!users) return uid;
      const found = users?.find(m => m.id === uid);
      return found ? `${(found as any).fullName}` : uid;
    };
    const map = new Map<string, UserReport>();
    tasks.forEach(t => {
      const key = t.assigneeId || 'unassigned';
      if (!map.has(key)) map.set(key, { name: nameOf(t.assigneeId), total: 0, backlog: 0, in_progress: 0, review: 0, done: 0 });
      const rec = map.get(key)!;
      rec.total++;
      (rec as any)[t.status]++;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [tasks, users]);

  const exportCSV = () => {
    const ws = utils.json_to_sheet(byUser);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Report');
    writeFile(wb, 'TeamReport.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Team Task Report', 14, 16);
    const tableData = byUser.map(u => [u.name, u.total, u.backlog, u.in_progress, u.review, u.done]);
    (doc as any).autoTable({
      head: [['Member', 'Total', 'Backlog', 'In Progress', 'Review', 'Done']],
      body: tableData,
      startY: 22,
    });
    doc.save('TeamReport.pdf');
  };

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  const isAdmin = userRole === 'admin';

  return (
    <>
      <TaskForm isOpen={isTaskFormOpen} onOpenChange={setTaskFormOpen} />
      <div className="max-w-7xl mx-auto px-4 pb-10 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-2xl font-headline">{isAdmin ? t('team_analytics') : t('my_dashboard')}</h2>
            <p className="text-muted-foreground">{isAdmin ? t('team_analytics_desc') : t('my_dashboard_desc')}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button onClick={() => setTaskFormOpen(true)}>
                <Plus /> {t('add_task')}
              </Button>
            )}
            {isAdmin && <Button variant="outline" onClick={exportCSV}><FileDown /> {t('csv')}</Button>}
            {isAdmin && <Button variant="outline" onClick={exportPDF}><FileDown /> {t('pdf')}</Button>}
            <LanguageSwitcher />
            <ThemeSwitcher />
            <Button variant="outline" onClick={handleSignOut}><LogOut /> {t('sign_out')}</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Attendance />
          <Courses />
        </div>

        {/* Admin-only sections */}
        {isAdmin && (
          <>
            <AttendanceAdmin />
            <AIInsights byUser={byUser} />
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">{t('tasks_by_member')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <MemberTasksBarChart data={byUser} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">{t('tasks_completion_ratio')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CompletionRatioPieChart data={byUser} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">{t('detailed_member_breakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailedBreakdownTable data={byUser} />
              </CardContent>
            </Card>
          </>
        )}
        
        {/* User-specific task list */}
        {!isAdmin && user && (
          <MyTasks tasks={tasks} />
        )}
      </div>
    </>
  );
}

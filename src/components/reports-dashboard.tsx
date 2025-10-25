'use client';

import type { Task } from '@/lib/data';
import { useMemo, useState } from 'react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from './ui/button';
import { FileDown, Plus, LogOut, LayoutDashboard, ListTodo, BarChart, Users, GanttChartSquare, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MemberTasksBarChart } from './charts/member-tasks-bar-chart';
import { CompletionRatioPieChart } from './charts/completion-ratio-pie-chart';
import { DetailedBreakdownTable } from './detailed-breakdown-table';
import AIInsights from './ai-insights';
import { TaskForm } from './task-form';
import { useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import Attendance from './attendance';
import AttendanceAdmin from './attendance-admin';
import Courses from './courses';
import MyTasks from './my-tasks';
import { useLanguage } from '@/context/language-context';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';
import { useUsers } from '@/hooks/use-users';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';

export type UserReport = {
  name: string;
  total: number;
  backlog: number;
  in_progress: number;
  review: number;
  done: number;
};

type View = 'dashboard' | 'my-tasks' | 'reports' | 'clients' | 'attendance' | 'courses';

export default function ReportsDashboard({ tasks, userRole }: { tasks: Task[], userRole: string }) {
  const [isTaskFormOpen, setTaskFormOpen] = useState(false);
  const { auth } = useFirebase();
  const { t } = useLanguage();
  const users = useUsers(userRole);
  const [activeView, setActiveView] = useState<View>('dashboard');


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

  const renderContent = () => {
    switch(activeView) {
      case 'my-tasks':
        return <MyTasks tasks={tasks} />;
      case 'reports':
        return (
          <Card>
            <CardHeader><CardTitle>{t('reports')}</CardTitle></CardHeader>
            <CardContent>
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

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="font-headline">{t('detailed_member_breakdown')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DetailedBreakdownTable data={byUser} />
                  </CardContent>
                </Card>
            </CardContent>
          </Card>
        );
      case 'clients':
        return (
          <Card>
            <CardHeader><CardTitle>{t('clients')}</CardTitle></CardHeader>
            <CardContent><p>Client management view coming soon.</p></CardContent>
          </Card>
        );
      case 'attendance':
        return isAdmin ? <AttendanceAdmin /> : <Attendance />;
      case 'courses':
        return <Courses />;
      case 'dashboard':
      default:
        return (
          <>
            {isAdmin && (
              <>
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

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="font-headline">{t('detailed_member_breakdown')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DetailedBreakdownTable data={byUser} />
                  </CardContent>
                </Card>
              </>
            )}
            
            {!isAdmin && (
               <div className="grid grid-cols-1 gap-6">
                <Attendance />
                <Courses />
              </div>
            )}
          </>
        )
    }
  }

  return (
    <>
      <TaskForm isOpen={isTaskFormOpen} onOpenChange={setTaskFormOpen} />
      <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2">
                 <SidebarTrigger />
                 <h2 className="font-semibold text-lg font-headline group-data-[collapsible=icon]:hidden">Xfuse Sites</h2>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                   <SidebarMenuButton isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')}>
                    <LayoutDashboard />
                    <span>{t('my_dashboard')}</span>
                   </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                   <SidebarMenuButton isActive={activeView === 'my-tasks'} onClick={() => setActiveView('my-tasks')}>
                    <ListTodo />
                    <span>{t('my_tasks')}</span>
                   </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                   <SidebarMenuButton isActive={activeView === 'attendance'} onClick={() => setActiveView('attendance')}>
                    <Clock />
                    <span>{t('attendance')}</span>
                   </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                   <SidebarMenuButton isActive={activeView === 'courses'} onClick={() => setActiveView('courses')}>
                    <BookOpen />
                    <span>{t('courses')}</span>
                   </SidebarMenuButton>
                </SidebarMenuItem>
                {isAdmin && (
                  <>
                    <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'reports'} onClick={() => setActiveView('reports')}>
                        <BarChart />
                        <span>{t('reports')}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'clients'} onClick={() => setActiveView('clients')}>
                        <Users />
                        <span>{t('clients')}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
               <div className="flex items-center gap-2">
                  <ThemeSwitcher />
                  <LanguageSwitcher />
                  <Button variant="outline" size="icon" onClick={handleSignOut}><LogOut /></Button>
               </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden"/>
                    <div>
                      <h2 className="font-semibold text-2xl font-headline">
                         {activeView === 'dashboard' && t('team_analytics')}
                         {activeView === 'my-tasks' && t('my_tasks')}
                         {activeView === 'attendance' && t('attendance')}
                         {activeView === 'courses' && t('my_courses')}
                         {activeView === 'reports' && t('reports')}
                         {activeView === 'clients' && t('clients')}
                      </h2>
                      <p className="text-muted-foreground">
                        {isAdmin ? t('home_page_description') : t('welcome_back_desc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {isAdmin && (
                      <Button onClick={() => setTaskFormOpen(true)} className="w-full sm:w-auto">
                        <Plus /> {t('add_task')}
                      </Button>
                    )}
                    {isAdmin && activeView === 'reports' && <Button variant="outline" onClick={exportCSV}><FileDown /> {t('csv')}</Button>}
                    {isAdmin && activeView === 'reports' && <Button variant="outline" onClick={exportPDF}><FileDown /> {t('pdf')}</Button>}
                  </div>
              </div>
              {renderContent()}
            </div>
          </SidebarInset>
      </SidebarProvider>
    </>
  );
}

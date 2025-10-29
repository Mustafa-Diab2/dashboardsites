'use client';

import type { Client, Task, TaskTemplate } from '@/lib/data';
import { useMemo, useState } from 'react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import { Button } from './ui/button';
import { FileDown, Plus, LogOut, LayoutDashboard, ListTodo, BarChart, Users, GanttChartSquare, Clock, BookOpen, FilePlus } from 'lucide-react';
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import CourseForm from './course-form';
import ClientsDashboard from './clients-dashboard';
import { CommandPalette } from './command-palette';
import { WorkloadHeatmap } from './workload-heatmap';
import { PaymentManagement } from './payment-management';
import { useClients } from '@/hooks/use-clients';
import ClientForm from './client-form';
import { TaskTemplates } from './templates/task-templates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

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
  const [isClientFormOpen, setClientFormOpen] = useState(false);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [initialTaskData, setInitialTaskData] = useState<Partial<Task> | undefined>(undefined);
  
  const { auth } = useFirebase();
  const { t } = useLanguage();
  const users = useUsers(userRole);
  const clients = useClients();
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
    
    // Initialize map with all users
    users?.forEach(user => {
        map.set(user.id, { name: nameOf(user.id), total: 0, backlog: 0, in_progress: 0, review: 0, done: 0 });
    });


    tasks.forEach(t => {
      if (t.assigned_to && t.assigned_to.length > 0) {
        t.assigned_to.forEach(assigneeId => {
          if (!map.has(assigneeId)) map.set(assigneeId, { name: nameOf(assigneeId), total: 0, backlog: 0, in_progress: 0, review: 0, done: 0 });
          const rec = map.get(assigneeId)!;
          rec.total++;
          (rec as any)[t.status]++;
        });
      } else {
         if (!map.has('unassigned')) map.set('unassigned', { name: nameOf(undefined), total: 0, backlog: 0, in_progress: 0, review: 0, done: 0 });
          const rec = map.get('unassigned')!;
          rec.total++;
          (rec as any)[t.status]++;
      }
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
    doc.text("Team Task Report", 14, 16);
    const tableData = byUser.map(u => [u.name, u.total, u.backlog, u.in_progress, u.review, u.done]);
    const table = (doc as any).autoTable({
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
  
  const handleOpenTaskForm = (template?: Partial<Task>) => {
    setTemplateDialogOpen(false);
    setInitialTaskData(template);
    setTaskFormOpen(true);
  };
  
  const handleSelectTemplate = (template: TaskTemplate) => {
    const taskDataFromTemplate = {
      ...template.defaultFields,
      checklist: template.defaultChecklist?.map(item => ({...item, id: crypto.randomUUID(), createdAt: new Date() })),
      title: template.name,
      description: template.description,
    };
    handleOpenTaskForm(taskDataFromTemplate);
  };

  const isAdmin = userRole === 'admin';

  const renderContent = () => {
    switch(activeView) {
      case 'my-tasks':
        return <MyTasks tasks={tasks} />;
      case 'reports':
        return (
          <div className="space-y-6">
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

            {isAdmin && (
              <>
                <WorkloadHeatmap
                  tasks={tasks}
                  users={users?.map(u => ({ id: u.id, name: (u as any).fullName || 'Unknown' })) || []}
                />

                <PaymentManagement
                  tasks={tasks}
                  clients={clients || []}
                />
              </>
            )}
          </div>
        );
      case 'clients':
        return <ClientsDashboard />;
      case 'attendance':
        return isAdmin ? <AttendanceAdmin /> : <Attendance />;
      case 'courses':
        return <Courses userRole={userRole} />;
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
                <h2 className="font-semibold text-2xl font-headline">{t('welcome_back')}</h2>
                <Attendance />
                <Courses userRole={userRole} />
              </div>
            )}
          </>
        )
    }
  }

  const handleCommandAction = (action: string, data?: any) => {
    switch (action) {
      case 'new-task':
        setTemplateDialogOpen(true);
        break;
      case 'new-client':
        setClientFormOpen(true);
        break;
      case 'navigate':
        setActiveView(data as View);
        break;
      case 'filter':
        // Handle filters
        break;
      case 'export-pdf':
        exportPDF();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <CommandPalette onAction={handleCommandAction} />
      <TaskForm 
        isOpen={isTaskFormOpen} 
        onOpenChange={setTaskFormOpen}
        initialData={initialTaskData}
      />
      <ClientForm isOpen={isClientFormOpen} onOpenChange={setClientFormOpen} />
      
      <Dialog open={isTemplateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create a New Task</DialogTitle>
            <DialogDescription>
              Select a template or start from scratch.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <TaskTemplates templates={[]} onSelectTemplate={handleSelectTemplate} />
          </div>
           <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenTaskForm()}>
              <FilePlus className="mr-2" />
              Start from Scratch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


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
               <SidebarSeparator />
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
                      <Button onClick={() => setTemplateDialogOpen(true)} className="w-full sm:w-auto">
                        <Plus /> {t('add_task')}
                      </Button>
                    )}
                    {isAdmin && activeView === 'dashboard' && <Button variant="outline" onClick={exportCSV}><FileDown /> {t('csv')}</Button>}
                    {isAdmin && activeView === 'dashboard' && <Button variant="outline" onClick={exportPDF}><FileDown /> {t('pdf')}</Button>}
                  </div>
              </div>
              {renderContent()}
            </div>
          </SidebarInset>
      </SidebarProvider>
    </>
  );
}

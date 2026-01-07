'use client';

import type { Client, Task, TaskTemplate, User } from '@/lib/data';
import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { FileDown, Plus, LogOut, LayoutDashboard, ListTodo, BarChart, Users, GanttChartSquare, Clock, BookOpen, FilePlus, MessageSquare, UserCog, Briefcase, Banknote, CalendarDays, FolderOpen, Paintbrush, Shield, Server, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MemberTasksBarChart } from './charts/member-tasks-bar-chart';
import { CompletionRatioPieChart } from './charts/completion-ratio-pie-chart';
import { DetailedBreakdownTable } from './detailed-breakdown-table';
import AIInsights from './ai-insights';
import { TaskForm } from './task-form';
import { useSupabase } from '@/context/supabase-context';
import { supabase } from '@/lib/supabase';
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
import ClientsDashboard from './clients-dashboard';
import { CommandPalette } from './command-palette';
import { WorkloadHeatmap } from './workload-heatmap';
import { PaymentManagement } from './payment-management';
import { useClients } from '@/hooks/use-clients';
import ClientForm from './client-form';
import { TaskTemplates } from './templates/task-templates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import TeamChat from './team-chat';
import { HRManagementPage } from './hr-management-page';
import TeamManagement from './team-management';
import SalaryReport from './salary-report';
import { GlobalCalendar } from './global-calendar';
import { FileManager } from './file-manager';
import { NotificationCenter } from './notification-center';
import { AIMockupGenerator } from './ai-mockup-generator';
import { AIPromptGenerator } from './ai-prompt-generator';
import { SecurityDashboard } from './security-dashboard';
import { BackendTools } from './backend-tools';

export type UserReport = {
  name: string;
  total: number;
  backlog: number;
  in_progress: number;
  review: number;
  done: number;
};

type View = 'dashboard' | 'my-tasks' | 'reports' | 'clients' | 'attendance' | 'courses' | 'chat' | 'hr' | 'team' | 'salary' | 'calendar' | 'files' | 'ai-mockup' | 'ai-prompt' | 'security' | 'backend';

export default function ReportsDashboard({ tasks, userRole }: { tasks: Task[], userRole: string | undefined }) {
  const [isTaskFormOpen, setTaskFormOpen] = useState(false);
  const [isClientFormOpen, setClientFormOpen] = useState(false);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [initialTaskData, setInitialTaskData] = useState<Partial<Task> | undefined>(undefined);

  const { user } = useSupabase();
  const { t } = useLanguage();
  const users = useUsers(userRole);
  const clients = useClients();
  const [activeView, setActiveView] = useState<View>('dashboard');


  const byUser = useMemo(() => {
    const nameOf = (uid?: string) => {
      if (!uid) return 'Unassigned';
      if (!users) return uid;
      const found = users?.find(m => m.id === uid);
      return found ? found.full_name : uid;
    };
    const map = new Map<string, UserReport>();

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

  const handleSignOut = async () => {
    try {
      // Clear the session and sign out
      await supabase.auth.signOut();
      // Force reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, try to reload
      window.location.reload();
    }
  };

  const handleOpenTaskForm = (template?: Partial<Task>) => {
    setTemplateDialogOpen(false);
    setInitialTaskData(template);
    setTaskFormOpen(true);
  };

  const handleSelectTemplate = (template: TaskTemplate) => {
    const taskDataFromTemplate = {
      ...template.default_fields,
      checklist: template.default_checklist?.map(item => ({ ...item, id: crypto.randomUUID(), created_at: new Date() })),
      title: template.name,
      description: template.description,
    };
    handleOpenTaskForm(taskDataFromTemplate);
  };

  const isAdmin = userRole === 'admin';

  const renderContent = () => {
    switch (activeView) {
      case 'my-tasks':
        return <MyTasks tasks={tasks} />;
      case 'reports':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <CardContent className="overflow-x-auto">
                <DetailedBreakdownTable data={byUser} />
              </CardContent>
            </Card>

            {isAdmin && (
              <>
                <WorkloadHeatmap
                  tasks={tasks}
                  users={users?.map(u => ({ id: u.id, name: u.full_name || 'Unknown' })) || []}
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
        return <Courses userRole={userRole as string} />;
      case 'chat':
        return <TeamChat />;
      case 'hr':
        return <HRManagementPage userRole={userRole} />;
      case 'team':
        return <TeamManagement users={users as User[]} />;
      case 'salary':
        return <SalaryReport users={users as User[]} tasks={tasks} />;
      case 'calendar':
        return <GlobalCalendar />;
      case 'files':
        return <FileManager />;
      case 'ai-mockup':
        return <AIMockupGenerator />;
      case 'ai-prompt':
        return <AIPromptGenerator />;
      case 'security':
        return <SecurityDashboard />;
      case 'backend':
        return <BackendTools />;
      case 'dashboard':
      default:
        return (
          <>
            {isAdmin && (
              <>
                <AIInsights byUser={byUser} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="font-headline">{t('tasks_by_member')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MemberTasksBarChart data={byUser} />
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="font-headline">{t('tasks_completion_ratio')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CompletionRatioPieChart data={byUser} />
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-6 glass-card">
                  <CardHeader>
                    <CardTitle className="font-headline">{t('detailed_member_breakdown')}</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <DetailedBreakdownTable data={byUser} />
                  </CardContent>
                </Card>
              </>
            )}

            {!isAdmin && (
              <div className="grid grid-cols-1 gap-6">
                <h2 className="font-semibold text-2xl font-headline">{t('welcome_back')}</h2>
                <Attendance />
                <Courses userRole={userRole as string} />
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
        break;
      case 'export-pdf':
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
            <DialogTitle>{t('create_new_task')}</DialogTitle>
            <DialogDescription>
              {t('select_template_or_start_fresh')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-x-auto">
            <TaskTemplates templates={[]} onSelectTemplate={handleSelectTemplate} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenTaskForm()}>
              <FilePlus className="mr-2" />
              {t('start_from_scratch')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <SidebarProvider>
        <Sidebar className="border-r border-white/10 bg-background/20 backdrop-blur-xl">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <LayoutDashboard className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight font-headline">NEXUS</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Management</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3">
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
                <SidebarMenuButton isActive={activeView === 'chat'} onClick={() => setActiveView('chat')}>
                  <MessageSquare />
                  <span>{t('chat')}</span>
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
                      <Briefcase />
                      <span>{t('clients')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'team'} onClick={() => setActiveView('team')}>
                      <Users />
                      <span>{t('team')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'hr'} onClick={() => setActiveView('hr')}>
                      <UserCog />
                      <span>{t('hr_management')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'salary'} onClick={() => setActiveView('salary')}>
                      <Banknote />
                      <span>{t('salary_report')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'files'} onClick={() => setActiveView('files')}>
                      <FolderOpen />
                      <span>{t('file_manager')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'ai-mockup'} onClick={() => setActiveView('ai-mockup')}>
                      <Paintbrush />
                      <span>AI Mockup</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'ai-prompt'} onClick={() => setActiveView('ai-prompt')}>
                      <Brain />
                      <span>AI Prompt</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'security'} onClick={() => setActiveView('security')}>
                      <Shield />
                      <span>Security Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'backend'} onClick={() => setActiveView('backend')}>
                      <Server />
                      <span>Backend Tools</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeView === 'calendar'} onClick={() => setActiveView('calendar')}>
                  <CalendarDays />
                  <span>{t('calendar')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 mt-auto">
            <SidebarSeparator className="opacity-10 mb-4" />
            <div className="flex items-center justify-around bg-muted/30 rounded-2xl p-2 backdrop-blur-sm border border-white/5">
              <ThemeSwitcher />
              <LanguageSwitcher />
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="overflow-x-hidden mesh-gradient min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-10 w-10 glass-card rounded-xl hover:bg-primary/10 transition-colors" />
                <div>
                  <h2 className="font-bold text-2xl sm:text-3xl font-headline tracking-tight">
                    {activeView === 'dashboard' && t('team_analytics')}
                    {activeView === 'my-tasks' && t('my_tasks')}
                    {activeView === 'attendance' && t('attendance')}
                    {activeView === 'courses' && t('my_courses')}
                    {activeView === 'reports' && t('reports')}
                    {activeView === 'clients' && t('clients')}
                    {activeView === 'chat' && t('team_chat')}
                    {activeView === 'hr' && t('hr_management')}
                    {activeView === 'team' && t('team_management')}
                    {activeView === 'salary' && t('salary_report')}
                    {activeView === 'calendar' && t('calendar')}
                    {activeView === 'files' && t('file_manager')}
                    {activeView === 'ai-mockup' && 'AI Mockup Generator'}
                    {activeView === 'ai-prompt' && 'AI Prompt Generator'}
                    {activeView === 'security' && 'Security Dashboard'}
                    {activeView === 'backend' && 'Backend Tools'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isAdmin ? t('home_page_description') : t('welcome_back_desc')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <NotificationCenter />
                {isAdmin && (
                  <Button
                    onClick={() => setTemplateDialogOpen(true)}
                    className="w-full sm:w-auto h-11 bg-gradient-to-r from-primary to-purple-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 font-medium"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    <span className="hidden sm:inline">{t('add_task')}</span>
                    <span className="inline sm:hidden">{t('add')}</span>
                  </Button>
                )}
              </div>
            </div>
            {renderContent()}
          </div>
        </SidebarInset>
      </SidebarProvider >
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type Task } from '@/lib/data';
import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection, useSupabaseDoc } from '@/hooks/use-supabase-data';
import { useToast } from '@/hooks/use-toast';
import { useMutations } from '@/hooks/use-mutations';
import { useLanguage } from '@/context/language-context';
import { useUsers } from '@/hooks/use-users';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useCallback } from 'react';
import { TaskChecklist } from './task-checklist';
import { TaskResearch } from './task-research';
import { TaskDependencies } from './task-dependencies';

type TaskFormData = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'assigned_to'> & { assigned_to: string[] };

const INITIAL_FORM_STATE: TaskFormData = {
  title: '',
  description: '',
  type: 'work',
  assigned_to: [],
  created_by: '',
  client_id: undefined,
  progress: 0,
  start_date: '',
  due_date: '',
  delivery_method: 'upload',
  deliverable_location: '',
  deliverable_details: '',
  backend_conditions: '',
  frontend_conditions: '',
  ux_requirements: '',
  market_research_link: '',
  client_payment: 0,
  backend_share_pct: 0,
  frontend_share_pct: 0,
  payment_schedule: '',
  status: 'backlog',
  priority: 'medium',
  tags: [],
  checklist: [],
  research: [],
  blocked_by: [],
  blocks: [],
  approvals: [],
  payment_status: 'pending',
};

export function TaskForm({
  isOpen,
  onOpenChange,
  task,
  initialData,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task?: Task;
  initialData?: Partial<Task>;
}) {
  const { user, role: userRole } = useSupabase();
  const { addDoc: addTask, updateDoc } = useMutations();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [form, setForm] = useState<TaskFormData>(INITIAL_FORM_STATE);

  const { data: userData } = useSupabaseDoc('profiles', user?.id);

  const users = useUsers(userRole || (userData as any)?.role);

  const { data: allTasksData } = useSupabaseCollection('tasks');
  const allTasks = (allTasksData as Task[]) || [];

  const fetchClients = useCallback((query: any) => query.order('name'), []);

  const { data: clients } = useSupabaseCollection(
    'clients',
    fetchClients
  );

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setForm({
          ...(task as any),
          start_date: task.start_date ? new Date(task.start_date).toISOString().split('T')[0] : '',
          due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        });
      } else {
        setForm({ ...INITIAL_FORM_STATE, ...initialData });
      }
    } else {
      setForm(INITIAL_FORM_STATE);
    }
  }, [task, initialData, isOpen]);


  const handleFieldChange = (field: keyof TaskFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelectChange = (field: keyof TaskFormData, value: string) => {
    setForm(prev => {
      const existing = (prev[field] as string[]) || [];
      if (existing.includes(value)) {
        return { ...prev, [field]: existing.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...existing, value] };
      }
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: t('must_be_logged_in_to_create_task') });
      return;
    }
    if (!form.title || !form.type) {
      toast({ variant: 'destructive', title: 'Error', description: t('task_title_required') });
      return;
    }
    if ((form.backend_share_pct || 0) + (form.frontend_share_pct || 0) > 100) {
      toast({ variant: 'destructive', title: t('error_title'), description: t('share_percentage_error') });
      return;
    }

    try {
      const taskData = {
        ...form,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (task) {
        updateDoc('tasks', task.id, taskData)
      } else {
        addTask('tasks', { ...taskData, created_at: new Date().toISOString() });
      }

      toast({ title: t('task_created_title'), description: `${t('task_created_desc')} "${form.title}"` });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating/updating task:', error);
      toast({ variant: 'destructive', title: t('error_title'), description: t('error_desc') });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{task ? t('edit_task') : t('create_task')}</DialogTitle>
          <DialogDescription>{task ? t('edit_task_desc') : t('create_task_desc')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <Tabs defaultValue="basic" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="basic">{t('basic_info')}</TabsTrigger>
              <TabsTrigger value="details">{t('details')}</TabsTrigger>
              <TabsTrigger value="checklist">{t('checklist')}</TabsTrigger>
              <TabsTrigger value="dependencies">{t('dependencies')}</TabsTrigger>
              <TabsTrigger value="research">{t('research_hub')}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">{t('title')}*</Label>
                    <Input id="title" value={form.title} onChange={e => handleFieldChange('title', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">{t('description')}</Label>
                    <Textarea id="description" value={form.description || ''} onChange={e => handleFieldChange('description', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">{t('status')}</Label>
                      <Select value={form.status} onValueChange={value => handleFieldChange('status', value)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="backlog">{t('backlog')}</SelectItem>
                          <SelectItem value="in_progress">{t('in_progress')}</SelectItem>
                          <SelectItem value="review">{t('review')}</SelectItem>
                          <SelectItem value="done">{t('done')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">{t('type')}*</Label>
                      <Select value={form.type} onValueChange={value => handleFieldChange('type', value)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="work">{t('work')}</SelectItem>
                          <SelectItem value="training">{t('training')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="priority">{t('priority')}</Label>
                      <Select value={form.priority} onValueChange={value => handleFieldChange('priority', value)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{t('low')}</SelectItem>
                          <SelectItem value="medium">{t('medium')}</SelectItem>
                          <SelectItem value="high">{t('high')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="assignee">{t('assignees')}</Label>
                      <Select onValueChange={value => handleMultiSelectChange('assigned_to', value)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <SelectTrigger id="assignee">
                          <SelectValue placeholder={t('select_members')} />
                        </SelectTrigger>
                        <SelectContent>
                          {users?.map(member => (
                            <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-1">
                        {form.assigned_to.map(id => {
                          const member = users?.find(u => u.id === id);
                          return member ? <Badge key={id} variant="secondary">{member.full_name}</Badge> : null;
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start-date">{t('start_date')}</Label>
                      <Input id="start-date" type="date" value={form.start_date || ''} onChange={e => handleFieldChange('start_date', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="due-date">{t('due_date')}</Label>
                      <Input id="due-date" type="date" value={form.due_date || ''} onChange={e => handleFieldChange('due_date', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="client">{t('client')}</Label>
                    <Select value={form.client_id || ''} onValueChange={value => handleFieldChange('client_id', value || undefined)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      <SelectTrigger id="client"><SelectValue placeholder={t('select_client')} /></SelectTrigger>
                      <SelectContent>
                        {clients?.map(client => (
                          <SelectItem key={client.id} value={client.id}>{(client as any).name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="client_payment">{t('client_payment')}</Label>
                      <Input id="client_payment" type="number" value={form.client_payment || 0} onChange={e => handleFieldChange('client_payment', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="backend_share_pct">{t('backend_share')}</Label>
                      <Input id="backend_share_pct" type="number" value={form.backend_share_pct || 0} onChange={e => handleFieldChange('backend_share_pct', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="frontend_share_pct">{t('frontend_share')}</Label>
                      <Input id="frontend_share_pct" type="number" value={form.frontend_share_pct || 0} onChange={e => handleFieldChange('frontend_share_pct', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payment_schedule">{t('payment_schedule')}</Label>
                    <Input id="payment_schedule" value={form.payment_schedule || ''} onChange={e => handleFieldChange('payment_schedule', e.target.value)} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="p-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="deliverable_location">{t('deliverable_location')}</Label>
                <Input id="deliverable_location" value={form.deliverable_location || ''} onChange={e => handleFieldChange('deliverable_location', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="delivery_method">{t('delivery_method')}</Label>
                <Select value={form.delivery_method} onValueChange={value => handleFieldChange('delivery_method', value)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <SelectTrigger id="delivery_method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">{t('in_person')}</SelectItem>
                    <SelectItem value="upload">{t('upload')}</SelectItem>
                    <SelectItem value="link">{t('link')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliverable_details">{t('deliverable_details')}</Label>
                <Textarea id="deliverable_details" value={form.deliverable_details || ''} onChange={e => handleFieldChange('deliverable_details', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ux_requirements">{t('ux_requirements')}</Label>
                <Textarea id="ux_requirements" value={form.ux_requirements || ''} onChange={e => handleFieldChange('ux_requirements', e.target.value)} rows={3} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="backend_conditions">{t('backend_conditions')}</Label>
                <Textarea id="backend_conditions" value={form.backend_conditions || ''} onChange={e => handleFieldChange('backend_conditions', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frontend_conditions">{t('frontend_conditions')}</Label>
                <Textarea id="frontend_conditions" value={form.frontend_conditions || ''} onChange={e => handleFieldChange('frontend_conditions', e.target.value)} />
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="p-4">
              <TaskChecklist
                checklist={form.checklist || []}
                onChange={(checklist) => handleFieldChange('checklist', checklist)}
              />
            </TabsContent>

            <TabsContent value="dependencies" className="p-4">
              <TaskDependencies
                task={form as Task}
                allTasks={allTasks}
                onChange={(blocked_by, blocks) => {
                  handleFieldChange('blocked_by', blocked_by);
                  handleFieldChange('blocks', blocks);
                }}
              />
            </TabsContent>

            <TabsContent value="research" className="p-4">
              <TaskResearch
                research={form.research || []}
                onChange={(research) => handleFieldChange('research', research)}
              />
            </TabsContent>
          </Tabs>
        </ScrollArea>
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit}>{t('save_task')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

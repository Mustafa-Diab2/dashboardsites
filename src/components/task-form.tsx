
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
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useMutations } from '@/hooks/use-mutations';
import { useLanguage } from '@/context/language-context';
import { useUsers } from '@/hooks/use-users';

type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

const INITIAL_FORM_STATE: TaskFormData = {
  title: '',
  description: '',
  forTeam: 'frontend',
  assigneeId: undefined,
  status: 'backlog',
  priority: 'medium',
  due: '',
  tags: [],
};

export function TaskForm({
  isOpen,
  onOpenChange,
  task,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task?: Task;
}) {
  const { firestore, user } = useFirebase();
  const { addDoc: addTask } = useMutations();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [form, setForm] = useState<TaskFormData>(INITIAL_FORM_STATE);
  
  // We can assume if this form is open, the user is an admin.
  const users = useUsers('admin');

  useEffect(() => {
    if (task) {
      setForm({
        ...task,
        due: task.due ? task.due.split('T')[0] : '', // Format date for input
      });
    } else {
      setForm(INITIAL_FORM_STATE);
    }
  }, [task, isOpen]);

  const handleFieldChange = (field: keyof TaskFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t('must_be_logged_in_to_create_task'),
      });
      return;
    }
    if (!form.title) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t('task_title_required'),
      });
      return;
    }

    try {
      const taskData: Omit<Task, 'id'> = {
        ...form,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      addTask('tasks', taskData);
      
      toast({
        title: t('task_created_title'),
        description: `${t('task_created_desc')} "${form.title}"`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        variant: 'destructive',
        title: t('error_title'),
        description: t('error_desc'),
      });
    }
  };

  const teamMembers = users?.filter(u => (u as any).role === form.forTeam || (u as any).role === 'admin');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{task ? t('edit_task') : t('create_task')}</DialogTitle>
          <DialogDescription>
            {task
              ? t('edit_task_desc')
              : t('create_task_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">{t('title')}</Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => handleFieldChange('title', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              value={form.description || ''}
              onChange={e => handleFieldChange('description', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">{t('status')}</Label>
              <Select
                value={form.status}
                onValueChange={value =>
                  handleFieldChange('status', value)
                }
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder={t('select_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">{t('backlog')}</SelectItem>
                  <SelectItem value="in_progress">{t('in_progress')}</SelectItem>
                  <SelectItem value="review">{t('review')}</SelectItem>
                  <SelectItem value="done">{t('done')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2">
              <Label htmlFor="team">{t('team')}</Label>
              <Select
                value={form.forTeam}
                onValueChange={value =>
                  handleFieldChange('forTeam', value)
                }
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder={t('select_team')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">{t('frontend')}</SelectItem>
                  <SelectItem value="backend">{t('backend')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">{t('priority')}</Label>
              <Select
                value={form.priority}
                onValueChange={value =>
                  handleFieldChange('priority', value)
                }
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder={t('select_priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('low')}</SelectItem>
                  <SelectItem value="medium">{t('medium')}</SelectItem>
                  <SelectItem value="high">{t('high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="due-date">{t('due_date')}</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={form.due || ''}
                  onChange={e => handleFieldChange('due', e.target.value)}
                />
              </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assignee">{t('assignee')}</Label>
            <Select
              value={form.assigneeId || ''}
              onValueChange={value =>
                handleFieldChange('assigneeId', value || undefined)
              }
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder={t('unassigned')} />
              </SelectTrigger>
              <SelectContent>
                {teamMembers?.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {(member as any).fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit}>{t('save_task')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

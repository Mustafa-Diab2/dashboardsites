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
import { MEMBERS, type Task } from '@/lib/data';
import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [form, setForm] = useState<TaskFormData>(INITIAL_FORM_STATE);

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
        description: 'You must be logged in to create a task.',
      });
      return;
    }
    if (!form.title) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Task title is required.',
      });
      return;
    }

    try {
      const tasksCollection = collection(firestore, 'tasks');
      const taskData: Omit<Task, 'id'> = {
        ...form,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      addDocumentNonBlocking(tasksCollection, taskData);
      
      toast({
        title: 'Task Created',
        description: `Task "${form.title}" has been successfully created.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {task
              ? 'Edit the details of the task.'
              : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => handleFieldChange('title', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description || ''}
              onChange={e => handleFieldChange('description', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={value =>
                  handleFieldChange('status', value)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2">
              <Label htmlFor="team">Team</Label>
              <Select
                value={form.forTeam}
                onValueChange={value =>
                  handleFieldChange('forTeam', value)
                }
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={value =>
                  handleFieldChange('priority', value)
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={form.due || ''}
                  onChange={e => handleFieldChange('due', e.target.value)}
                />
              </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Select
              value={form.assigneeId || ''}
              onValueChange={value =>
                handleFieldChange('assigneeId', value || undefined)
              }
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {MEMBERS.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

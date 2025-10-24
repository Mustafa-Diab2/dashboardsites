'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useMutations } from '@/hooks/use-mutations';
import type { Task } from '@/lib/data';
import { CheckSquare, Forward, Play } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

type StatusTransition = {
  nextStatus: Task['status'];
  label: string;
  icon: React.ReactNode;
};

export function TaskDetailsDialog({
  isOpen,
  onOpenChange,
  task,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
}) {
  const { updateDoc } = useMutations();
  const { t } = useLanguage();

  const statusTransitions: Record<Task['status'], StatusTransition | null> = {
    backlog: { nextStatus: 'in_progress', label: t('start_progress'), icon: <Play /> },
    in_progress: { nextStatus: 'review', label: t('submit_for_review'), icon: <Forward /> },
    review: { nextStatus: 'done', label: t('mark_as_done'), icon: <CheckSquare /> },
    done: null,
  };

  if (!task) return null;

  const handleStatusChange = () => {
    const transition = statusTransitions[task.status];
    if (transition) {
      updateDoc('tasks', task.id, { status: transition.nextStatus });
      onOpenChange(false);
    }
  };
  
  const transition = statusTransitions[task.status];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">{t('high')}</Badge>;
      case 'medium':
        return <Badge variant="secondary">{t('medium')}</Badge>;
      case 'low':
      default:
        return <Badge variant="outline">{t('low')}</Badge>;
    }
  };

  const getStatusText = (status: Task['status']) => {
    return t(status.replace('_', ' '));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{task.title}</DialogTitle>
          <DialogDescription>
            {t('due_by')} {task.due ? new Date(task.due).toLocaleDateString() : t('n_a')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="font-semibold">{t('status')}:</span>
                <Badge variant={task.status === 'done' ? 'default' : 'secondary'}>{getStatusText(task.status)}</Badge>
            </div>
             <div className="flex items-center gap-2">
                <span className="font-semibold">{t('priority')}:</span>
                {getPriorityBadge(task.priority)}
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">{t('description')}</h4>
            <p className="text-sm text-muted-foreground">
              {task.description || t('no_description_provided')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
          {transition && (
            <Button onClick={handleStatusChange}>
                {transition.icon}
              {transition.label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

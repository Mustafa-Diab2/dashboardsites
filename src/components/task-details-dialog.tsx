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
import { CheckSquare, CircleDot, Eye, Forward, Play } from 'lucide-react';

type StatusTransition = {
  nextStatus: Task['status'];
  label: string;
  icon: React.ReactNode;
};

const statusTransitions: Record<Task['status'], StatusTransition | null> = {
  backlog: { nextStatus: 'in_progress', label: 'Start Progress', icon: <Play /> },
  in_progress: { nextStatus: 'review', label: 'Submit for Review', icon: <Forward /> },
  review: { nextStatus: 'done', label: 'Mark as Done', icon: <CheckSquare /> },
  done: null,
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

  if (!task) return null;

  const handleStatusChange = () => {
    const transition = statusTransitions[task.status];
    if (transition) {
      updateDoc('tasks', task.id, { status: transition.nextStatus });
      onOpenChange(false); // Close dialog on action
    }
  };
  
  const transition = statusTransitions[task.status];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{task.title}</DialogTitle>
          <DialogDescription>
            Due by {task.due ? new Date(task.due).toLocaleDateString() : 'N/A'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <Badge variant={task.status === 'done' ? 'default' : 'secondary'}>{task.status.replace('_', ' ')}</Badge>
            </div>
             <div className="flex items-center gap-2">
                <span className="font-semibold">Priority:</span>
                {getPriorityBadge(task.priority)}
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">
              {task.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
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

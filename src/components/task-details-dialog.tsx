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
import { CheckSquare, Forward, Play, Link, User, DollarSign, Briefcase, Code, Palette, Search, Shield } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { TaskChecklist } from './task-checklist';
import { TaskApprovals } from './task-approvals';
import { useFirebase } from '@/firebase';

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
  const { user } = useFirebase();


  const statusTransitions: Record<Task['status'], StatusTransition | null> = {
    backlog: { nextStatus: 'in_progress', label: t('start_progress'), icon: <Play className="mr-2" /> },
    in_progress: { nextStatus: 'review', label: t('submit_for_review'), icon: <Forward className="mr-2" /> },
    review: { nextStatus: 'done', label: t('mark_as_done'), icon: <CheckSquare className="mr-2" /> },
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
    const statusMap = {
      backlog: t('backlog'),
      in_progress: t('in_progress'),
      review: t('review'),
      done: t('done'),
    };
    return statusMap[status] || status;
  }

  const renderLinks = (text: string | undefined) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 break-all">{part}</a>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{task.title}</DialogTitle>
          <DialogDescription>
            {t('due_by')} {task.due_date ? new Date(task.due_date).toLocaleDateString() : t('n_a')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
                <span className="font-semibold">{t('status')}:</span>
                <Badge variant={task.status === 'done' ? 'default' : 'secondary'}>{getStatusText(task.status)}</Badge>
            </div>
             <div className="flex items-center gap-2">
                <span className="font-semibold">{t('priority')}:</span>
                {getPriorityBadge(task.priority)}
            </div>
            <div className="flex items-center gap-2">
                <span className="font-semibold">{t('type')}:</span>
                <Badge variant="outline">{task.type === 'work' ? t('work') : t('training')}</Badge>
            </div>
          </div>
          
          <Separator />
          
           {(task.checklist && task.checklist.length > 0) && (
            <>
                <TaskChecklist checklist={task.checklist || []} onChange={() => {}} readonly/>
                <Separator />
            </>
           )}

            {(task.approvals && task.approvals.length > 0) && (
            <>
                <TaskApprovals 
                    taskId={task.id}
                    approvals={task.approvals || []}
                    currentStatus={task.status}
                    onApprove={() => {}}
                    onReject={() => {}}
                    readonly
                />
                <Separator />
            </>
           )}


          <div>
            <h4 className="font-semibold mb-2">{t('description')}</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {task.description || t('no_description_provided')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Technical Requirements */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2"><Code/>{t('technical_requirements')}</h4>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h5 className="text-sm font-medium mb-1">{t('backend_conditions')}</h5>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap">{renderLinks(task.backend_conditions) || t('n_a')}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h5 className="text-sm font-medium mb-1">{t('frontend_conditions')}</h5>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap">{renderLinks(task.frontend_conditions) || t('n_a')}</div>
              </div>
               <div className="p-3 bg-muted/50 rounded-lg">
                <h5 className="text-sm font-medium mb-1">{t('ux_requirements')}</h5>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap">{renderLinks(task.ux_requirements) || t('n_a')}</div>
              </div>
            </div>

            {/* Deliverables */}
            <div className="space-y-4">
               <h4 className="font-semibold flex items-center gap-2"><Briefcase />{t('deliverables')}</h4>
               <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm"><span className="font-medium">{t('delivery_method')}:</span> {task.delivery_method ? t(task.delivery_method) : t('n_a')}</p>
                  <p className="text-sm"><span className="font-medium">{t('deliverable_location')}:</span> <span className="text-primary break-all">{renderLinks(task.deliverable_location) || t('n_a')}</span></p>
               </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h5 className="text-sm font-medium mb-1">{t('deliverable_details')}</h5>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap">{renderLinks(task.deliverable_details) || t('n_a')}</div>
                </div>
                 <div className="p-3 bg-muted/50 rounded-lg">
                  <h5 className="text-sm font-medium mb-1">{t('market_research')}</h5>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap">{renderLinks(task.market_research_link) || t('n_a')}</div>
                </div>
            </div>
          </div>
          
          <Separator />

           {/* Financials */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2"><DollarSign />{t('financials')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{t('client_payment')}</p>
                <p>{task.client_payment ? `$${task.client_payment}` : t('n_a')}</p>
              </div>
               <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{t('backend_share')}</p>
                <p>{task.backend_share_pct ? `${task.backend_share_pct}%` : t('n_a')}</p>
              </div>
               <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{t('frontend_share')}</p>
                <p>{task.frontend_share_pct ? `${task.frontend_share_pct}%` : t('n_a')}</p>
              </div>
               <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{t('payment_schedule')}</p>
                <p className="whitespace-pre-wrap">{task.payment_schedule || t('n_a')}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
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

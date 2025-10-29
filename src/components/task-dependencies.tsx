'use client';

import { Task } from '@/lib/data';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, Link2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useLanguage } from '@/context/language-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface TaskDependenciesProps {
  task: Task;
  allTasks: Task[];
  onChange: (blocked_by: string[], blocks: string[]) => void;
  readonly?: boolean;
}

export function TaskDependencies({
  task,
  allTasks,
  onChange,
  readonly = false,
}: TaskDependenciesProps) {
  const { t } = useLanguage();
  const blocked_by = task.blocked_by || [];
  const blocks = task.blocks || [];

  const availableTasks = allTasks.filter((t) => t.id !== task.id);

  const getTaskById = (id: string) => allTasks.find((t) => t.id === id);

  const addBlockedBy = (taskId: string) => {
    if (!blocked_by.includes(taskId)) {
      onChange([...blocked_by, taskId], blocks);
    }
  };

  const removeBlockedBy = (taskId: string) => {
    onChange(
      blocked_by.filter((id) => id !== taskId),
      blocks
    );
  };

  const addBlocks = (taskId: string) => {
    if (!blocks.includes(taskId)) {
      onChange(blocked_by, [...blocks, taskId]);
    }
  };

  const removeBlocks = (taskId: string) => {
    onChange(
      blocked_by,
      blocks.filter((id) => id !== taskId)
    );
  };

  const hasActiveBlockers = blocked_by.some((id) => {
    const blocker = getTaskById(id);
    return blocker && blocker.status !== 'done';
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          {t('dependencies')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasActiveBlockers && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">
              {t('task_is_blocked')}
            </span>
          </div>
        )}

        {/* Blocked By */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t('blocked_by')}</h4>
          <div className="flex flex-wrap gap-2">
            {blocked_by.map((id) => {
              const blockerTask = getTaskById(id);
              if (!blockerTask) return null;

              return (
                <Badge
                  key={id}
                  variant={blockerTask.status === 'done' ? 'secondary' : 'destructive'}
                  className="flex items-center gap-1"
                >
                  <span className="max-w-[200px] truncate">
                    {blockerTask.title}
                  </span>
                  {!readonly && (
                    <button
                      onClick={() => removeBlockedBy(id)}
                      className="ml-1 hover:bg-background/20 rounded-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              );
            })}
          </div>
          {!readonly && (
            <Select onValueChange={addBlockedBy}>
              <SelectTrigger>
                <SelectValue placeholder={t('add_blocker')} />
              </SelectTrigger>
              <SelectContent>
                {availableTasks
                  .filter((t) => !blocked_by.includes(t.id))
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title} ({t.status})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Blocks */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t('blocks_tasks')}</h4>
          <div className="flex flex-wrap gap-2">
            {blocks.map((id) => {
              const blockedTask = getTaskById(id);
              if (!blockedTask) return null;

              return (
                <Badge
                  key={id}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <span className="max-w-[200px] truncate">
                    {blockedTask.title}
                  </span>
                  {!readonly && (
                    <button
                      onClick={() => removeBlocks(id)}
                      className="ml-1 hover:bg-background/20 rounded-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              );
            })}
          </div>
          {!readonly && (
            <Select onValueChange={addBlocks}>
              <SelectTrigger>
                <SelectValue placeholder={t('add_blocked_task')} />
              </SelectTrigger>
              <SelectContent>
                {availableTasks
                  .filter((t) => !blocks.includes(t.id))
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title} ({t.status})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

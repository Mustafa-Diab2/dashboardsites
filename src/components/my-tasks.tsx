'use client';

import { useState } from 'react';
import { ListTodo, CheckSquare, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { TaskDetailsDialog } from './task-details-dialog';
import type { Task } from '@/lib/data';
import { useLanguage } from '@/context/language-context';

export default function MyTasks({ tasks }: { tasks: Task[] }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { t } = useLanguage();

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return <Badge><CheckSquare className="mr-1 h-3 w-3" />{t('done')}</Badge>;
      case 'review':
        return <Badge variant="secondary">{t('review')}</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">{t('in_progress')}</Badge>;
      case 'backlog':
      default:
        return <Badge variant="outline">{t('backlog')}</Badge>;
    }
  };

  return (
    <>
      <TaskDetailsDialog
        task={selectedTask}
        isOpen={!!selectedTask}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedTask(null);
        }}
      />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <ListTodo />
            {t('my_tasks')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('title')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('priority')}</TableHead>
                  <TableHead>{t('due_date')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell>{task.due ? new Date(task.due).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTask(task)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t('view_manage')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {t('no_tasks_assigned')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

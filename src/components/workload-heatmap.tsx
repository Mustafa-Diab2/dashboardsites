'use client';

import { Task } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Flame, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface WorkloadHeatmapProps {
  tasks: Task[];
  users: { id: string; name: string }[];
}

export function WorkloadHeatmap({ tasks, users }: WorkloadHeatmapProps) {
  const { t } = useLanguage();

  // Calculate workload for each user
  const getWorkload = (userId: string, days: number = 7) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const userTasks = tasks.filter((task) => {
      if (!task.assigned_to?.includes(userId)) return false;
      if (task.status === 'done') return false;

      // Check if due date is within the time range
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        return dueDate >= now && dueDate <= futureDate;
      }

      // Include tasks in progress without due date
      return task.status === 'in_progress';
    });

    return {
      count: userTasks.length,
      highPriority: userTasks.filter((t) => t.priority === 'high').length,
      blocked: userTasks.filter((t) => t.blocked_by && t.blocked_by.length > 0).length,
    };
  };

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800 text-gray-600';
    if (count <= 2) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    if (count <= 4) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    if (count <= 6) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  };

  const getLoadLevel = (count: number) => {
    if (count === 0) return t('idle');
    if (count <= 2) return t('light');
    if (count <= 4) return t('moderate');
    if (count <= 6) return t('busy');
    return t('overloaded');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5" />
          {t('workload_heatmap')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t('next_7_days')}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => {
            const workload = getWorkload(user.id);
            const weeklyWorkload = getWorkload(user.id, 7);
            const biweeklyWorkload = getWorkload(user.id, 14);

            return (
              <div key={user.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{user.name}</span>
                  <div className="flex items-center gap-2">
                    {workload.highPriority > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {workload.highPriority} {t('high_priority')}
                      </Badge>
                    )}
                    {workload.blocked > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {workload.blocked} {t('blocked')}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`p-3 rounded-lg text-center ${getHeatColor(
                      weeklyWorkload.count
                    )}`}
                  >
                    <div className="text-2xl font-bold">{weeklyWorkload.count}</div>
                    <div className="text-xs opacity-80">
                      {t('next')} 7 {t('days')}
                    </div>
                    <div className="text-xs font-medium mt-1">
                      {getLoadLevel(weeklyWorkload.count)}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg text-center ${getHeatColor(
                      biweeklyWorkload.count
                    )}`}
                  >
                    <div className="text-2xl font-bold">{biweeklyWorkload.count}</div>
                    <div className="text-xs opacity-80">
                      {t('next')} 14 {t('days')}
                    </div>
                    <div className="text-xs font-medium mt-1">
                      {getLoadLevel(biweeklyWorkload.count)}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {weeklyWorkload.count > 6 && (
                  <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded text-xs">
                    <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5" />
                    <span className="text-orange-700 dark:text-orange-400">
                      {t('consider_redistributing_tasks')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs font-medium mb-2">{t('workload_levels')}:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { range: '0', label: t('idle'), color: 'bg-gray-100 dark:bg-gray-800' },
              { range: '1-2', label: t('light'), color: 'bg-green-100 dark:bg-green-900/30' },
              { range: '3-4', label: t('moderate'), color: 'bg-yellow-100 dark:bg-yellow-900/30' },
              { range: '5-6', label: t('busy'), color: 'bg-orange-100 dark:bg-orange-900/30' },
              { range: '7+', label: t('overloaded'), color: 'bg-red-100 dark:bg-red-900/30' },
            ].map((item) => (
              <div key={item.range} className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <span className="text-xs text-muted-foreground">
                  {item.range}: {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

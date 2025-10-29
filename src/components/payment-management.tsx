'use client';

import { Task, Client } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { DollarSign, AlertCircle, TrendingUp, Download } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { Progress } from './ui/progress';

interface PaymentManagementProps {
  tasks: Task[];
  clients: Client[];
}

export function PaymentManagement({ tasks, clients }: PaymentManagementProps) {
  const { t } = useLanguage();

  // Calculate payment stats
  const getPaymentStats = () => {
    const stats = {
      totalRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
    };
    
    clients.forEach(client => {
        stats.totalRevenue += client.total_payment || 0;
        stats.paidAmount += client.paid_amount || 0;
    });

    stats.pendingAmount = stats.totalRevenue - stats.paidAmount;

    // A task is overdue if its status is 'done' but its payment_status is not 'paid'
    tasks.forEach(task => {
        if (task.status === 'done' && task.payment_status !== 'paid' && task.client_payment) {
            // Find how much is unpaid for this task
            const client = clients.find(c => c.id === task.client_id);
            if(client) {
                 const clientTaskPayment = client.paid_amount || 0;
                 //This is a simplified logic. A real app would need to track payments per task.
                 //Here we assume if any payment is missing from total, all unpaid done tasks are overdue.
                 if(client.total_payment && client.paid_amount < client.total_payment) {
                     stats.overdueAmount += task.client_payment;
                 }
            }
        }
    });

    return stats;
  };

  const stats = getPaymentStats();
  const paymentProgress =
    stats.totalRevenue > 0 ? (stats.paidAmount / stats.totalRevenue) * 100 : 0;

  // Get revenue split by developer
  const getRevenueSplit = (task: Task) => {
    if (!task.client_payment) return null;

    const backendAmount = ((task.backend_share_pct || 0) / 100) * task.client_payment;
    const frontendAmount = ((task.frontend_share_pct || 0) / 100) * task.client_payment;

    return { backendAmount, frontendAmount };
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Task', 'Client', 'Amount', 'Backend Share', 'Frontend Share', 'Status', 'Due Date'];
    const rows = tasks
      .filter((t) => t.client_payment)
      .map((task) => {
        const split = getRevenueSplit(task);
        const client = clients.find((c) => c.id === task.client_id);
        return [
          task.title,
          client?.name || 'N/A',
          task.client_payment,
          split?.backendAmount || 0,
          split?.frontendAmount || 0,
          task.payment_status || 'pending',
          task.due_date || 'N/A',
        ].join(',');
      });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_revenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('paid')}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.paidAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pending')}</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${stats.pendingAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('overdue')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${stats.overdueAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('payment_progress')}</CardTitle>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('export')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={paymentProgress} className="h-4" />
          <p className="text-sm text-muted-foreground">
            {paymentProgress.toFixed(1)}% of total revenue collected
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

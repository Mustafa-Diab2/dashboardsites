'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { useLanguage } from '@/context/language-context';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { User, Task, Deduction } from '@/lib/data';
import { Banknote, FileDown, Sparkles, Loader2 } from 'lucide-react';
import { generateSalaryInsight, GenerateSalaryInsightInput } from '@/ai/flows/generate-salary-insights';

interface SalaryReportProps {
  users: User[];
  tasks: Task[];
}

export default function SalaryReport({ users, tasks }: SalaryReportProps) {
  const { t } = useLanguage();
  const { firestore } = useFirebase();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [insights, setInsights] = useState<Record<string, string | null>>({});
  const [isLoadingInsight, setIsLoadingInsight] = useState<Record<string, boolean>>({});

  const dateRange = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth, 1);
    return { start: startOfMonth(date), end: endOfMonth(date) };
  }, [selectedMonth, selectedYear]);

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'attendance'),
      where('clockIn', '>=', dateRange.start),
      where('clockIn', '<=', dateRange.end)
    );
  }, [firestore, dateRange]);
  const { data: attendanceRecords } = useCollection(attendanceQuery);

  const deductionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'deductions'),
      where('date', '>=', dateRange.start),
      where('date', '<=', dateRange.end)
    );
  }, [firestore, dateRange]);
  const { data: deductions } = useCollection(deductionsQuery);

  const salaryData = useMemo(() => {
    return users.map(user => {
      const userAttendance = attendanceRecords?.filter(rec => rec.userId === user.id) || [];
      const totalHours = userAttendance.reduce((acc, rec) => {
        if (rec.clockIn && rec.clockOut) {
          const clockIn = (rec.clockIn as Timestamp).toDate();
          const clockOut = (rec.clockOut as Timestamp).toDate();
          return acc + (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        }
        return acc;
      }, 0);

      const userDeductions = deductions?.filter(d => d.userId === user.id) as Deduction[] || [];
      const totalDeductions = userDeductions.reduce((acc, d) => acc + d.amount, 0);

      const hourlyRate = user.hourlyRate || 0;
      const grossSalary = totalHours * hourlyRate;
      const netSalary = grossSalary - totalDeductions;
      
      const completedTasks = tasks.filter(task => 
        task.assigned_to.includes(user.id) &&
        task.status === 'done' &&
        task.updatedAt &&
        (task.updatedAt as Timestamp).toDate() >= dateRange.start &&
        (task.updatedAt as Timestamp).toDate() <= dateRange.end
      ).length;

      return {
        userId: user.id,
        userName: user.fullName,
        hourlyRate,
        totalHours: parseFloat(totalHours.toFixed(2)),
        grossSalary: parseFloat(grossSalary.toFixed(2)),
        totalDeductions: parseFloat(totalDeductions.toFixed(2)),
        netSalary: parseFloat(netSalary.toFixed(2)),
        completedTasks
      };
    });
  }, [users, attendanceRecords, deductions, tasks, dateRange]);
  
  const handleGenerateInsight = async (userId: string) => {
    const userData = salaryData.find(d => d.userId === userId);
    if (!userData) return;

    setIsLoadingInsight(prev => ({ ...prev, [userId]: true }));
    setInsights(prev => ({ ...prev, [userId]: null }));

    const input: GenerateSalaryInsightInput = {
      userName: userData.userName,
      hourlyRate: userData.hourlyRate,
      totalHours: userData.totalHours,
      netSalary: userData.netSalary,
      completedTasks: userData.completedTasks,
      totalDeductions: userData.totalDeductions
    };

    try {
      const result = await generateSalaryInsight(input);
      setInsights(prev => ({ ...prev, [userId]: result.insight || t('no_insight_generated') }));
    } catch (e) {
      console.error(e);
      setInsights(prev => ({ ...prev, [userId]: t('failed_to_generate_insights') }));
    } finally {
      setIsLoadingInsight(prev => ({ ...prev, [userId]: false }));
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="font-headline flex items-center gap-2">
            <Banknote />
            {t('salary_report')}
          </CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map((month, idx) => <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-full sm:w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('employee_name')}</TableHead>
                <TableHead>{t('hourly_rate')}</TableHead>
                <TableHead>{t('total_hours')}</TableHead>
                <TableHead>{t('gross_salary')}</TableHead>
                <TableHead>{t('deductions')}</TableHead>
                <TableHead>{t('net_salary')}</TableHead>
                <TableHead>{t('completed_tasks_month')}</TableHead>
                <TableHead className="text-right">{t('performance_insight')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryData.map(row => (
                <TableRow key={row.userId}>
                  <TableCell className="font-medium">{row.userName}</TableCell>
                  <TableCell>{row.hourlyRate} {t('currency')}</TableCell>
                  <TableCell>{row.totalHours}</TableCell>
                  <TableCell>{row.grossSalary} {t('currency')}</TableCell>
                  <TableCell className="text-red-500">{row.totalDeductions} {t('currency')}</TableCell>
                  <TableCell className="font-semibold">{row.netSalary} {t('currency')}</TableCell>
                  <TableCell>{row.completedTasks}</TableCell>
                  <TableCell className="text-right">
                    {insights[row.userId] ? (
                        <p className="text-xs text-left">{insights[row.userId]}</p>
                    ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateInsight(row.userId)}
                          disabled={isLoadingInsight[row.userId]}
                        >
                          {isLoadingInsight[row.userId] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          {t('analyze')}
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

    
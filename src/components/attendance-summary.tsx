'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection } from '@/hooks/use-supabase-data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { CalendarDays, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, differenceInMinutes, eachDayOfInterval } from 'date-fns';
import { useUsers } from '@/hooks/use-users';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useLanguage } from '@/context/language-context';

export function AttendanceSummary({ userRole }: { userRole: string | undefined }) {
  const { user, role: supabaseRole } = useSupabase();
  const users = useUsers(userRole || supabaseRole);
  const { t } = useLanguage();
  const isAdmin = (userRole || supabaseRole) === 'admin';

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  useEffect(() => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
  }, []);

  const monthStart = useMemo(() => selectedMonth ? startOfMonth(new Date(selectedMonth)) : new Date(), [selectedMonth]);
  const monthEnd = useMemo(() => selectedMonth ? endOfMonth(new Date(selectedMonth)) : new Date(), [selectedMonth]);

  const fetchAttendance = useCallback((query: any) => {
    let q = query
      .gte('check_in', monthStart.toISOString())
      .lte('check_in', monthEnd.toISOString())
      .order('check_in', { ascending: false });

    if (!isAdmin && user) {
      q = q.eq('user_id', user.id);
    }
    return q;
  }, [monthStart, monthEnd, isAdmin, user]);

  const { data: attendanceData } = useSupabaseCollection(
    'attendance',
    fetchAttendance
  );

  const attendance = (attendanceData || []) as any[];

  const summary = useMemo(() => {
    if (!users || users.length === 0 || !selectedMonth) return [];

    const usersList = isAdmin ? users : users.filter(u => u.id === user?.id);
    const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const workingDays = allDaysInMonth.filter(day => {
      const dayOfWeek = day.getDay();
      return dayOfWeek !== 5 && dayOfWeek !== 6;
    });

    return usersList
      .filter(u => {
        if (!isAdmin || selectedUserId === 'all') return true;
        return u.id === selectedUserId;
      })
      .map(u => {
        const userAttendance = attendance.filter(a => a.user_id === u.id);

        const presentDays = new Set(
          userAttendance.map(a => format(new Date(a.check_in), 'yyyy-MM-dd'))
        ).size;

        const totalHours = userAttendance.reduce((sum, a) => {
          const checkIn = a.check_in;
          const checkOut = a.check_out;
          if (checkOut) {
            return sum + differenceInMinutes(new Date(checkOut), new Date(checkIn)) / 60;
          }
          return sum;
        }, 0);

        const lateDays = userAttendance.filter(a => {
          const clockInDate = new Date(a.check_in);
          const hours = clockInDate.getHours();
          const minutes = clockInDate.getMinutes();
          return hours > 9 || (hours === 9 && minutes > 30);
        }).length;

        const absentDays = Math.max(0, workingDays.length - presentDays);

        return {
          userId: u.id,
          userName: u.full_name || t('unknown_user'),
          totalDays: workingDays.length,
          presentDays,
          absentDays,
          lateDays,
          totalHours: Math.round(totalHours * 10) / 10,
          attendanceRate: workingDays.length > 0 ? Math.round((presentDays / workingDays.length) * 100) : 0,
        };
      });
  }, [users, attendance, isAdmin, user, monthStart, monthEnd, selectedUserId, t, selectedMonth]);

  const getAttendanceRateBadge = (rate: number) => {
    if (rate >= 95) return <Badge className="bg-green-500">{t('excellent')}</Badge>;
    if (rate >= 85) return <Badge className="bg-blue-500">{t('good')}</Badge>;
    if (rate >= 75) return <Badge className="bg-yellow-500">{t('fair')}</Badge>;
    return <Badge variant="destructive">{t('poor')}</Badge>;
  };

  const totalStats = useMemo(() => {
    if (summary.length === 0) return null;

    const avgAttendance = summary.reduce((sum, s) => sum + s.attendanceRate, 0) / summary.length;

    return {
      totalPresent: summary.reduce((sum, s) => sum + s.presentDays, 0),
      totalAbsent: summary.reduce((sum, s) => sum + s.absentDays, 0),
      totalLate: summary.reduce((sum, s) => sum + s.lateDays, 0),
      totalHours: summary.reduce((sum, s) => sum + s.totalHours, 0),
      avgAttendanceRate: isNaN(avgAttendance) ? 0 : Math.round(avgAttendance),
    };
  }, [summary]);

  if (!selectedMonth) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {t('attendance_summary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('loading')}...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {t('attendance_summary')}
          </CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const now = new Date();
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const value = format(date, 'yyyy-MM');
                const label = format(date, 'MMMM yyyy');
                return (
                  <SelectItem key={`month-${value}`} value={value}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && users && users.length > 0 && (
          <div className="flex items-center gap-3">
            <label htmlFor="attendance-user-filter" className="text-sm font-medium whitespace-nowrap">{t('filter_by_employee')}:</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="attendance-user-filter" className="w-[250px]">
                <SelectValue placeholder={t('all_employees')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_employees')}</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name || u.email || t('unknown_user')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUserId !== 'all' && (
              <button
                onClick={() => setSelectedUserId('all')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('clear_filter')}
              </button>
            )}
          </div>
        )}

        {totalStats && (isAdmin || summary.length === 1) && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('total_present')}</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                {totalStats.totalPresent}
                <TrendingUp className="w-4 h-4 text-green-500" />
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('total_absent')}</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                {totalStats.totalAbsent}
                <TrendingDown className="w-4 h-4 text-red-500" />
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('late_days')}</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                {totalStats.totalLate}
                <Clock className="w-4 h-4 text-yellow-500" />
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('total_hours')}</p>
              <p className="text-2xl font-bold">{Math.round(totalStats.totalHours)}h</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('avg_attendance')}</p>
              <p className="text-2xl font-bold">{totalStats.avgAttendanceRate}%</p>
            </div>
          </div>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>{t('employee')}</TableHead>}
                <TableHead>{t('working_days')}</TableHead>
                <TableHead>{t('present')}</TableHead>
                <TableHead>{t('absent')}</TableHead>
                <TableHead>{t('late_days')}</TableHead>
                <TableHead>{t('total_hours')}</TableHead>
                <TableHead>{t('attendance_rate')}</TableHead>
                <TableHead>{t('rating')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-muted-foreground">
                    {t('no_attendance_data')}
                  </TableCell>
                </TableRow>
              ) : (
                summary.map((row) => (
                  <TableRow key={row.userId}>
                    {isAdmin && <TableCell className="font-medium">{row.userName}</TableCell>}
                    <TableCell>{row.totalDays}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{row.presentDays}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">{row.absentDays}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-yellow-600 font-medium">{row.lateDays}</span>
                    </TableCell>
                    <TableCell>{row.totalHours}h</TableCell>
                    <TableCell>
                      <span className="font-medium">{row.attendanceRate}%</span>
                    </TableCell>
                    <TableCell>{getAttendanceRateBadge(row.attendanceRate)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

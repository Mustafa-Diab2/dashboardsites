'use client';

import { useMemo, useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { CalendarDays, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, differenceInMinutes, eachDayOfInterval } from 'date-fns';
import { useUsers } from '@/hooks/use-users';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function AttendanceSummary({ userRole }: { userRole: string | undefined }) {
  const { firestore, user } = useFirebase();
  const users = useUsers(userRole);
  const isAdmin = userRole === 'admin';

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const monthStart = useMemo(() => startOfMonth(new Date(selectedMonth)), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(new Date(selectedMonth)), [selectedMonth]);

  // Query attendance records for the selected month
  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    if (isAdmin) {
      // Admin sees all attendance
      return query(
        collection(firestore, 'attendance'),
        where('clockIn', '>=', monthStart),
        where('clockIn', '<=', monthEnd),
        orderBy('clockIn', 'desc')
      );
    } else {
      // Regular users see only their attendance
      return query(
        collection(firestore, 'attendance'),
        where('userId', '==', user.uid),
        where('clockIn', '>=', monthStart),
        where('clockIn', '<=', monthEnd),
        orderBy('clockIn', 'desc')
      );
    }
  }, [firestore, user, isAdmin, monthStart, monthEnd]);

  const { data: attendanceData } = useCollection(attendanceQuery);
  const attendance = (attendanceData || []) as any[];

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!users || users.length === 0) return [];

    const usersList = isAdmin ? users : users.filter(u => u.id === user?.uid);
    const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const workingDays = allDaysInMonth.filter(day => {
      const dayOfWeek = day.getDay();
      return dayOfWeek !== 5 && dayOfWeek !== 6; // Exclude Friday (5) and Saturday (6)
    });

    return usersList.map(u => {
      const userAttendance = attendance.filter(a => a.userId === u.id);

      const presentDays = new Set(
        userAttendance.map(a => format((a.clockIn as Timestamp).toDate(), 'yyyy-MM-dd'))
      ).size;

      const totalHours = userAttendance.reduce((sum, a) => {
        if (a.clockOut) {
          const clockInDate = (a.clockIn as Timestamp).toDate();
          const clockOutDate = (a.clockOut as Timestamp).toDate();
          return sum + differenceInMinutes(clockOutDate, clockInDate) / 60;
        }
        return sum;
      }, 0);

      // Count late days (after 9:30 AM)
      const lateDays = userAttendance.filter(a => {
        const clockInDate = (a.clockIn as Timestamp).toDate();
        const hours = clockInDate.getHours();
        const minutes = clockInDate.getMinutes();
        return hours > 9 || (hours === 9 && minutes > 30);
      }).length;

      const absentDays = workingDays.length - presentDays;

      return {
        userId: u.id,
        userName: (u as any).fullName || 'Unknown',
        totalDays: workingDays.length,
        presentDays,
        absentDays,
        lateDays,
        totalHours: Math.round(totalHours * 10) / 10,
        attendanceRate: Math.round((presentDays / workingDays.length) * 100),
      };
    });
  }, [users, attendance, isAdmin, user, monthStart, monthEnd]);

  const getAttendanceRateBadge = (rate: number) => {
    if (rate >= 95) return <Badge className="bg-green-500">Excellent</Badge>;
    if (rate >= 85) return <Badge className="bg-blue-500">Good</Badge>;
    if (rate >= 75) return <Badge className="bg-yellow-500">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const totalStats = useMemo(() => {
    if (summary.length === 0) return null;

    return {
      totalPresent: summary.reduce((sum, s) => sum + s.presentDays, 0),
      totalAbsent: summary.reduce((sum, s) => sum + s.absentDays, 0),
      totalLate: summary.reduce((sum, s) => sum + s.lateDays, 0),
      totalHours: summary.reduce((sum, s) => sum + s.totalHours, 0),
      avgAttendanceRate: Math.round(summary.reduce((sum, s) => sum + s.attendanceRate, 0) / summary.length),
    };
  }, [summary]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Attendance Summary
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
        {/* Overall Stats */}
        {totalStats && isAdmin && (
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Present</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                {totalStats.totalPresent}
                <TrendingUp className="w-4 h-4 text-green-500" />
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Absent</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                {totalStats.totalAbsent}
                <TrendingDown className="w-4 h-4 text-red-500" />
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Late Days</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                {totalStats.totalLate}
                <Clock className="w-4 h-4 text-yellow-500" />
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{Math.round(totalStats.totalHours)}h</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Avg Attendance</p>
              <p className="text-2xl font-bold">{totalStats.avgAttendanceRate}%</p>
            </div>
          </div>
        )}

        {/* Summary Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Working Days</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Late Days</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Attendance Rate</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-muted-foreground">
                    No attendance data for the selected month
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

'use client';

import { useState, useMemo } from "react";
import { Calendar, Clock, User, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { utils, writeFile } from 'xlsx';

export default function AttendanceAdmin() {
  const { firestore, user } = useFirebase();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  // Get date range for selected month
  const dateRange = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth, 1);
    return {
      start: startOfMonth(date),
      end: endOfMonth(date)
    };
  }, [selectedMonth, selectedYear]);

  // Query all users for filter
  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  const { data: users } = useCollection(usersQuery);

  // Query attendance records
  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    const constraints = [
      where('clockIn', '>=', dateRange.start),
      where('clockIn', '<=', dateRange.end),
      orderBy('clockIn', 'desc')
    ];

    if (selectedUserId !== "all") {
      constraints.unshift(where('userId', '==', selectedUserId));
    }

    return query(collection(firestore, 'attendance'), ...constraints);
  }, [firestore, dateRange, selectedUserId]);

  const { data: attendanceRecords, isLoading } = useCollection(attendanceQuery);

  // Format records with user names
  const formattedRecords = useMemo(() => {
    if (!attendanceRecords || !users) return [];

    return attendanceRecords.map(record => {
      const userInfo = users.find(u => u.id === record.userId);
      return {
        ...record,
        userName: userInfo ? `${(userInfo as any).fullName}` : 'Unknown',
        userRole: userInfo ? `${(userInfo as any).role}` : 'N/A',
      };
    });
  }, [attendanceRecords, users]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = new Map<string, {
      name: string;
      role: string;
      totalDays: number;
      totalHours: number;
      avgHoursPerDay: number;
    }>();

    formattedRecords.forEach(record => {
      if (!record.clockOut) return; // Skip incomplete records

      const key = record.userId;
      if (!stats.has(key)) {
        stats.set(key, {
          name: record.userName,
          role: record.userRole,
          totalDays: 0,
          totalHours: 0,
          avgHoursPerDay: 0,
        });
      }

      const stat = stats.get(key)!;
      const clockIn = (record.clockIn as Timestamp).toDate();
      const clockOut = (record.clockOut as Timestamp).toDate();
      const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

      stat.totalDays++;
      stat.totalHours += hours;
      stat.avgHoursPerDay = stat.totalHours / stat.totalDays;
    });

    return Array.from(stats.values());
  }, [formattedRecords]);

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'dd/MM/yyyy hh:mm a');
    }
    return 'Pending...';
  };

  const formatDuration = (clockIn: any, clockOut: any) => {
    if (!clockIn || !clockOut) return 'N/A';
    if (!clockIn.toDate || !clockOut.toDate) return 'Calculating...';

    const start = clockIn.toDate();
    const end = clockOut.toDate();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const exportToExcel = () => {
    const data = formattedRecords.map(record => ({
      'اسم الموظف': record.userName,
      'الدور': record.userRole,
      'تاريخ الحضور': formatDateTime(record.clockIn),
      'تاريخ الانصراف': formatDateTime(record.clockOut),
      'مدة العمل': formatDuration(record.clockIn, record.clockOut),
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Attendance');

    const fileName = `Attendance_${selectedYear}_${selectedMonth + 1}.xlsx`;
    writeFile(wb, fileName);
  };

  const months = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Calendar />
            تقرير الحضور والانصراف
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">الشهر</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">السنة</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">الموظف</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {(user as any).fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={exportToExcel} className="w-full">
                <Download className="mr-2" />
                تصدير Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {statistics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statistics.map(stat => (
            <Card key={stat.name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {stat.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{stat.role}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">أيام الحضور:</span>
                    <span className="font-medium">{stat.totalDays}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">إجمالي الساعات:</span>
                    <span className="font-medium">{stat.totalHours.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">متوسط الساعات/يوم:</span>
                    <span className="font-medium">{stat.avgHoursPerDay.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Clock />
            سجل الحضور التفصيلي
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8">جاري التحميل...</p>
          ) : formattedRecords.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">لا توجد سجلات للفترة المحددة</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الموظف</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>تاريخ الحضور</TableHead>
                    <TableHead>تاريخ الانصراف</TableHead>
                    <TableHead>مدة العمل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formattedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.userName}</TableCell>
                      <TableCell>{record.userRole}</TableCell>
                      <TableCell>{formatDateTime(record.clockIn)}</TableCell>
                      <TableCell>
                        {record.clockOut ? formatDateTime(record.clockOut) : (
                          <span className="text-yellow-600">لا يزال في العمل</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDuration(record.clockIn, record.clockOut)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

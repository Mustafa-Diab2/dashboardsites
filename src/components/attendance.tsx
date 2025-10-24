'use client';

import { Clock, LogIn, LogOut, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { useMutations } from "@/hooks/use-mutations";
import { collection, query, where, limit, serverTimestamp, orderBy, Timestamp } from "firebase/firestore";
import { useCollection } from "@/firebase";
import { useMemo } from "react";
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/context/language-context";

export default function Attendance() {
  const { user, firestore } = useFirebase();
  const { addDoc, updateDoc } = useMutations();
  const { t } = useLanguage();

  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const todayEnd = useMemo(() => endOfDay(new Date()), []);
  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7), []);

  // Query for an entry today that has been clocked in, but not out.
  const openAttendanceQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'attendance'),
        where('userId', '==', user.uid),
        where('clockOut', '==', null),
        limit(1)
    );
  }, [firestore, user]);
  
  // Query for an entry today that is fully completed (clocked in and out).
  const completedTodayQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "attendance"),
      where("userId", "==", user.uid),
      where("clockIn", ">=", todayStart),
      where("clockIn", "<=", todayEnd),
      where("clockOut", "!=", null),
      limit(1)
    );
  }, [firestore, user, todayStart, todayEnd]);

  const { data: openAttendanceData, isLoading: isLoadingOpen } = useCollection(openAttendanceQuery);
  const { data: completedTodayData, isLoading: isLoadingCompleted } = useCollection(completedTodayQuery);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'attendance'),
        where('userId', '==', user.uid),
        where('clockIn', '>=', sevenDaysAgo),
        orderBy('clockIn', 'desc'),
        limit(10)
    );
  }, [firestore, user, sevenDaysAgo]);

  const { data: historyData } = useCollection(historyQuery);
  
  const isLoading = isLoadingOpen || isLoadingCompleted;

  const openAttendance = useMemo(() => {
    if (!openAttendanceData || openAttendanceData.length === 0) return null;
    const record = openAttendanceData[0];
    const clockInDate = (record.clockIn as Timestamp)?.toDate();
    // Ensure the open record is from today
    if (clockInDate && clockInDate >= todayStart && clockInDate <= todayEnd) {
      return record;
    }
    return null;
  }, [openAttendanceData, todayStart, todayEnd]);

  const completedAttendance = useMemo(() => (completedTodayData && completedTodayData.length > 0) ? completedTodayData[0] : null, [completedTodayData]);

  const handleClockIn = () => {
    if (!firestore || !user) return;
    addDoc('attendance', {
      userId: user.uid,
      clockIn: serverTimestamp(),
      clockOut: null,
    });
  };

  const handleClockOut = () => {
    if (!firestore || !openAttendance) return;
    updateDoc('attendance', openAttendance.id, {
      clockOut: serverTimestamp(),
    });
  };
  
  const canClockIn = !isLoading && !openAttendance && !completedAttendance;
  const canClockOut = !isLoading && !!openAttendance;
  
  const formatTime = (timestamp: any) => {
    if (!timestamp) return t('n_a');
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'p');
    }
    return t('pending');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return t('n_a');
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'dd/MM/yyyy');
    }
    return t('n_a');
  };

  const formatDuration = (clockIn: any, clockOut: any) => {
    if (!clockIn || !clockOut) return t('n_a');
    if (!clockIn.toDate || !clockOut.toDate) return t('in_progress');

    const start = clockIn.toDate();
    const end = clockOut.toDate();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}${t('hours_short')} ${minutes}${t('minutes_short')}`;
  };
  
  let statusText = t('not_clocked_in');
  let statusDetails = t('not_clocked_in_desc');

  if (openAttendance) {
    statusText = t('clocked_in');
    statusDetails = `${t('in')}: ${formatTime(openAttendance.clockIn)} | ${t('out')}: ${t('pending')}`;
  } else if (completedAttendance) {
    statusText = t('clocked_out');
    statusDetails = `${t('in')}: ${formatTime(completedAttendance.clockIn)} | ${t('out')}: ${formatTime(completedAttendance.clockOut)}`;
  }


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Clock />
            {t('attendance')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p>{t('loading_attendance_status')}</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
              <div className="text-center sm:text-left">
                  <p className="font-medium">
                    {t('status')}: {statusText}
                  </p>
                  <p className="text-sm text-muted-foreground">
                      {statusDetails}
                  </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleClockIn} disabled={!canClockIn} variant={canClockIn ? 'default' : 'secondary'}>
                  <LogIn className="mr-2" /> {t('clock_in')}
                </Button>
                <Button onClick={handleClockOut} disabled={!canClockOut} variant={canClockOut ? 'default' : 'outline'}>
                  <LogOut className="mr-2" /> {t('clock_out')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {historyData && historyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              {t('last_7_days')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('clock_in')}</TableHead>
                    <TableHead>{t('clock_out')}</TableHead>
                    <TableHead>{t('duration')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{formatDate(record.clockIn)}</TableCell>
                      <TableCell>{formatTime(record.clockIn)}</TableCell>
                      <TableCell>
                        {record.clockOut ? formatTime(record.clockOut) : (
                          <span className="text-yellow-600">{t('in_progress')}</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDuration(record.clockIn, record.clockOut)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

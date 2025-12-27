'use client';

import { Clock, LogIn, LogOut, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useSupabase } from "@/context/supabase-context";
import { useSupabaseCollection } from "@/hooks/use-supabase-data";
import { useMutations } from "@/hooks/use-mutations";
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
  const { user } = useSupabase();
  const { addDoc, updateDoc } = useMutations();
  const { t } = useLanguage();

  const todayStart = useMemo(() => startOfDay(new Date()).toISOString(), []);
  const todayEnd = useMemo(() => endOfDay(new Date()).toISOString(), []);
  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7).toISOString(), []);

  const { data: openAttendanceData, isLoading: isLoadingOpen } = useSupabaseCollection(
    'attendance',
    (query) => {
      if (!user) return query;
      return query
        .eq('user_id', user.id)
        .is('check_out', null)
        .limit(1);
    }
  );

  const { data: completedTodayData, isLoading: isLoadingCompleted } = useSupabaseCollection(
    'attendance',
    (query) => {
      if (!user) return query;
      return query
        .eq('user_id', user.id)
        .gte('check_in', todayStart)
        .lte('check_in', todayEnd)
        .not('check_out', 'is', null)
        .limit(1);
    }
  );

  const { data: historyData } = useSupabaseCollection(
    'attendance',
    (query) => {
      if (!user) return query;
      return query
        .eq('user_id', user.id)
        .gte('check_in', sevenDaysAgo)
        .order('check_in', { ascending: false })
        .limit(10);
    }
  );

  const isLoading = isLoadingOpen || isLoadingCompleted;

  const openAttendance = openAttendanceData?.[0] || null;
  const completedAttendance = completedTodayData?.[0] || null;

  const handleClockIn = () => {
    if (!user) return;
    addDoc('attendance', {
      user_id: user.id,
      check_in: new Date().toISOString(),
      check_out: null,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleClockOut = () => {
    if (!openAttendance) return;
    updateDoc('attendance', openAttendance.id, {
      check_out: new Date().toISOString(),
    });
  };

  const canClockIn = !isLoading && !openAttendance && !completedAttendance;
  const canClockOut = !isLoading && !!openAttendance;

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return t('n_a');
    return format(new Date(timeStr), 'p');
  };

  const formatDate = (timeStr: string | null) => {
    if (!timeStr) return t('n_a');
    return format(new Date(timeStr), 'dd/MM/yyyy');
  };

  const formatDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkIn || !checkOut) return t('n_a');

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}${t('hours_short')} ${minutes}${t('minutes_short')}`;
  };

  let statusText = t('not_clocked_in');
  let statusDetails = t('not_clocked_in_desc');

  if (openAttendance) {
    statusText = t('clocked_in');
    statusDetails = `${t('in')}: ${formatTime(openAttendance.check_in)} | ${t('out')}: ${t('pending')}`;
  } else if (completedAttendance) {
    statusText = t('clocked_out');
    statusDetails = `${t('in')}: ${formatTime(completedAttendance.check_in)} | ${t('out')}: ${formatTime(completedAttendance.check_out)}`;
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
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={handleClockIn} disabled={!canClockIn} variant={canClockIn ? 'default' : 'secondary'} className="w-full">
                  <LogIn className="mr-2 h-4 w-4" /> {t('clock_in')}
                </Button>
                <Button onClick={handleClockOut} disabled={!canClockOut} variant={canClockOut ? 'destructive' : 'outline'} className="w-full">
                  <LogOut className="mr-2 h-4 w-4" /> {t('clock_out')}
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
                      <TableCell className="font-medium">{formatDate(record.check_in)}</TableCell>
                      <TableCell>{formatTime(record.check_in)}</TableCell>
                      <TableCell>
                        {record.check_out ? formatTime(record.check_out) : (
                          <span className="text-yellow-600">{t('in_progress')}</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDuration(record.check_in, record.check_out)}</TableCell>
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

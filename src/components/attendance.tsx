'use client';

import { Clock, LogIn, LogOut, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { useMutations } from "@/hooks/use-mutations";
import { collection, query, where, limit, serverTimestamp, orderBy, Timestamp, and } from "firebase/firestore";
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

export default function Attendance() {
  const { user, firestore } = useFirebase();
  const { addDoc, updateDoc } = useMutations();

  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const todayEnd = useMemo(() => endOfDay(new Date()), []);
  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7), []);

  // Query for an attendance record created today that has NOT been clocked out.
  const openAttendanceQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'attendance'),
        where('userId', '==', user.uid),
        where('clockIn', '>=', todayStart),
        where('clockIn', '<=', todayEnd),
        where('clockOut', '==', null),
        limit(1)
    );
  }, [firestore, user, todayStart, todayEnd]);

  // Query for an attendance record created today that HAS been clocked out.
  const completedAttendanceQuery = useMemoFirebase(() => {
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
  const { data: completedAttendanceData, isLoading: isLoadingCompleted } = useCollection(completedAttendanceQuery);

  // Query for last 7 days history
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
    if (openAttendanceData && openAttendanceData.length > 0) {
      return openAttendanceData[0];
    }
    return null;
  }, [openAttendanceData]);
  
  const completedAttendance = useMemo(() => {
    if (completedAttendanceData && completedAttendanceData.length > 0) {
      return completedAttendanceData[0];
    }
    return null;
  }, [completedAttendanceData]);

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
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'p');
    }
    return 'Pending...';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'dd/MM/yyyy');
    }
    return 'N/A';
  };

  const formatDuration = (clockIn: any, clockOut: any) => {
    if (!clockIn || !clockOut) return 'N/A';
    if (!clockIn.toDate || !clockOut.toDate) return 'In Progress';

    const start = clockIn.toDate();
    const end = clockOut.toDate();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };
  
  let statusText = 'Not Clocked In';
  let statusDetails = "You have not clocked in today.";

  if (openAttendance) {
    statusText = 'Clocked In';
    statusDetails = `In: ${formatTime(openAttendance.clockIn)} | Out: Pending...`;
  } else if (completedAttendance) {
    statusText = 'Clocked Out';
    statusDetails = `In: ${formatTime(completedAttendance.clockIn)} | Out: ${formatTime(completedAttendance.clockOut)}`;
  }


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Clock />
            Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p>Loading attendance status...</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
              <div className="text-center sm:text-left">
                  <p className="font-medium">
                    Status: {statusText}
                  </p>
                  <p className="text-sm text-muted-foreground">
                      {statusDetails}
                  </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleClockIn} disabled={!canClockIn} variant={canClockIn ? 'default' : 'secondary'}>
                  <LogIn className="mr-2" /> Clock In
                </Button>
                <Button onClick={handleClockOut} disabled={!canClockOut} variant={canClockOut ? 'default' : 'outline'}>
                  <LogOut className="mr-2" /> Clock Out
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {historyData && historyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{formatDate(record.clockIn)}</TableCell>
                      <TableCell>{formatTime(record.clockIn)}</TableCell>
                      <TableCell>
                        {record.clockOut ? formatTime(record.clockOut) : (
                          <span className="text-yellow-600">In Progress</span>
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

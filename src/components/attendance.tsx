'use client';

import { Clock, LogIn, LogOut, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { useMutations } from "@/hooks/use-mutations";
import { collection, query, where, limit, serverTimestamp, orderBy, Timestamp } from "firebase/firestore";
import { useCollection } from "@/firebase";
import { useMemo } from "react";
import { format, subDays } from 'date-fns';
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

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7), []);

  // Query for today's attendance
  const todayAttendanceQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'attendance'),
        where('userId', '==', user.uid),
        where('clockIn', '>=', today),
        limit(1)
    );
  }, [firestore, user, today]);

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

  const { data: attendanceData, isLoading } = useCollection(todayAttendanceQuery);
  const { data: historyData } = useCollection(historyQuery);

  const latestAttendance = useMemo(() => {
    if (attendanceData && attendanceData.length > 0) {
      return attendanceData[0];
    }
    return null;
  }, [attendanceData]);

  const handleClockIn = () => {
    if (!firestore || !user) return;
    addDoc('attendance', {
      userId: user.uid,
      clockIn: serverTimestamp(),
      clockOut: null,
    });
  };

  const handleClockOut = () => {
    if (!firestore || !latestAttendance) return;
    updateDoc('attendance', latestAttendance.id, {
      clockOut: serverTimestamp(),
    });
  };
  
  const isClockedIn = latestAttendance && !latestAttendance.clockOut;
  const isClockedOut = latestAttendance && latestAttendance.clockOut;
  
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
                    Status: {isClockedIn ? 'Clocked In' : (isClockedOut ? 'Clocked Out' : 'Not Clocked In')}
                  </p>
                  {latestAttendance && (
                      <p className="text-sm text-muted-foreground">
                          In: {formatTime(latestAttendance.clockIn)} | Out: {formatTime(latestAttendance.clockOut)}
                      </p>
                  )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleClockIn} disabled={isClockedIn || isClockedOut} className="flex-1">
                  <LogIn className="mr-2" /> Clock In
                </Button>
                <Button onClick={handleClockOut} disabled={!isClockedIn} variant="outline" className="flex-1">
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

'use client';

import { Clock, LogIn, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { useMutations } from "@/hooks/use-mutations";
import { collection, query, where, limit, serverTimestamp } from "firebase/firestore";
import { useCollection } from "@/firebase";
import { useMemo } from "react";
import { format } from 'date-fns';

export default function Attendance() {
  const { user, firestore } = useFirebase();
  const { addDoc, updateDoc } = useMutations();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'attendance'),
        where('userId', '==', user.uid),
        where('clockIn', '>=', today),
        limit(1)
    );
  }, [firestore, user, today]);

  const { data: attendanceData, isLoading } = useCollection(attendanceQuery);

  const latestAttendance = useMemo(() => {
    if (attendanceData && attendanceData.length > 0) {
      return attendanceData[0];
    }
    return null;
  }, [attendanceData]);

  const handleClockIn = () => {
    if (!firestore || !user) return;
    const attendanceCollection = collection(firestore, 'attendance');
    addDoc(attendanceCollection, {
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
    // Firebase server timestamp can be null or a pending timestamp object before it's set.
    // Once it's set, it's a Firestore Timestamp object.
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'p');
    }
    return 'Pending...';
  };

  return (
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
  );
}

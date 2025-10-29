'use client';

import { useState, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, where, serverTimestamp, Timestamp, doc } from 'firebase/firestore';
import { useMutations } from '@/hooks/use-mutations';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Calendar, Plus, Check, X, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useUsers } from '@/hooks/use-users';
import type { Leave } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export function LeaveManagement({ userRole }: { userRole: string | undefined }) {
  const { firestore, user } = useFirebase();
  const { addDoc, updateDoc } = useMutations();
  const { t } = useLanguage();
  const { toast } = useToast();
  const users = useUsers(userRole);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'annual' as Leave['type'],
    startDate: '',
    endDate: '',
    reason: '',
  });

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData } = useDoc(userDocRef);
  const isAdmin = (userData as any)?.role === 'admin';

  // Query leaves
  const leavesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    if (isAdmin) {
      // Admin sees all leaves
      return query(
        collection(firestore, 'leaves'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Regular users see only their leaves
      return query(
        collection(firestore, 'leaves'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }
  }, [firestore, user, isAdmin]);

  const { data: leavesData } = useCollection(leavesQuery);
  const leaves = (leavesData as Leave[]) || [];

  const handleSubmit = async () => {
    if (!firestore || !user || !formData.startDate || !formData.endDate) {
      toast({ variant: 'destructive', title: t('error_title'), description: 'Please fill all required fields' });
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const days = differenceInDays(endDate, startDate) + 1;

    if (days <= 0) {
      toast({ variant: 'destructive', title: t('error_title'), description: 'End date must be after start date' });
      return;
    }

    const userName = users?.find(u => u.id === user.uid);

    try {
      await addDoc('leaves', {
        userId: user.uid,
        userName: (userName as any)?.fullName || user.email,
        type: formData.type,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        days,
        reason: formData.reason,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Leave Request Submitted', description: 'Your leave request has been submitted for approval' });
      setDialogOpen(false);
      setFormData({ type: 'annual', startDate: '', endDate: '', reason: '' });
    } catch (error) {
      console.error('Error submitting leave:', error);
      toast({ variant: 'destructive', title: t('error_title'), description: t('error_desc') });
    }
  };

  const handleApprove = async (leaveId: string) => {
    if (!isAdmin) return;

    try {
      await updateDoc('leaves', leaveId, {
        status: 'approved',
        approvedBy: user?.uid,
        approvedAt: serverTimestamp(),
      });

      toast({ title: 'Leave Approved', description: 'Leave request has been approved' });
    } catch (error) {
      console.error('Error approving leave:', error);
      toast({ variant: 'destructive', title: t('error_title'), description: t('error_desc') });
    }
  };

  const handleReject = async (leaveId: string) => {
    if (!isAdmin) return;

    try {
      await updateDoc('leaves', leaveId, {
        status: 'rejected',
        approvedBy: user?.uid,
        approvedAt: serverTimestamp(),
      });

      toast({ title: 'Leave Rejected', description: 'Leave request has been rejected' });
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast({ variant: 'destructive', title: t('error_title'), description: t('error_desc') });
    }
  };

  const getStatusBadge = (status: Leave['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const getLeaveTypeLabel = (type: Leave['type']) => {
    const types = {
      sick: 'Sick Leave',
      annual: 'Annual Leave',
      unpaid: 'Unpaid Leave',
      emergency: 'Emergency Leave',
      other: 'Other',
    };
    return types[type] || type;
  };

  const stats = useMemo(() => {
    const approved = leaves.filter(l => l.status === 'approved');
    const pending = leaves.filter(l => l.status === 'pending');
    const totalDays = approved.reduce((sum, l) => sum + l.days, 0);

    return { approved: approved.length, pending: pending.length, totalDays };
  }, [leaves]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Leave Management
          </CardTitle>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Request Leave
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold">{stats.approved}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Days</p>
            <p className="text-2xl font-bold">{stats.totalDays}</p>
          </div>
        </div>

        {/* Leaves Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-muted-foreground">
                    No leave requests found
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    {isAdmin && <TableCell className="font-medium">{leave.userName}</TableCell>}
                    <TableCell>{getLeaveTypeLabel(leave.type)}</TableCell>
                    <TableCell>{format((leave.startDate as Timestamp).toDate(), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format((leave.endDate as Timestamp).toDate(), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{leave.days}</TableCell>
                    <TableCell className="max-w-xs truncate">{leave.reason || '-'}</TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        {leave.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleApprove(leave.id)}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(leave.id)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Request Leave Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
            <DialogDescription>Submit a leave request for approval</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Leave Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Leave['type'] })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="emergency">Emergency Leave</SelectItem>
                  <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please provide a reason for your leave request"
              />
            </div>

            {formData.startDate && formData.endDate && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  Total days: <span className="font-bold">{differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) + 1}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

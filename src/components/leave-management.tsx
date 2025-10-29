'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Calendar, Plus, Check, X, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useUsers } from '@/hooks/use-users';
import type { Leave } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type LeaveAction = 'approve' | 'reject' | null;

export function LeaveManagement({ userRole }: { userRole: string | undefined }) {
  const { firestore, user } = useFirebase();
  const { addDoc, updateDoc } = useMutations();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const users = useUsers(userRole);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [formData, setFormData] = useState({
    type: 'annual' as Leave['type'],
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [confirmAction, setConfirmAction] = useState<{ action: LeaveAction; leaveId: string | null }>({ action: null, leaveId: null });

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData } = useDoc(userDocRef);
  const isAdmin = (userData as any)?.role === 'admin';

  // Query leaves
  const leavesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'leaves'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: leavesData } = useCollection(leavesQuery);
  const allLeaves = (leavesData as Leave[]) || [];
  
  const leaves = useMemo(() => {
    let filtered = allLeaves;

    // Filter by user role
    if (!isAdmin) {
      filtered = filtered.filter(l => l.userId === user?.uid);
    }

    // Filter by selected user (admin only)
    if (isAdmin && selectedUserId !== 'all') {
      filtered = filtered.filter(l => l.userId === selectedUserId);
    }

    return filtered;
  }, [allLeaves, isAdmin, user, selectedUserId]);

  // Query chat messages for auto-extraction (admin only)
  const chatQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'chat'), orderBy('timestamp', 'desc'));
  }, [firestore, isAdmin]);

  const { data: chatData } = useCollection(chatQuery);
  const chatMessages = (chatData || []) as any[];

   // Extract leave requests from admin chat messages
  useEffect(() => {
    if (!isAdmin || !chatMessages || !users || !firestore) return;

    const processedMessageIds = new Set(allLeaves.filter(l => l.extractedFromChatMessageId).map(l => l.extractedFromChatMessageId));

    chatMessages.forEach((msg) => {
      // Skip if message doesn't have required fields or already processed
      if (!msg.id || !msg.text || !msg.userId || processedMessageIds.has(msg.id)) return;

      const messageUser = users.find(u => u.id === msg.userId);
      if (!messageUser || (messageUser as any).role !== 'admin') return;

      const text = msg.text?.toLowerCase() || '';

      const leavePatterns = [
        /([^\s]+(?:\s+[^\s]+)?)\s+(?:عايز|عايزة|طلب|طلبت|wants?|needs?|requested?)\s+(?:.*?)(?:إجازة|اجازة|أجازة|leave)/gi,
        /(?:إجازة|اجازة|أجازة|leave)\s+(?:لـ|ل|for)\s+([^\s]+(?:\s+[^\s]+)?)/gi,
      ];
      
      for(const pattern of leavePatterns) {
          const matches = [...text.matchAll(pattern)];
          for(const match of matches) {
            const targetName = match[1]?.trim();
            if (!targetName) continue;

            const targetUser = users.find(u => {
              const fullName = (u as any).fullName?.toLowerCase() || '';
              const targetNameLower = targetName.toLowerCase();
              return fullName.includes(targetNameLower) ||
                     fullName.split(/\s+/).some(part => part.startsWith(targetNameLower)) ||
                     targetNameLower.split(/\s+/).some(part => fullName.includes(part) && part.length > 2);
            });

            if (targetUser) {
              const startDate = new Date();
              const endDate = new Date();
              let reason = `${t('auto_extracted_from_chat')}: "${msg.text.substring(0, 100)}"`;

              if (text.includes('بكرة') || text.includes('tomorrow')) {
                startDate.setDate(startDate.getDate() + 1);
                endDate.setDate(endDate.getDate() + 1);
              } else if (text.includes('الأسبوع الجاي') || text.includes('next week')) {
                  startDate.setDate(startDate.getDate() + 7);
                  endDate.setDate(endDate.getDate() + 7);
              }

              const days = differenceInDays(endDate, startDate) + 1;

              try {
                addDoc('leaves', {
                  userId: targetUser.id,
                  userName: (targetUser as any).fullName,
                  type: 'annual',
                  startDate: Timestamp.fromDate(startDate),
                  endDate: Timestamp.fromDate(endDate),
                  days,
                  reason,
                  status: 'pending',
                  createdAt: serverTimestamp(),
                  extractedFromChatMessageId: msg.id,
                });
                processedMessageIds.add(msg.id); // Mark as processed
                return; // Exit after first successful match
              } catch (error) {
                console.error('Error creating auto-leave:', error);
              }
            }
        }
      }
    });
  }, [chatMessages, users, isAdmin, allLeaves, firestore, addDoc, t]);


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

      toast({ title: t('leave_request_submitted_title'), description: t('leave_request_submitted_desc') });
      setDialogOpen(false);
      setFormData({ type: 'annual', startDate: '', endDate: '', reason: '' });
    } catch (error) {
      console.error('Error submitting leave:', error);
      toast({ variant: 'destructive', title: t('error_title'), description: t('error_desc') });
    }
  };

  const handleConfirmAction = () => {
    const { action, leaveId } = confirmAction;
    if (!leaveId || !user) return;

    const leave = allLeaves.find(l => l.id === leaveId);
    if (!leave) return;
  
    const status = action === 'approve' ? 'approved' : 'rejected';
    const notificationMessage = action === 'approve' 
        ? `${t('leave_approved_for')} @${leave.userName}`
        : `${t('leave_rejected_for')} @${leave.userName}`;

    // Update leave status
    updateDoc('leaves', leaveId, {
        status,
        approvedBy: user.uid,
        approvedAt: serverTimestamp(),
    });

    // Send chat notification
    addDoc('chat', {
        userId: user.uid,
        userName: user.displayName,
        text: notificationMessage,
        timestamp: serverTimestamp(),
    });
  
    if (action === 'approve') {
      toast({ title: t('leave_approved_title'), description: t('leave_approved_desc') });
    } else if (action === 'reject') {
      toast({ title: t('leave_rejected_title'), description: t('leave_rejected_desc') });
    }
    setConfirmAction({ action: null, leaveId: null });
  };


  const getStatusBadge = (status: Leave['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> {t('approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> {t('rejected')}</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {t('pending')}</Badge>;
    }
  };

  const getLeaveTypeLabel = (type: Leave['type']) => {
    const types: Record<Leave['type'], string> = {
      sick: t('sick_leave'),
      annual: t('annual_leave'),
      unpaid: t('unpaid_leave'),
      emergency: t('emergency_leave'),
      other: t('other'),
    };
    return types[type] || type;
  };
  
  const autoExtractedCount = useMemo(() => allLeaves.filter(l => l.extractedFromChatMessageId).length, [allLeaves]);

  const stats = useMemo(() => {
    const approved = leaves.filter(l => l.status === 'approved');
    const pending = leaves.filter(l => l.status === 'pending');
    const totalDays = approved.reduce((sum, l) => sum + l.days, 0);

    return { approved: approved.length, pending: pending.length, totalDays };
  }, [leaves]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('leave_management')}
             {isAdmin && autoExtractedCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                <MessageSquare className="w-3 h-3 mr-1" />
                {autoExtractedCount} {t('from_chat')}
              </Badge>
            )}
          </CardTitle>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('request_leave')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('approved_leaves')}</p>
            <p className="text-2xl font-bold">{stats.approved}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('pending_requests')}</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('total_leave_days')}</p>
            <p className="text-2xl font-bold">{stats.totalDays}</p>
          </div>
        </div>
        
        {/* User Filter (Admin only) */}
        {isAdmin && users && users.length > 0 && (
          <div className="flex items-center gap-3">
            <Label htmlFor="user-filter" className="whitespace-nowrap">{t('filter_by_employee')}:</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user-filter" className="w-[250px]">
                <SelectValue placeholder={t('all_employees')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_employees')}</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {(u as any).fullName || u.email || t('unknown_user')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUserId !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedUserId('all')}>
                {t('clear_filter')}
              </Button>
            )}
          </div>
        )}

        {isAdmin && (
             <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">{t('auto_extraction_enabled')}</p>
                <p className="text-blue-700 dark:text-blue-300">
                    {t('auto_extraction_desc_leaves')}
                </p>
                </div>
            </div>
        )}

        {/* Leaves Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>{t('employee')}</TableHead>}
                <TableHead>{t('leave_type')}</TableHead>
                <TableHead>{t('start_date')}</TableHead>
                <TableHead>{t('end_date')}</TableHead>
                <TableHead>{t('days')}</TableHead>
                <TableHead>{t('reason')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                 {isAdmin && <TableHead>{t('source')}</TableHead>}
                {isAdmin && <TableHead>{t('actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 7} className="text-center text-muted-foreground">
                    {t('no_leave_requests')}
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
                            {leave.extractedFromChatMessageId ? (
                            <Badge variant="secondary" className="text-xs">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {t('chat')}
                            </Badge>
                            ) : (
                            <Badge variant="outline" className="text-xs">
                                {t('manual')}
                            </Badge>
                            )}
                        </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
                        {leave.status === 'pending' && (
                           <div className="flex gap-2">
                            <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setConfirmAction({ action: 'approve', leaveId: leave.id })}>
                                  <Check className="w-4 h-4" />
                                </Button>
                            </AlertDialogTrigger>
                             <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" onClick={() => setConfirmAction({ action: 'reject', leaveId: leave.id })}>
                                  <X className="w-4 h-4" />
                                </Button>
                             </AlertDialogTrigger>
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

    </Card>

      {/* Action Confirmation Dialog */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('leave_action_confirm_desc', { action: t(confirmAction.action || '') })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmAction({ action: null, leaveId: null })}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmAction}>{t('confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>

      {/* Request Leave Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('request_leave')}</DialogTitle>
            <DialogDescription>{t('submit_leave_request_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="type">{t('leave_type')}</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Leave['type'] })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">{t('annual_leave')}</SelectItem>
                  <SelectItem value="sick">{t('sick_leave')}</SelectItem>
                  <SelectItem value="emergency">{t('emergency_leave')}</SelectItem>
                  <SelectItem value="unpaid">{t('unpaid_leave')}</SelectItem>
                  <SelectItem value="other">{t('other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">{t('start_date')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">{t('end_date')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">{t('reason')}</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={t('leave_reason_placeholder')}
              />
            </div>

            {formData.startDate && formData.endDate && (differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) + 1) > 0 && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  {t('total_days')}: <span className="font-bold">{differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) + 1}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSubmit}>{t('submit_request')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

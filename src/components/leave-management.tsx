'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection, useSupabaseDoc } from '@/hooks/use-supabase-data';
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

const INITIAL_FORM_STATE = {
  type: 'annual' as Leave['type'],
  startDate: '',
  endDate: '',
  reason: '',
};

export function LeaveManagement({ userRole }: { userRole: string | undefined }) {
  const { user, role: supabaseRole } = useSupabase();
  const { addDoc, updateDoc } = useMutations();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const users = useUsers(userRole || supabaseRole);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  useEffect(() => {
    setFormData(prev => ({ ...prev, startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd') }))
  }, [])


  const [confirmAction, setConfirmAction] = useState<{ action: LeaveAction; leaveId: string | null }>({ action: null, leaveId: null });

  const isAdmin = supabaseRole === 'admin';

  const fetchLeaves = useCallback((query: any) => query.order('created_at', { ascending: false }), []);

  const { data: leavesData } = useSupabaseCollection(
    'leaves',
    fetchLeaves
  );

  const allLeaves = (leavesData as any[]) || [];

  const leaves = useMemo(() => {
    let filtered = allLeaves;

    if (!isAdmin && user) {
      filtered = filtered.filter(l => l.user_id === user.id);
    }

    if (isAdmin && selectedUserId !== 'all') {
      filtered = filtered.filter(l => l.user_id === selectedUserId);
    }

    return filtered;
  }, [allLeaves, isAdmin, user, selectedUserId]);

  const { data: chatData } = useSupabaseCollection(
    'chat',
    (query) => isAdmin ? query.order('timestamp', { ascending: false }).limit(100) : query.limit(0)
  );

  const chatMessages = (chatData || []) as any[];

  const processedMessagesRef = useRef<Set<string>>(new Set());

  // استخدام refs للـ stable dependencies
  const addDocRef = useRef(addDoc);
  const tRef = useRef(t);
  
  useEffect(() => {
    addDocRef.current = addDoc;
    tRef.current = t;
  }, [addDoc, t]);

  useEffect(() => {
    if (!isAdmin || !chatMessages || !users || chatMessages.length === 0 || users.length === 0) return;

    // Process only new messages that haven't been processed yet
    const newMessages = chatMessages.filter(msg => 
      msg.id && 
      msg.text && 
      msg.user_id && 
      !processedMessagesRef.current.has(msg.id)
    );

    if (newMessages.length === 0) return;

    newMessages.forEach((msg) => {
      const text = msg.text?.toLowerCase() || '';

      const leavePatterns = [
        /([^\s]+(?:\s+[^\s]+)?)\s+(?:عايز|عايزة|طلب|طلبت|wants?|needs?|requested?)\s+(?:.*?)(?:إجازة|اجازة|أجازة|leave)/gi,
        /(?:إجازة|اجازة|أجازة|leave)\s+(?:لـ|ل|for)\s+([^\s]+(?:\s+[^\s]+)?)/gi,
      ];

      for (const pattern of leavePatterns) {
        const matches = [...text.matchAll(pattern)];
        for (const match of matches) {
          const targetName = match[1]?.trim();
          if (!targetName) continue;

          const targetUser = users.find(u => {
            const fullName = (u.full_name || '').toLowerCase();
            const targetNameLower = targetName.toLowerCase();
            return fullName.includes(targetNameLower);
          });

          if (targetUser) {
            const startDate = new Date();
            const endDate = new Date();
            let reason = `${tRef.current('auto_extracted_from_chat')}: "${msg.text.substring(0, 100)}"`;

            if (text.includes('بكرة') || text.includes('tomorrow')) {
              startDate.setDate(startDate.getDate() + 1);
              endDate.setDate(endDate.getDate() + 1);
            } else if (text.includes('الأسبوع الجاي') || text.includes('next week')) {
              startDate.setDate(startDate.getDate() + 7);
              endDate.setDate(endDate.getDate() + 7);
            }

            const days = differenceInDays(endDate, startDate) + 1;

            // Mark message as processed
            processedMessagesRef.current.add(msg.id);

            addDocRef.current('leaves', {
              user_id: targetUser.id,
              user_name: targetUser.full_name,
              type: 'annual',
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              days,
              reason,
              status: 'pending',
              created_at: new Date().toISOString(),
              extracted_from_chat_message_id: msg.id,
            });
            return;
          }
        }
      }
    });
  }, [chatMessages, users, isAdmin]); // stable dependencies فقط


  const handleSubmit = async () => {
    if (!user || !formData.startDate || !formData.endDate) {
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

    const userNameFound = users?.find(u => u.id === user.id);

    try {
      await addDoc('leaves', {
        user_id: user.id,
        user_name: userNameFound?.full_name || user.email,
        type: formData.type,
        start_date: formData.startDate,
        end_date: formData.endDate,
        days,
        reason: formData.reason,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      toast({ title: t('leave_request_submitted_title'), description: t('leave_request_submitted_desc') });
      setDialogOpen(false);
      setFormData(INITIAL_FORM_STATE);
    } catch (error) {
      console.error('Error submitting leave:', error);
      toast({ variant: 'destructive', title: t('error_title'), description: t('error_desc') });
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmAction = async () => {
    const { action, leaveId } = confirmAction;
    if (!leaveId || !user) return;

    const leave = allLeaves.find(l => l.id === leaveId);
    if (!leave) return;

    setIsProcessing(true);
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const notificationMessage = action === 'approve'
        ? `${t('leave_approved_for')} @${leave.user_name}`
        : `${t('leave_rejected_for')} @${leave.user_name}`;

      await updateDoc('leaves', leaveId, {
        status,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      });

      await addDoc('chat', {
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email,
        text: notificationMessage,
        timestamp: new Date().toISOString(),
      }, { silent: true });

      if (action === 'approve') {
        toast({ title: t('leave_approved_title'), description: t('leave_approved_desc') });
      } else if (action === 'reject') {
        toast({ title: t('leave_rejected_title'), description: t('leave_rejected_desc') });
      }
    } catch (error) {
      console.error("Failed to process leave action", error);
    } finally {
      setIsProcessing(false);
      setConfirmAction({ action: null, leaveId: null });
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> {t('approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> {t('rejected')}</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {t('pending')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      sick: t('sick_leave'),
      annual: t('annual_leave'),
      unpaid: t('unpaid_leave'),
      emergency: t('emergency_leave'),
      other: t('other'),
    };
    return types[type] || type;
  };

  const autoExtractedCount = useMemo(() => allLeaves.filter(l => l.extracted_from_chat_message_id).length, [allLeaves]);

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
                      {u.full_name || u.email || t('unknown_user')}
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
                      {isAdmin && <TableCell className="font-medium">{leave.user_name}</TableCell>}
                      <TableCell>{getLeaveTypeLabel(leave.type)}</TableCell>
                      <TableCell>{format(new Date(leave.start_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(leave.end_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{leave.days}</TableCell>
                      <TableCell className="max-w-xs truncate">{leave.reason || '-'}</TableCell>
                      <TableCell>{getStatusBadge(leave.status)}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          {leave.extracted_from_chat_message_id ? (
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
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => setConfirmAction({ action: 'approve', leaveId: leave.id })}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('leave_action_confirm_desc', { action: t('approve') })}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setConfirmAction({ action: null, leaveId: null })} disabled={isProcessing}>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleConfirmAction} disabled={isProcessing}>{isProcessing ? t('loading') : t('confirm')}</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" onClick={() => setConfirmAction({ action: 'reject', leaveId: leave.id })}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('leave_action_confirm_desc', { action: t('reject') })}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setConfirmAction({ action: null, leaveId: null })} disabled={isProcessing}>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleConfirmAction} disabled={isProcessing}>{isProcessing ? t('loading') : t('confirm')}</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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

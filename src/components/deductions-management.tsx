'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { DollarSign, Plus, AlertCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useUsers } from '@/hooks/use-users';
import type { Deduction } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const INITIAL_FORM_STATE = {
  userId: '',
  amount: '',
  type: 'penalty' as Deduction['type'],
  reason: '',
  date: '',
};

export function DeductionsManagement({ userRole }: { userRole: string | undefined }) {
  const { user, role: supabaseRole } = useSupabase();
  const { addDoc } = useMutations();
  const { t } = useLanguage();
  const { toast } = useToast();
  const users = useUsers(userRole || supabaseRole);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  useEffect(() => {
    setFormData(prev => ({ ...prev, date: format(new Date(), 'yyyy-MM-dd') }))
  }, [])


  const { data: userData } = useSupabaseDoc('profiles', user?.id);
  const isAdmin = (userData as any)?.role === 'admin' || supabaseRole === 'admin';

  const { data: deductionsData } = useSupabaseCollection(
    'deductions',
    (query) => query.order('date', { ascending: false })
  );

  const allDeductions = (deductionsData as any[]) || [];

  const deductions = useMemo(() => {
    let filtered = allDeductions;
    if (!isAdmin && user) {
      filtered = filtered.filter(d => d.user_id === user.id);
    }
    if (isAdmin && selectedUserId !== 'all') {
      filtered = filtered.filter(d => d.user_id === selectedUserId);
    }
    return filtered;
  }, [allDeductions, isAdmin, user, selectedUserId]);

  const { data: chatData } = useSupabaseCollection(
    'chat',
    (query) => isAdmin ? query.order('timestamp', { ascending: false }) : query.limit(0)
  );
  const chatMessages = (chatData || []) as any[];

  useEffect(() => {
    if (!isAdmin || !chatMessages || chatMessages.length === 0 || !users || users.length === 0) return;

    const processedMessageIds = new Set(deductions.filter(d => d.extracted_from_chat_message_id).map(d => d.extracted_from_chat_message_id));

    chatMessages.forEach((msg) => {
      if (!msg.id || !msg.text || !msg.user_id || processedMessageIds.has(msg.id)) return;

      const messageUser = users.find(u => u.id === msg.user_id);
      if (!messageUser || (messageUser as any).role !== 'admin') return;

      const text = msg.text?.toLowerCase() || '';

      const deductionPatterns = [
        /خصم\s+(\d+)\s+(?:جنيه|ج\.م|ريال)?\s*(?:من|لـ)\s+([^\s،.]+)/gi,
        /خصم\s+([^\s\d،.]+)\s+(\d+)/gi,
        /deduct\s+(\d+)\s+(?:egp|pounds)?\s*from\s+([^\s,.]+)/gi,
        /deduct\s+([^\s\d,.]+)\s+(\d+)/gi,
        /(?:جزاء|penalty)\s+(\d+)\s+(?:على|for|on)\s+([^\s،.]+)/gi,
      ];

      deductionPatterns.forEach((pattern) => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach((match) => {
          let amount: number;
          let targetName: string;

          if (!isNaN(Number(match[1]))) {
            amount = Number(match[1]);
            targetName = match[2];
          } else {
            targetName = match[1];
            amount = Number(match[2]);
          }

          const targetUser = users.find(u => {
            const fullName = (u.full_name || '').toLowerCase();
            const targetNameLower = targetName.toLowerCase().trim();
            return fullName.includes(targetNameLower);
          });

          if (targetUser && amount > 0) {
            addDoc('deductions', {
              user_id: targetUser.id,
              user_name: targetUser.full_name,
              amount,
              reason: `${t('auto_extracted_from_chat')}: "${msg.text.substring(0, 100)}"`,
              type: 'penalty',
              date: msg.timestamp || new Date().toISOString(),
              extracted_from_chat_message_id: msg.id,
              created_by: msg.user_id,
              created_at: new Date().toISOString(),
            });
          }
        });
      });
    });
  }, [chatMessages, users, isAdmin, deductions, addDoc, t]);

  const handleSubmit = async () => {
    if (!user || !formData.userId || !formData.amount) {
      toast({ variant: 'destructive', title: t('error_title'), description: t('please_fill_all_fields') });
      return;
    }

    const targetUser = users?.find(u => u.id === formData.userId);
    if (!targetUser) {
      toast({ variant: 'destructive', title: t('error_title'), description: 'User not found' });
      return;
    }

    try {
      await addDoc('deductions', {
        user_id: formData.userId,
        user_name: targetUser.full_name,
        amount: parseFloat(formData.amount),
        type: formData.type,
        reason: formData.reason,
        date: formData.date,
        created_by: user.id,
        created_at: new Date().toISOString(),
      });

      toast({ title: t('deduction_added_title'), description: t('deduction_added_desc') });
      setDialogOpen(false);
      setFormData(INITIAL_FORM_STATE);
    } catch (error) {
      console.error('Error adding deduction:', error);
      toast({ variant: 'destructive', title: t('error_title'), description: t('error_desc') });
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'absence':
        return <Badge variant="destructive">{t('absence')}</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500">{t('late')}</Badge>;
      case 'penalty':
        return <Badge className="bg-orange-500">{t('penalty')}</Badge>;
      case 'other':
        return <Badge variant="secondary">{t('other')}</Badge>;
    }
  };

  const stats = useMemo(() => {
    const groupedByUser = deductions.reduce((acc, d) => {
      const uid = d.user_id;
      if (!acc[uid]) {
        acc[uid] = { userName: d.user_name, total: 0, count: 0 };
      }
      acc[uid].total += d.amount;
      acc[uid].count += 1;
      return acc;
    }, {} as Record<string, { userName?: string; total: number; count: number }>);

    const totalAmount = deductions.reduce((sum, d) => sum + d.amount, 0);
    const autoExtracted = deductions.filter(d => d.extracted_from_chat_message_id).length;

    return { totalAmount, totalCount: deductions.length, autoExtracted, byUser: Object.entries(groupedByUser) };
  }, [deductions]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {t('deductions_management')}
            {stats.autoExtracted > 0 && (
              <Badge variant="secondary" className="ml-2">
                <MessageSquare className="w-3 h-3 mr-1" />
                {stats.autoExtracted} {t('from_chat')}
              </Badge>
            )}
          </CardTitle>
          {isAdmin && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('add_deduction')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('total_deductions')}</p>
            <p className="text-2xl font-bold">{stats.totalCount}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('total_amount')}</p>
            <p className="text-2xl font-bold text-red-600">{stats.totalAmount} {t('currency')}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('auto_extracted')}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.autoExtracted}</p>
          </div>
        </div>

        {isAdmin && users && users.length > 0 && (
          <div className="flex items-center gap-3">
            <Label htmlFor="deduction-user-filter" className="whitespace-nowrap">{t('filter_by_employee')}:</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="deduction-user-filter" className="w-[250px]">
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

        {isAdmin && stats.byUser.length > 0 && selectedUserId === 'all' && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">{t('deductions_by_employee')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {stats.byUser.map(([userId, data]: [string, any]) => (
                <div key={userId} className="bg-background p-2 rounded text-sm">
                  <p className="font-medium">{data.userName || t('unknown_user')}</p>
                  <p className="text-red-600 font-bold">{data.total} {t('currency')} ({data.count} {t('items')})</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">{t('auto_extraction_enabled')}</p>
              <p className="text-blue-700 dark:text-blue-300">
                {t('auto_extraction_desc_deductions')}
              </p>
            </div>
          </div>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>{t('employee')}</TableHead>}
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('reason')}</TableHead>
                {isAdmin && <TableHead>{t('source')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {deductions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground">
                    {t('no_deductions_found')}
                  </TableCell>
                </TableRow>
              ) : (
                deductions.map((deduction) => (
                  <TableRow key={deduction.id}>
                    {isAdmin && <TableCell className="font-medium">{deduction.user_name}</TableCell>}
                    <TableCell>
                      <span className="text-red-600 font-bold">{deduction.amount} {t('currency')}</span>
                    </TableCell>
                    <TableCell>{getTypeBadge(deduction.type)}</TableCell>
                    <TableCell>{format(new Date(deduction.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="max-w-xs truncate">{deduction.reason}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        {deduction.extracted_from_chat_message_id ? (
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {isAdmin && (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('add_deduction')}</DialogTitle>
              <DialogDescription>{t('add_deduction_desc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="userId">{t('employee')}</Label>
                <Select value={formData.userId} onValueChange={(value) => setFormData({ ...formData, userId: value })}>
                  <SelectTrigger id="userId">
                    <SelectValue placeholder={t('select_employee')} />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">{t('amount')} ({t('currency')})</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">{t('date')}</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">{t('type')}</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Deduction['type'] })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absence">{t('absence')}</SelectItem>
                    <SelectItem value="late">{t('late')}</SelectItem>
                    <SelectItem value="penalty">{t('penalty')}</SelectItem>
                    <SelectItem value="other">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reason">{t('reason')}</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder={t('deduction_reason_placeholder')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSubmit}>{t('add_deduction')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

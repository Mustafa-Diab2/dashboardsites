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
import { DollarSign, Plus, AlertCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useUsers } from '@/hooks/use-users';
import type { Deduction } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export function DeductionsManagement({ userRole }: { userRole: string | undefined }) {
  const { firestore, user } = useFirebase();
  const { addDoc } = useMutations();
  const { t } = useLanguage();
  const { toast } = useToast();
  const users = useUsers(userRole);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    type: 'penalty' as Deduction['type'],
    reason: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData } = useDoc(userDocRef);
  const isAdmin = (userData as any)?.role === 'admin';

  // Query deductions
  const deductionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    if (isAdmin) {
      return query(collection(firestore, 'deductions'), orderBy('date', 'desc'));
    } else {
      return query(
        collection(firestore, 'deductions'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
    }
  }, [firestore, user, isAdmin]);

  const { data: deductionsData } = useCollection(deductionsQuery);
  const deductions = (deductionsData as Deduction[]) || [];

  // Query chat messages for auto-extraction (admin only)
  const chatQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'chat'), orderBy('timestamp', 'desc'));
  }, [firestore, isAdmin]);

  const { data: chatData } = useCollection(chatQuery);
  const chatMessages = (chatData || []) as any[];

  // Extract deductions from chat messages
  useEffect(() => {
    if (!isAdmin || !chatMessages || !users || !firestore) return;

    const processedMessageIds = new Set(deductions.filter(d => d.extractedFromChatMessageId).map(d => d.extractedFromChatMessageId));

    chatMessages.forEach((msg) => {
      // Only process messages from admin users
      const messageUser = users.find(u => u.id === msg.userId);
      if (!messageUser || (messageUser as any).role !== 'admin') return;

      // Skip if already processed
      if (processedMessageIds.has(msg.id)) return;

      const text = msg.text?.toLowerCase() || '';

      // Pattern matching for deductions
      // Examples: "خصم 100 جنيه من أحمد", "deduct 50 from ahmed", "خصم محمد 200"
      const deductionPatterns = [
        // Arabic patterns
        /خصم\s+(\d+)\s+(?:جنيه|ج\.م|ريال)?\s*(?:من|لـ)?\s*([^\s]+)/gi,
        /خصم\s+([^\s]+)\s+(\d+)/gi,
        // English patterns
        /deduct\s+(\d+)\s+(?:egp|pounds|from)?\s*([^\s]+)/gi,
        /deduct\s+([^\s]+)\s+(\d+)/gi,
        // Penalty patterns
        /(?:جزاء|penalty)\s+(\d+)\s+(?:على|for|on)?\s*([^\s]+)/gi,
      ];

      deductionPatterns.forEach((pattern) => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach((match) => {
          let amount: number;
          let targetName: string;

          // Check if first group is number or name
          if (!isNaN(Number(match[1]))) {
            amount = Number(match[1]);
            targetName = match[2];
          } else {
            targetName = match[1];
            amount = Number(match[2]);
          }

          // Find user by name
          const targetUser = users.find(u => {
            const fullName = (u as any).fullName?.toLowerCase() || '';
            return fullName.includes(targetName.toLowerCase());
          });

          if (targetUser && amount > 0) {
            // Auto-create deduction
            try {
              addDoc('deductions', {
                userId: targetUser.id,
                userName: (targetUser as any).fullName,
                amount,
                reason: `Auto-extracted from chat: "${msg.text.substring(0, 100)}"`,
                type: 'penalty',
                date: msg.timestamp || serverTimestamp(),
                extractedFromChatMessageId: msg.id,
                createdBy: msg.userId,
                createdAt: serverTimestamp(),
              });
            } catch (error) {
              console.error('Error creating auto-deduction:', error);
            }
          }
        });
      });
    });
  }, [chatMessages, users, isAdmin, deductions, firestore, addDoc]);

  const handleSubmit = async () => {
    if (!firestore || !user || !formData.userId || !formData.amount) {
      toast({ variant: 'destructive', title: t('error_title'), description: 'Please fill all required fields' });
      return;
    }

    const targetUser = users?.find(u => u.id === formData.userId);
    if (!targetUser) {
      toast({ variant: 'destructive', title: t('error_title'), description: 'User not found' });
      return;
    }

    try {
      await addDoc('deductions', {
        userId: formData.userId,
        userName: (targetUser as any).fullName,
        amount: parseFloat(formData.amount),
        type: formData.type,
        reason: formData.reason,
        date: Timestamp.fromDate(new Date(formData.date)),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Deduction Added', description: 'Deduction has been recorded successfully' });
      setDialogOpen(false);
      setFormData({ userId: '', amount: '', type: 'penalty', reason: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (error) {
      console.error('Error adding deduction:', error);
      toast({ variant: 'destructive', title: t('error_title'), description: t('error_desc') });
    }
  };

  const getTypeBadge = (type: Deduction['type']) => {
    switch (type) {
      case 'absence':
        return <Badge variant="destructive">Absence</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>;
      case 'penalty':
        return <Badge className="bg-orange-500">Penalty</Badge>;
      case 'other':
        return <Badge variant="secondary">Other</Badge>;
    }
  };

  const stats = useMemo(() => {
    const groupedByUser = deductions.reduce((acc, d) => {
      if (!acc[d.userId]) {
        acc[d.userId] = { userName: d.userName, total: 0, count: 0 };
      }
      acc[d.userId].total += d.amount;
      acc[d.userId].count += 1;
      return acc;
    }, {} as Record<string, { userName?: string; total: number; count: number }>);

    const totalAmount = deductions.reduce((sum, d) => sum + d.amount, 0);
    const autoExtracted = deductions.filter(d => d.extractedFromChatMessageId).length;

    return { totalAmount, totalCount: deductions.length, autoExtracted, byUser: Object.entries(groupedByUser) };
  }, [deductions]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Deductions Management
            {stats.autoExtracted > 0 && (
              <Badge variant="secondary" className="ml-2">
                <MessageSquare className="w-3 h-3 mr-1" />
                {stats.autoExtracted} from chat
              </Badge>
            )}
          </CardTitle>
          {isAdmin && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Deduction
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Deductions</p>
            <p className="text-2xl font-bold">{stats.totalCount}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold text-red-600">{stats.totalAmount} EGP</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Auto-Extracted</p>
            <p className="text-2xl font-bold text-blue-600">{stats.autoExtracted}</p>
          </div>
        </div>

        {/* Deductions by User */}
        {isAdmin && stats.byUser.length > 0 && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Deductions by Employee</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {stats.byUser.map(([userId, data]) => (
                <div key={userId} className="bg-background p-2 rounded text-sm">
                  <p className="font-medium">{data.userName || 'Unknown'}</p>
                  <p className="text-red-600 font-bold">{data.total} EGP ({data.count} items)</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info about auto-extraction */}
        {isAdmin && (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">Auto-Extraction Enabled</p>
              <p className="text-blue-700 dark:text-blue-300">
                Deductions are automatically extracted from admin chat messages. Supported patterns:
                <br />
                • "خصم 100 من أحمد" or "deduct 100 from ahmed"
                <br />
                • "خصم محمد 200" or "deduct ahmed 200"
                <br />• "جزاء 50 على محمد" or "penalty 50 for ahmed"
              </p>
            </div>
          </div>
        )}

        {/* Deductions Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                {isAdmin && <TableHead>Source</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {deductions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground">
                    No deductions found
                  </TableCell>
                </TableRow>
              ) : (
                deductions.map((deduction) => (
                  <TableRow key={deduction.id}>
                    {isAdmin && <TableCell className="font-medium">{deduction.userName}</TableCell>}
                    <TableCell>
                      <span className="text-red-600 font-bold">{deduction.amount} EGP</span>
                    </TableCell>
                    <TableCell>{getTypeBadge(deduction.type)}</TableCell>
                    <TableCell>{format((deduction.date as Timestamp).toDate(), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="max-w-xs truncate">{deduction.reason}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        {deduction.extractedFromChatMessageId ? (
                          <Badge variant="secondary" className="text-xs">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Manual
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

      {/* Add Deduction Dialog */}
      {isAdmin && (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Deduction</DialogTitle>
              <DialogDescription>Record a deduction for an employee</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="userId">Employee</Label>
                <Select value={formData.userId} onValueChange={(value) => setFormData({ ...formData, userId: value })}>
                  <SelectTrigger id="userId">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {(u as any).fullName || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (EGP)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Deduction['type'] })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absence">Absence</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="penalty">Penalty</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Provide a reason for this deduction"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Add Deduction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

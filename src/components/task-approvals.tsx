'use client';

import { Approval } from '@/lib/data';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useLanguage } from '@/context/language-context';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { useSupabase } from '@/context/supabase-context';

interface TaskApprovalsProps {
  taskId: string;
  approvals: Approval[];
  currentStatus: string;
  onApprove: (notes?: string) => void;
  onReject: (notes: string) => void;
  canApprove?: boolean;
  readonly?: boolean;
}

export function TaskApprovals({
  taskId,
  approvals,
  currentStatus,
  onApprove,
  onReject,
  canApprove = false,
  readonly = false,
}: TaskApprovalsProps) {
  const [notes, setNotes] = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const { t } = useLanguage();
  const { user } = useSupabase();

  const latestApproval = approvals && approvals.length > 0 ? approvals[approvals.length - 1] : null;
  const isPendingApproval = currentStatus === 'done' && (!latestApproval || latestApproval.status === 'rejected');

  const handleApprove = () => {
    onApprove(notes.trim() || undefined);
    setNotes('');
    setShowApprovalForm(false);
  };

  const handleReject = () => {
    if (!notes.trim()) {
      alert(t('rejection_notes_required'));
      return;
    }
    onReject(notes.trim());
    setNotes('');
    setShowApprovalForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('approvals')}
          </CardTitle>
          {latestApproval && (
            <Badge
              variant={latestApproval.status === 'approved' ? 'default' : 'destructive'}
            >
              {latestApproval.status === 'approved' ? t('approved') : t('rejected')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Approval History */}
        {approvals && approvals.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('approval_history')}</h4>
            {approvals.map((approval, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border rounded-md"
              >
                <div className="mt-1">
                  {approval.status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {approval.by_name || approval.by}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(approval.at).toLocaleDateString()}
                    </span>
                  </div>
                  {approval.notes && (
                    <p className="text-sm text-muted-foreground">
                      {approval.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Approval Notice */}
        {isPendingApproval && !showApprovalForm && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-amber-600 dark:text-amber-500 font-medium">
              {t('awaiting_approval')}
            </span>
          </div>
        )}

        {/* Approval Actions */}
        {!readonly && canApprove && isPendingApproval && (
          <>
            {!showApprovalForm ? (
              <Button
                onClick={() => setShowApprovalForm(true)}
                className="w-full"
                variant="outline"
              >
                {t('review_task')}
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t('approval_notes')} ({t('optional')})
                  </label>
                  <Textarea
                    placeholder={t('add_notes_about_approval')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('approve')}
                  </Button>
                  <Button
                    onClick={handleReject}
                    className="flex-1"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('reject')}
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    setShowApprovalForm(false);
                    setNotes('');
                  }}
                  variant="ghost"
                  className="w-full"
                  size="sm"
                >
                  {t('cancel')}
                </Button>
              </div>
            )}
          </>
        )}

        {!isPendingApproval && latestApproval?.status === 'approved' && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-500 font-medium">
              {t('task_approved')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

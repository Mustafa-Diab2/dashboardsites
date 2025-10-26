'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Loader2, FileDown } from 'lucide-react';
import { generateTeamInsights } from '@/lib/actions';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserReport } from './reports-dashboard';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useLanguage } from '@/context/language-context';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend the jsPDF type to include the autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function AIInsights({ byUser }: { byUser: UserReport[] }) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState('summary');
  const [targetUser, setTargetUser] = useState('all');
  const { t, language } = useLanguage();

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);

    // Filter out 'Unassigned' tasks and any users that might not have a name yet before sending to the AI
    const filteredTaskDistribution = byUser.filter(
      user => user.name && user.name !== 'Unassigned' && !user.name.startsWith('user-') && user.name !== 'undefined'
    );
    
    const result = await generateTeamInsights({
      taskDistribution: filteredTaskDistribution,
      reportType: reportType as 'summary' | 'detailed',
      target: targetUser,
      isTeamReport: targetUser === 'all',
      isSummaryReport: reportType === 'summary',
    });
    
    if (result.insights) {
      setInsights(result.insights);
    } else {
      setError(result.error || t('failed_to_generate_insights'));
    }
    setIsLoading(false);
  };

  const handleDownloadPdf = () => {
    if (!insights) return;

    const doc = new jsPDF();
    const title = t('ai_powered_insights');
    const reportTarget = targetUser === 'all' ? t('all') : targetUser;
    const reportTypeText = reportType === 'summary' ? t('summary') : t('detailed');
    
    // Set font that supports Arabic - 'Helvetica' is a safe default, but for full support
    // a custom font would ideally be loaded. jsPDF-autotable handles this better.
    // The key is to set the font in the autoTable styles.
    
    doc.setFontSize(18);
    // jsPDF struggles with RTL text rendering in `text` method. We will add titles in the table instead.
    
    doc.autoTable({
        head: [[title]],
        body: [
            [`${t('report_type')}: ${reportTypeText}`],
            [`${t('report_target')}: ${reportTarget}`],
            [insights]
        ],
        startY: 15,
        styles: {
            font: 'Helvetica', // A standard font that has some unicode support.
            halign: 'right', // Align text to the right for RTL
        },
        headStyles: {
            halign: 'center',
            fontSize: 16,
            fillColor: [78, 115, 223]
        },
        bodyStyles: {
            cellPadding: 4,
            fontSize: 12,
        }
    });

    doc.save("ai-insights-report.pdf");
  };
  
  const selectableUsers = byUser.filter(user => user.name && user.name !== 'Unassigned' && !user.name.startsWith('user-') && user.name !== 'undefined');

  return (
    <Card className="bg-card/50 border-primary/20 border-2 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-headline flex items-center gap-2">
              <Sparkles className="text-primary" />
              {t('ai_powered_insights')}
            </CardTitle>
            <CardDescription>{t('ai_powered_insights_desc')}</CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Button onClick={handleGenerateInsights} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('generating')}...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t('generate_insights')}
                </>
              )}
            </Button>
            {insights && (
               <Button onClick={handleDownloadPdf} variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                {t('download_pdf')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className='grid gap-2'>
                <Label htmlFor="report-type">{t('report_type')}</Label>
                <Select value={reportType} onValueChange={setReportType} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectTrigger id="report-type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="summary">{t('summary')}</SelectItem>
                        <SelectItem value="detailed">{t('detailed')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className='grid gap-2'>
                <Label htmlFor="report-target">{t('report_target')}</Label>
                <Select value={targetUser} onValueChange={setTargetUser} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectTrigger id="report-target">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('all')}</SelectItem>
                        {selectableUsers.map(user => (
                            <SelectItem key={user.name} value={user.name}>{user.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <AnimatePresence>
          {(isLoading || insights || error) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
                {isLoading && (
                  <div className="flex items-center gap-4 text-muted-foreground p-4 rounded-lg bg-muted/50">
                    <Loader2 className="animate-spin" />
                    <p>{t('ai_analyzing_data')}</p>
                  </div>
                )}
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>{t('error')}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {insights && (
                  <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg bg-muted/50 whitespace-pre-wrap font-body">
                    {insights}
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

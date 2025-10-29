
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Loader2, FileDown } from 'lucide-react';
import { generateTeamInsights, GenerateTeamInsightsInput } from '@/ai/flows/generate-team-insights';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserReport } from './reports-dashboard';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useLanguage } from '@/context/language-context';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

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
    
    const input: GenerateTeamInsightsInput = {
      taskDistribution: filteredTaskDistribution,
      reportType: reportType as 'summary' | 'detailed',
      target: targetUser,
      isTeamReport: targetUser === 'all',
      isSummaryReport: reportType === 'summary',
    };

    try {
        const result = await generateTeamInsights(input);
        if (result.insights) {
            setInsights(result.insights);
        } else {
            setError(t('failed_to_generate_insights'));
        }
    } catch(e: any) {
        console.error("Error in generateTeamInsights action:", e);
        setError(e.message || t('failed_to_generate_insights'));
    }
    
    setIsLoading(false);
  };

  const handleDownloadPdf = async () => {
    if (!insights) return;

    // 1) نتأكد أننا على المتصفح
    if (typeof window === 'undefined') return;

    try {
      // 2) أنشئ عنصر HTML مؤقت للمحتوى
      const reportTarget = targetUser === 'all' ? t('all') : targetUser;
      const reportTypeText = reportType === 'summary' ? t('summary') : t('detailed');
      const title = `${t('ai_powered_insights')} - ${reportTypeText} (${reportTarget})`;

      // إنشاء عنصر div مؤقت
      const element = document.createElement('div');
      element.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 794px;
        padding: 40px;
        background: white;
        font-family: 'Cairo', 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;
        direction: rtl;
        color: #000;
      `;

      element.innerHTML = `
        <h1 style="font-size: 24px; margin-bottom: 20px; text-align: right; color: #1a1a1a;">
          ${title}
        </h1>
        <div style="font-size: 14px; line-height: 1.8; text-align: right; white-space: pre-wrap;">
          ${insights}
        </div>
      `;

      document.body.appendChild(element);

      // 3) تحويل HTML إلى صورة
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // 4) إزالة العنصر المؤقت
      document.body.removeChild(element);

      // 5) إنشاء PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // 6) حفظ
      pdf.save('ai-insights-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    }
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

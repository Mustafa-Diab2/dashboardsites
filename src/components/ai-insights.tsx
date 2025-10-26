'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateTeamInsights } from '@/lib/actions';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserReport } from './reports-dashboard';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useLanguage } from '@/context/language-context';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
      user => user.name && user.name !== 'Unassigned' && !user.name.startsWith('user-')
    );

    const result = await generateTeamInsights({
      taskDistribution: filteredTaskDistribution,
      reportType: reportType as 'summary' | 'detailed',
      target: targetUser,
    });
    
    if (result.insights) {
      setInsights(result.insights);
    } else {
      setError(result.error || t('failed_to_generate_insights'));
    }
    setIsLoading(false);
  };
  
  const selectableUsers = byUser.filter(user => user.name !== 'Unassigned'  && !user.name.startsWith('user-'));

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
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className='grid gap-2'>
                <Label htmlFor="report-type">{language === 'ar' ? 'نوع التقرير' : 'Report Type'}</Label>
                <Select value={reportType} onValueChange={setReportType} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectTrigger id="report-type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="summary">{language === 'ar' ? 'مختصر' : 'Summary'}</SelectItem>
                        <SelectItem value="detailed">{language === 'ar' ? 'مفصل' : 'Detailed'}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className='grid gap-2'>
                <Label htmlFor="report-target">{language === 'ar' ? 'الهدف' : 'Target'}</Label>
                <Select value={targetUser} onValueChange={setTargetUser} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectTrigger id="report-target">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{language === 'ar' ? 'الفريق بأكمله' : 'Entire Team'}</SelectItem>
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

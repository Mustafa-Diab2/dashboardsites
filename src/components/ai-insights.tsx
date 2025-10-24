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

export default function AIInsights({ byUser }: { byUser: UserReport[] }) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);

    const result = await generateTeamInsights(byUser);
    
    if (result.insights) {
      setInsights(result.insights);
    } else {
      setError(t('failed_to_generate_insights'));
    }
    setIsLoading(false);
  };

  return (
    <Card className="bg-card/50 border-primary/20 border-2 shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
      </CardHeader>
      <AnimatePresence>
        {(isLoading || insights || error) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent>
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
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

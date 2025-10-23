'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateTeamInsights } from '@/lib/actions';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserReport } from './reports-dashboard';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export default function AIInsights({ byUser }: { byUser: UserReport[] }) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);

    const result = await generateTeamInsights(byUser);
    
    if (result.insights) {
      setInsights(result.insights);
    } else {
      setError("Failed to generate insights. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <Card className="bg-card/50 border-primary/20 border-2 shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>Analyze team performance and get recommendations.</CardDescription>
        </div>
        <Button onClick={handleGenerateInsights} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Insights
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
                  <p>Our AI is analyzing your team's data... This may take a moment.</p>
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
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

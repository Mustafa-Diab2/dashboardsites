'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { ThemeProvider } from "@/context/theme-context";
import { LanguageProvider } from "@/context/language-context";
import { SupabaseProvider } from "@/context/supabase-context";
import { Toaster } from "@/components/ui/toaster";
import { ClientOnly } from "@/components/client-only";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 دقيقة بدلاً من 5
        gcTime: 5 * 60 * 1000, // استخدم gcTime بدلاً من cacheTime (deprecated)
        refetchOnWindowFocus: false,
        refetchOnReconnect: false, // منع إعادة التحميل التلقائي
        refetchOnMount: false, // منع إعادة التحميل عند mount
        retry: 1,
        retryDelay: 1000,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <LanguageProvider>
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
        </LanguageProvider>
      </ThemeProvider>
      <ClientOnly>
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </ClientOnly>
    </QueryClientProvider>
  );
}

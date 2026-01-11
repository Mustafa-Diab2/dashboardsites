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
        staleTime: 10 * 60 * 1000, // ✅ زيادة من 5 إلى 10 دقائق - تقليل إعادة التحميل
        gcTime: 15 * 60 * 1000, // ✅ زيادة من 10 إلى 15 دقيقة للـ garbage collection
        refetchOnWindowFocus: false, // منع refetch عند التبديل بين النوافذ
        refetchOnReconnect: true, // refetch عند استعادة الاتصال
        refetchOnMount: (query) => {
          // refetch فقط لو البيانات stale أو لم تُجلب من قبل
          return query.state.dataUpdateCount === 0;
        },
        retry: 1,
        retryDelay: 1000,
        networkMode: 'offlineFirst', // ✅ استخدام الكاش أولاً لتحسين الأداء
        // تحسين performance
        structuralSharing: true, // منع re-renders غير ضرورية
        refetchInterval: false, // منع polling تلقائي
      },
      mutations: {
        // ✅ إضافة إعدادات للـ mutations
        networkMode: 'offlineFirst',
        retry: 1,
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

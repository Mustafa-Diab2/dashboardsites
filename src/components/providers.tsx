'use client';

import { ThemeProvider } from "@/context/theme-context";
import { LanguageProvider } from "@/context/language-context";
import { SupabaseProvider } from "@/context/supabase-context";
import { Toaster } from "@/components/ui/toaster";
import { ClientOnly } from "@/components/client-only";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
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
      </ClientOnly>
    </>
  );
}

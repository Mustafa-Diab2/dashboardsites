'use client';

import { ThemeProvider } from "@/context/theme-context";
import { LanguageProvider } from "@/context/language-context";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
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
          <FirebaseClientProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </FirebaseClientProvider>
        </LanguageProvider>
      </ThemeProvider>
      <ClientOnly>
        <Toaster />
      </ClientOnly>
    </>
  );
}

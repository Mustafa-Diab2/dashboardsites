'use client';

import { ClientOnly } from '@/components/client-only';
import MainPage from '@/components/main-page';

export default function Home() {
  return (
    <ClientOnly>
      <MainPage />
    </ClientOnly>
  );
}

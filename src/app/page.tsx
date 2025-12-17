'use client';

import { AuthCard } from "@/components/auth-card";
import { HRManagementPage } from "@/components/hr-management-page";
import TeamManagement from "@/components/team-management";
import { useAuth } from "@/firebase/provider";
import { ClientOnly } from '@/components/client-only';

export default function Home() {
  const { user, userRole } = useAuth();

  return (
    <main className="container mx-auto p-4 md:p-8">
      {user ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <ClientOnly>
              <HRManagementPage userRole={userRole} />
            </ClientOnly>
            {userRole === 'admin' && <TeamManagement />}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <AuthCard />
        </div>
      )}
    </main>
  );
}
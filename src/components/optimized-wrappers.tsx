'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

// Loading components for better UX
export const BudgetSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="p-6 border rounded-lg space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-1/4" />
    <Skeleton className="h-[300px] w-full" />
  </div>
);

export const TableSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-10 w-full" />
    {[1, 2, 3, 4, 5].map(i => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
);

// Code-split heavy components
export const BudgetManagement = dynamic(
  () => import('./budget-management').then(mod => ({ default: mod.BudgetManagement })),
  { 
    loading: () => <BudgetSkeleton />,
    ssr: false // Disable SSR for heavy components
  }
);

export const GoalsOKRs = dynamic(
  () => import('./goals-okrs').then(mod => ({ default: mod.GoalsOKRsManagement })),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);

export const KPIDashboard = dynamic(
  () => import('./kpi-dashboard').then(mod => ({ default: mod.KPIDashboard })),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);

export const ReportsDashboard = dynamic(
  () => import('./reports-dashboard'),
  { 
    loading: () => <TableSkeleton />,
    ssr: false
  }
);

export const TeamManagement = dynamic(
  () => import('./team-management'),
  { 
    loading: () => <TableSkeleton />,
    ssr: false
  }
);

export const HRManagementPage = dynamic(
  () => import('./hr-management-page').then(mod => ({ default: mod.HRManagementPage })),
  { 
    loading: () => <TableSkeleton />,
    ssr: false
  }
);

export const ClientsDashboard = dynamic(
  () => import('./clients-dashboard'),
  { 
    loading: () => <TableSkeleton />,
    ssr: false
  }
);

export const AttendanceAdmin = dynamic(
  () => import('./attendance-admin'),
  { 
    loading: () => <TableSkeleton />,
    ssr: false
  }
);

'use client';

import { LeaveManagement } from './leave-management';
import { AttendanceSummary } from './attendance-summary';
import { DeductionsManagement } from './deductions-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, CalendarDays, DollarSign, Users } from 'lucide-react';

export function HRManagementPage({ userRole }: { userRole: string | undefined }) {
  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-headline">HR Management</h2>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Manage leaves, attendance, and deductions for all team members'
              : 'View your attendance, leaves, and deductions'
            }
          </p>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Leaves
          </TabsTrigger>
          <TabsTrigger value="deductions" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Deductions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceSummary userRole={userRole} />
        </TabsContent>

        <TabsContent value="leaves" className="mt-6">
          <LeaveManagement userRole={userRole} />
        </TabsContent>

        <TabsContent value="deductions" className="mt-6">
          <DeductionsManagement userRole={userRole} />
        </TabsContent>
      </Tabs>

      {/* Quick Stats Overview for Admin */}
      {isAdmin && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Attendance</h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Track team attendance, absences, and late arrivals with detailed monthly reports
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">Leave Management</h3>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Approve or reject leave requests and monitor team availability
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">Deductions</h3>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Auto-extracted from chat messages or added manually for accurate payroll
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

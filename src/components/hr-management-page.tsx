'use client';

import { LeaveManagement } from './leave-management';
import { AttendanceSummary } from './attendance-summary';
import { DeductionsManagement } from './deductions-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, CalendarDays, DollarSign, Users } from 'lucide-react';
import { AlertDialog } from './ui/alert-dialog';
import { useLanguage } from '@/context/language-context';


export function HRManagementPage({ userRole }: { userRole: string | undefined }) {
  const isAdmin = userRole === 'admin';
  const { t } = useLanguage();

  return (
    <AlertDialog>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-headline">{t('hr_management')}</h2>
          <p className="text-muted-foreground">
            {isAdmin
              ? t('hr_management_desc_admin')
              : t('hr_management_desc_user')
            }
          </p>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {t('attendance_summary')}
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t('leaves')}
          </TabsTrigger>
          <TabsTrigger value="deductions" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            {t('deductions')}
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
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">{t('attendance_summary')}</h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('attendance_summary_desc')}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">{t('leave_management')}</h3>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              {t('leave_management_desc')}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">{t('deductions')}</h3>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {t('deductions_desc')}
            </p>
          </div>
        </div>
      )}
    </div>
    </AlertDialog>
  );
}

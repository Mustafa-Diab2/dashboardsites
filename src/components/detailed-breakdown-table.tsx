'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { UserReport } from './reports-dashboard';
import { useLanguage } from "@/context/language-context";

export function DetailedBreakdownTable({ data }: { data: UserReport[] }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">{t('member')}</TableHead>
            <TableHead className="text-center">{t('total')}</TableHead>
            <TableHead className="text-center">{t('backlog')}</TableHead>
            <TableHead className="text-center">{t('in_progress')}</TableHead>
            <TableHead className="text-center">{t('review')}</TableHead>
            <TableHead className="text-center">{t('done')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user) => (
            <TableRow key={user.name}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-center">{user.total}</TableCell>
              <TableCell className="text-center">{user.backlog}</TableCell>
              <TableCell className="text-center">{user.in_progress}</TableCell>
              <TableCell className="text-center">{user.review}</TableCell>
              <TableCell className="text-center">{user.done}</TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                {t('no_data_available')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

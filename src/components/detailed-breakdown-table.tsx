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

export function DetailedBreakdownTable({ data }: { data: UserReport[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Member</TableHead>
            <TableHead className="text-center">Total</TableHead>
            <TableHead className="text-center">Backlog</TableHead>
            <TableHead className="text-center">In Progress</TableHead>
            <TableHead className="text-center">Review</TableHead>
            <TableHead className="text-center">Done</TableHead>
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
                No data available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

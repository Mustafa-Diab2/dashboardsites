'use client';

import type { Task } from '@/lib/data';
import { useMemo, useState } from 'react';
import { MEMBERS } from '@/lib/data';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from './ui/button';
import { FileDown, Plus, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MemberTasksBarChart } from './charts/member-tasks-bar-chart';
import { CompletionRatioPieChart } from './charts/completion-ratio-pie-chart';
import { DetailedBreakdownTable } from './detailed-breakdown-table';
import AIInsights from './ai-insights';
import { TaskForm } from './task-form';
import { useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';


export type UserReport = {
  name: string;
  total: number;
  backlog: number;
  in_progress: number;
  review: number;
  done: number;
};

export default function ReportsDashboard({ tasks, userRole }: { tasks: Task[], userRole: string }) {
  const [isTaskFormOpen, setTaskFormOpen] = useState(false);
  const { auth } = useFirebase();

  const byUser = useMemo(() => {
    const nameOf = (uid?: string) => {
      if (!uid) return 'Unassigned';
      const found = MEMBERS.find(m => m.id === uid);
      return found ? `${found.name} (${found.role})` : uid;
    };
    const map = new Map<string, UserReport>();
    tasks.forEach(t => {
      const key = t.assigneeId || 'unassigned';
      if (!map.has(key)) map.set(key, { name: nameOf(t.assigneeId), total: 0, backlog: 0, in_progress: 0, review: 0, done: 0 });
      const rec = map.get(key)!;
      rec.total++;
      (rec as any)[t.status]++;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [tasks]);

  const exportCSV = () => {
    const ws = utils.json_to_sheet(byUser);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Report');
    writeFile(wb, 'TeamReport.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Team Task Report', 14, 16);
    const tableData = byUser.map(u => [u.name, u.total, u.backlog, u.in_progress, u.review, u.done]);
    (doc as any).autoTable({
      head: [['Member', 'Total', 'Backlog', 'In Progress', 'Review', 'Done']],
      body: tableData,
      startY: 22,
    });
    doc.save('TeamReport.pdf');
  };

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <>
      <TaskForm isOpen={isTaskFormOpen} onOpenChange={setTaskFormOpen} />
      <div className="max-w-7xl mx-auto px-4 pb-10 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-2xl font-headline">Team Analytics</h2>
            <p className="text-muted-foreground">Analyze your team's workload and productivity.</p>
          </div>
          <div className="flex gap-2">
            {userRole === 'admin' && (
              <Button onClick={() => setTaskFormOpen(true)}>
                <Plus /> Add Task
              </Button>
            )}
            <Button variant="outline" onClick={exportCSV}><FileDown /> CSV</Button>
            <Button variant="outline" onClick={exportPDF}><FileDown /> PDF</Button>
            <Button variant="outline" onClick={handleSignOut}><LogOut /> Sign Out</Button>
          </div>
        </div>

        <AIInsights byUser={byUser} />
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Tasks by Member</CardTitle>
            </CardHeader>
            <CardContent>
              <MemberTasksBarChart data={byUser} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Tasks Completion Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <CompletionRatioPieChart data={byUser} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Detailed Member Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailedBreakdownTable data={byUser} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

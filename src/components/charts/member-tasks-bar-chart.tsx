'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { UserReport } from '../reports-dashboard';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  backlog: { label: "Backlog", color: "hsl(var(--chart-1))" },
  in_progress: { label: "In Progress", color: "hsl(var(--chart-2))" },
  review: { label: "Review", color: "hsl(var(--chart-3))" },
  done: { label: "Done", color: "hsl(var(--chart-4))" },
};

export function MemberTasksBarChart({ data }: { data: UserReport[] }) {
  return (
    <ChartContainer config={chartConfig} className="w-full h-[300px]">
      <BarChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.split(' ')[0]} // Show just the name
        />
        <YAxis />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          content={<ChartTooltipContent />}
        />
        <Legend />
        <Bar dataKey="backlog" stackId="a" fill="var(--color-backlog)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="in_progress" stackId="a" fill="var(--color-in_progress)" />
        <Bar dataKey="review" stackId="a" fill="var(--color-review)" />
        <Bar dataKey="done" stackId="a" fill="var(--color-done)" />
      </BarChart>
    </ChartContainer>
  );
}

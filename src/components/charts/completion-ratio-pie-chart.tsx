'use client';

import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { UserReport } from '../reports-dashboard';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  done: {
    label: 'Done',
  },
};

export function CompletionRatioPieChart({ data }: { data: UserReport[] }) {
    const chartData = data.filter(d => d.total > 0);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[300px]"
    >
      <PieChart>
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          content={<ChartTooltipContent nameKey="name" />}
        />
        <Pie
          data={chartData}
          dataKey="done"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          labelLine={false}
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
            if (percent < 0.05) return null;
            return (
              <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
              </text>
            );
          }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
    </ChartContainer>
  );
}

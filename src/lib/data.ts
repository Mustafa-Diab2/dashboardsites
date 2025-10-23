
export type Task = {
  id: string;
  title: string;
  description?: string;
  forTeam: "backend" | "frontend";
  assigneeId?: string;
  status: "backlog" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  due?: string;
  tags?: string[];
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
};

// Generate some mock tasks for demonstration
const generateMockTasks = (members: {id: string, name: string, role: string}[]): Task[] => {
  const tasks: Task[] = [];
  const statuses: Task['status'][] = ["backlog", "in_progress", "review", "done"];
  const priorities: Task['priority'][] = ["low", "medium", "high"];
  const teams: Task['forTeam'][] = ["backend", "frontend"];

  for (let i = 1; i <= 40; i++) {
    const team = teams[i % 2];
    const teamMembers = members.filter(m => m.role === team);
    const assignee = teamMembers.length > 0 ? teamMembers[Math.floor(Math.random() * teamMembers.length)] : undefined;

    tasks.push({
      id: `task-${i}`,
      title: `Task ${i}`,
      description: `This is the description for task ${i}.`,
      forTeam: team,
      assigneeId: Math.random() > 0.1 && assignee ? assignee.id : undefined, // Some unassigned
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      due: `2024-08-${Math.floor(Math.random() * 15) + 15}`,
      tags: team === 'backend' ? ['api', 'database'] : ['ui', 'ux'],
      createdBy: 'u0', // Admin
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return tasks;
};

export const mockTasks: Task[] = generateMockTasks([]);

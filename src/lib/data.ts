
export type ChecklistItem = {
  id: string;
  title: string;
  done: boolean;
  createdAt?: any;
};

export type ResearchItem = {
  id: string;
  title: string;
  url: string;
  type: 'ui' | 'tech' | 'competitor' | 'other';
  notes?: string;
  createdAt?: any;
};

export type Approval = {
  by: string;
  byName?: string;
  at: any;
  status: 'approved' | 'rejected';
  notes?: string;
};

export type AuditLogEntry = {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned' | 'approved' | 'rejected';
  field?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: any;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  type: 'work' | 'training';
  assigned_to: string[];
  created_by: string;
  client_id?: string;
  progress: number;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  due_date?: string;
  deliverable_location?: string;
  delivery_method?: 'in_person' | 'upload' | 'link';
  deliverable_details?: string;
  client_payment?: number;
  backend_share_pct?: number;
  frontend_share_pct?: number;
  payment_schedule?: string;
  backend_conditions?: string;
  frontend_conditions?: string;
  ux_requirements?: string;
  market_research_link?: string;
  createdAt?: any;
  updatedAt?: any;
  tags?: string[];
  checklist?: ChecklistItem[];
  blocked_by?: string[];
  blocks?: string[];
  approvals?: Approval[];
  payment_status?: 'pending' | 'partial' | 'paid';
  due_alert_48h?: boolean;
  research?: ResearchItem[];
  template_id?: string;
};

export type Client = {
  id: string;
  name: string;
  project_name: string;
  total_payment?: number;
  paid_amount?: number;
  contact_info?: string;
  notes?: string;
  publicToken?: string;
  billing_notes?: string;
  default_requirements?: string;
  payment_terms?: string;
};

export type File = {
  id: string;
  taskId: string;
  name: string;
  size: number;
  contentType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: any;
};

export type TaskTemplate = {
  id: string;
  name: string;
  description: string;
  type: 'work' | 'training';
  category: 'backend' | 'frontend' | 'fullstack' | 'design' | 'other';
  defaultFields: Partial<Task>;
  defaultChecklist?: Omit<ChecklistItem, 'id' | 'createdAt'>[];
  createdBy: string;
  createdAt: any;
};

export type SavedView = {
  id: string;
  name: string;
  userId: string;
  filters: {
    status?: Task['status'][];
    priority?: Task['priority'][];
    assigned_to?: string[];
    client_id?: string;
    search?: string;
    date_range?: { start?: string; end?: string };
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isPublic?: boolean;
  createdAt: any;
};

export type Report = {
  id: string;
  type: 'team' | 'client' | 'financial' | 'workload';
  title: string;
  filters: any;
  generated_at: any;
  generated_by: string;
  summary?: string;
  actions?: string[];
  data?: any;
};

export type Leave = {
  id: string;
  userId: string;
  userName?: string;
  type: 'sick' | 'annual' | 'unpaid' | 'emergency' | 'other';
  startDate: any;
  endDate: any;
  days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: any;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
  extractedFromChatMessageId?: string;
};

export type Deduction = {
  id: string;
  userId: string;
  userName?: string;
  amount: number;
  reason: string;
  type: 'absence' | 'late' | 'penalty' | 'other';
  date: any;
  extractedFromChatMessageId?: string;
  createdBy: string;
  createdAt: any;
  notes?: string;
};

export type AttendanceSummary = {
  userId: string;
  userName?: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  period: {
    start: any;
    end: any;
  };
};

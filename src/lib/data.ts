
export type ChecklistItem = {
  id: string;
  title: string;
  done: boolean;
  created_at?: any;
};

export type ResearchItem = {
  id: string;
  title: string;
  url: string;
  type: 'ui' | 'tech' | 'competitor' | 'other';
  notes?: string;
  created_at?: any;
};

export type Approval = {
  by: string;
  by_name?: string;
  at: any;
  status: 'approved' | 'rejected';
  notes?: string;
};

export type AuditLogEntry = {
  id: string;
  task_id: string;
  user_id: string;
  user_name?: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned' | 'approved' | 'rejected';
  field?: string;
  old_value?: any;
  new_value?: any;
  timestamp: any;
};

export type User = {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'frontend' | 'backend' | 'trainee' | 'ui_ux' | 'security' | 'ai_specialist';
  hourly_rate?: number;
  created_at: any;
}

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
  due?: string; // Some components use 'due' instead of 'due_date'
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
  created_at?: any;
  updated_at?: any;
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
  public_token?: string;
  billing_notes?: string;
  default_requirements?: string;
  payment_terms?: string;
};

export type File = {
  id: string;
  task_id: string;
  name: string;
  size: number;
  content_type: string;
  url: string;
  uploaded_by: string;
  uploaded_at: any;
};

export type TaskTemplate = {
  id: string;
  name: string;
  description: string;
  type: 'work' | 'training';
  category: 'backend' | 'frontend' | 'fullstack' | 'design' | 'other';
  default_fields: Partial<Task>;
  default_checklist?: Omit<ChecklistItem, 'id' | 'created_at'>[];
  created_by: string;
  created_at: any;
};

export type SavedView = {
  id: string;
  name: string;
  user_id: string;
  filters: {
    status?: Task['status'][];
    priority?: Task['priority'][];
    assigned_to?: string[];
    client_id?: string;
    search?: string;
    date_range?: { start?: string; end?: string };
  };
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  is_public?: boolean;
  created_at: any;
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
  user_id: string;
  user_name?: string;
  type: 'sick' | 'annual' | 'unpaid' | 'emergency' | 'other';
  start_date: any;
  end_date: any;
  days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: any;
  notes?: string;
  created_at: any;
  updated_at?: any;
  extracted_from_chat_message_id?: string;
};

export type Deduction = {
  id: string;
  user_id: string;
  user_name?: string;
  amount: number;
  reason: string;
  type: 'absence' | 'late' | 'penalty' | 'other';
  date: any;
  extracted_from_chat_message_id?: string;
  created_by: string;
  created_at: any;
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



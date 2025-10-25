
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
};

export type Client = {
  id: string;
  name: string;
  project_name: string;
  total_payment?: number;
  paid_amount?: number;
  contact_info?: string;
  notes?: string;
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

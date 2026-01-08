-- إضافة جداول للميزات الجديدة

-- Workflow Rules Table
CREATE TABLE IF NOT EXISTS workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger TEXT NOT NULL,
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalations Table
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  escalated_to TEXT NOT NULL,
  reason TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Budgets Table
CREATE TABLE IF NOT EXISTS project_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  total_budget DECIMAL(12,2) NOT NULL,
  labor_budget DECIMAL(12,2),
  expenses_budget DECIMAL(12,2),
  actual_labor_cost DECIMAL(12,2) DEFAULT 0,
  actual_expenses DECIMAL(12,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  health_status TEXT DEFAULT 'on_track' CHECK (health_status IN ('on_track', 'at_risk', 'over_budget', 'critical')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Expenses Table
CREATE TABLE IF NOT EXISTS budget_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES project_budgets(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  approved_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OKRs Table (Objectives and Key Results)
CREATE TABLE IF NOT EXISTS okrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id),
  quarter TEXT NOT NULL, -- e.g., 'Q1 2026'
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Key Results Table
CREATE TABLE IF NOT EXISTS key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id UUID REFERENCES okrs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  unit TEXT, -- e.g., '%', 'count', 'hours'
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date DATE,
  status TEXT DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'off_track', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills Matrix Table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience DECIMAL(3,1),
  certifications TEXT[],
  last_used_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

-- Risks Table
CREATE TABLE IF NOT EXISTS risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES project_budgets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('technical', 'resource', 'financial', 'external', 'schedule', 'quality')),
  probability TEXT CHECK (probability IN ('low', 'medium', 'high', 'critical')),
  impact TEXT CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER, -- calculated: probability * impact
  status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'analyzing', 'mitigating', 'monitoring', 'closed')),
  owner_id UUID REFERENCES profiles(id),
  mitigation_plan TEXT,
  contingency_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues Table
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES project_budgets(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('blocker', 'critical', 'major', 'minor', 'trivial')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES profiles(id),
  reported_by UUID REFERENCES profiles(id),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprints Table
CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  capacity INTEGER, -- story points or hours
  commitment INTEGER,
  actual_velocity INTEGER,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  retrospective_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint Tasks (many-to-many)
CREATE TABLE IF NOT EXISTS sprint_tasks (
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  story_points INTEGER,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (sprint_id, task_id)
);

-- KPIs Table
CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('productivity', 'quality', 'financial', 'customer', 'team')),
  current_value DECIMAL(10,2),
  target_value DECIMAL(10,2) NOT NULL,
  unit TEXT,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  period TEXT DEFAULT 'monthly',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPI History for trend analysis
CREATE TABLE IF NOT EXISTS kpi_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE,
  value DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Tracking Table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- minutes
  description TEXT,
  billable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations Settings
CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_type TEXT NOT NULL, -- 'google_calendar', 'slack', 'github', etc.
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, integration_type)
);

-- RLS Policies

-- workflow_rules
ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_rules_select" ON workflow_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "workflow_rules_admin_only" ON workflow_rules FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- escalations
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escalations_select" ON escalations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = escalations.task_id 
    AND (tasks.created_by = auth.uid() OR auth.uid() = ANY(tasks.assigned_to))
  )
);
CREATE POLICY "escalations_admin_only" ON escalations FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- project_budgets
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets_select" ON project_budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "budgets_admin_only" ON project_budgets FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- budget_expenses
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_select" ON budget_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "expenses_insert" ON budget_expenses FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "expenses_admin_approve" ON budget_expenses FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- okrs
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "okrs_select" ON okrs FOR SELECT TO authenticated USING (true);
CREATE POLICY "okrs_own_or_admin" ON okrs FOR ALL TO authenticated 
USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- key_results
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "key_results_select" ON key_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "key_results_modify" ON key_results FOR ALL TO authenticated 
USING (
  EXISTS (SELECT 1 FROM okrs WHERE okrs.id = key_results.okr_id AND okrs.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- user_skills
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_select" ON user_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "skills_own" ON user_skills FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "skills_admin" ON user_skills FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- risks
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risks_select" ON risks FOR SELECT TO authenticated USING (true);
CREATE POLICY "risks_modify" ON risks FOR ALL TO authenticated 
USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- issues
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issues_select" ON issues FOR SELECT TO authenticated USING (true);
CREATE POLICY "issues_insert" ON issues FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());
CREATE POLICY "issues_modify" ON issues FOR UPDATE TO authenticated 
USING (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- sprints
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sprints_select" ON sprints FOR SELECT TO authenticated USING (true);
CREATE POLICY "sprints_admin_only" ON sprints FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- sprint_tasks
ALTER TABLE sprint_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sprint_tasks_select" ON sprint_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "sprint_tasks_admin_only" ON sprint_tasks FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- kpis
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kpis_select" ON kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "kpis_admin_only" ON kpis FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- kpi_history
ALTER TABLE kpi_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kpi_history_select" ON kpi_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "kpi_history_admin_only" ON kpi_history FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- time_entries
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "time_entries_select" ON time_entries FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "time_entries_own" ON time_entries FOR ALL TO authenticated USING (user_id = auth.uid());

-- integration_settings
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_own" ON integration_settings FOR ALL TO authenticated USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_escalations_task_id ON escalations(task_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_budget_id ON budget_expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON key_results(okr_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_risks_project_id ON risks(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_kpi_history_kpi_id ON kpi_history(kpi_id);

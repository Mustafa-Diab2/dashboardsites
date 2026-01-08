-- ================================
-- NEXUS v2.0 - Performance Optimization Indexes
-- ================================

-- Tasks Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status_date ON tasks(status, due_date) 
  WHERE status != 'done';

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks 
  USING GIN (assigned_to);

CREATE INDEX IF NOT EXISTS idx_tasks_client_status ON tasks(client_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_created_at_desc ON tasks(created_at DESC);

-- Attendance Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, clock_in DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_date_range ON attendance(clock_in, clock_out)
  WHERE clock_out IS NOT NULL;

-- Budget Expenses Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_budget_date ON budget_expenses(budget_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON budget_expenses(category, expense_date DESC);

-- OKRs Indexes
CREATE INDEX IF NOT EXISTS idx_okrs_active ON okrs(quarter, year, owner_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_okrs_owner_status ON okrs(owner_id, status);

-- Key Results Indexes
CREATE INDEX IF NOT EXISTS idx_key_results_okr ON key_results(okr_id, status);

CREATE INDEX IF NOT EXISTS idx_key_results_progress ON key_results(progress DESC)
  WHERE status != 'completed';

-- Clients Indexes
CREATE INDEX IF NOT EXISTS idx_clients_payment_status ON clients(paid_amount, total_payment);

-- Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Escalations Indexes
CREATE INDEX IF NOT EXISTS idx_escalations_unresolved ON escalations(task_id, created_at DESC)
  WHERE resolved = false;

-- Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- Composite Indexes for Complex Queries
CREATE INDEX IF NOT EXISTS idx_tasks_complex_filter ON tasks(status, priority, due_date)
  WHERE status != 'done';

CREATE INDEX IF NOT EXISTS idx_budget_health ON project_budgets(health_status, status, created_at DESC);

-- ================================
-- Materialized Views for Analytics
-- ================================

-- Budget Summary View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_budget_summary AS
SELECT 
  pb.id,
  pb.client_id,
  pb.project_name,
  pb.total_budget,
  pb.labor_budget,
  pb.expenses_budget,
  pb.status,
  pb.health_status,
  COALESCE(SUM(be.amount), 0) as total_expenses,
  COUNT(be.id) as expense_count,
  pb.actual_labor_cost,
  (pb.actual_labor_cost + COALESCE(SUM(be.amount), 0)) as total_actual_cost,
  pb.total_budget - (pb.actual_labor_cost + COALESCE(SUM(be.amount), 0)) as variance
FROM project_budgets pb
LEFT JOIN budget_expenses be ON pb.id = be.budget_id
GROUP BY pb.id, pb.client_id, pb.project_name, pb.total_budget, 
         pb.labor_budget, pb.expenses_budget, pb.status, 
         pb.health_status, pb.actual_labor_cost;

CREATE UNIQUE INDEX ON mv_budget_summary(id);

-- Task Analytics View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_task_analytics AS
SELECT 
  DATE_TRUNC('week', created_at) as week_start,
  status,
  priority,
  COUNT(*) as task_count,
  AVG(progress) as avg_progress,
  COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_count,
  COUNT(CASE WHEN due_date < NOW() AND status != 'done' THEN 1 END) as overdue_count
FROM tasks
GROUP BY DATE_TRUNC('week', created_at), status, priority;

CREATE INDEX ON mv_task_analytics(week_start DESC);

-- Team Performance View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_team_performance AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.role,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
  AVG(CASE WHEN t.status = 'done' THEN 
    EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/86400 
  END) as avg_completion_days,
  SUM(EXTRACT(EPOCH FROM (COALESCE(a.clock_out, NOW()) - a.clock_in))/3600) as total_hours_worked
FROM profiles p
LEFT JOIN tasks t ON p.id = ANY(t.assigned_to)
LEFT JOIN attendance a ON p.id = a.user_id AND a.clock_out IS NOT NULL
GROUP BY p.id, p.full_name, p.role;

CREATE UNIQUE INDEX ON mv_team_performance(user_id);

-- Client Revenue View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_client_revenue AS
SELECT 
  c.id as client_id,
  c.name,
  c.total_payment,
  c.paid_amount,
  c.total_payment - c.paid_amount as remaining_amount,
  (c.paid_amount * 100.0 / NULLIF(c.total_payment, 0)) as payment_percentage,
  COUNT(DISTINCT pb.id) as project_count,
  SUM(pb.total_budget) as total_budgets,
  COUNT(DISTINCT t.id) as task_count
FROM clients c
LEFT JOIN project_budgets pb ON c.id = pb.client_id
LEFT JOIN tasks t ON c.id = t.client_id
GROUP BY c.id, c.name, c.total_payment, c.paid_amount;

CREATE UNIQUE INDEX ON mv_client_revenue(client_id);

-- ================================
-- Refresh Functions
-- ================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_budget_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_task_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_team_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_client_revenue;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-refresh views (run hourly via cron)
-- You can set this up in Supabase Dashboard > Database > Cron Jobs
-- Schedule: 0 * * * * (every hour)
-- SQL: SELECT refresh_all_materialized_views();

-- ================================
-- Query Performance Tips
-- ================================

-- Enable query statistics
ALTER DATABASE postgres SET track_io_timing = ON;
ALTER DATABASE postgres SET track_functions = 'all';

-- Analyze tables for better query planning
ANALYZE tasks;
ANALYZE attendance;
ANALYZE project_budgets;
ANALYZE budget_expenses;
ANALYZE okrs;
ANALYZE key_results;
ANALYZE clients;
ANALYZE profiles;

-- ================================
-- Cleanup Old Data (Optional)
-- ================================

-- Function to archive old notifications
CREATE OR REPLACE FUNCTION archive_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '90 days' 
  AND is_read = true;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old escalations
CREATE OR REPLACE FUNCTION cleanup_resolved_escalations()
RETURNS void AS $$
BEGIN
  DELETE FROM escalations 
  WHERE resolved = true 
  AND resolved_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETE DASHBOARD SYSTEM - DATABASE SCHEMA
-- All tables for full control dashboard
-- =====================================================

BEGIN;

-- =====================================================
-- 1. WORKFLOW AUTOMATION TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('task_created', 'task_completed', 'budget_exceeded', 'date_reached', 'manual')),
  trigger_config JSONB DEFAULT '{}',
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_trigger ON workflow_automations(trigger_type, is_active);
CREATE INDEX idx_workflow_creator ON workflow_automations(created_by);

-- =====================================================
-- 2. DOCUMENT MANAGEMENT TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS document_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(500) NOT NULL,
  file_path VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100),
  folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES users(id),
  tags TEXT[] DEFAULT '{}',
  shared_with UUID[] DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_uploader ON documents(uploaded_by);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);

-- =====================================================
-- 3. INVOICING & BILLING SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES projects(id),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  items JSONB DEFAULT '[]',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_client ON invoices(client_id, status);
CREATE INDEX idx_invoices_status ON invoices(status, due_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- =====================================================
-- 4. PAYROLL SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS payroll_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid')),
  total_amount DECIMAL(15,2) DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES users(id),
  base_salary DECIMAL(15,2) NOT NULL,
  bonuses DECIMAL(15,2) DEFAULT 0,
  deductions DECIMAL(15,2) DEFAULT 0,
  overtime_hours DECIMAL(8,2) DEFAULT 0,
  overtime_pay DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  net_salary DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  payment_status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payroll_period ON payroll_entries(period_id);
CREATE INDEX idx_payroll_employee ON payroll_entries(employee_id);

-- =====================================================
-- 5. ASSET & RESOURCE MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('equipment', 'software', 'vehicle', 'property', 'other')),
  serial_number VARCHAR(100),
  purchase_date DATE,
  purchase_price DECIMAL(15,2),
  current_value DECIMAL(15,2),
  assigned_to UUID REFERENCES users(id),
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired', 'lost')),
  warranty_expiry DATE,
  next_maintenance DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_type VARCHAR(50),
  cost DECIMAL(15,2),
  performed_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assets_type ON assets(asset_type, status);
CREATE INDEX idx_assets_assigned ON assets(assigned_to);

-- =====================================================
-- 6. CUSTOM REPORT BUILDER
-- =====================================================

CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL,
  data_source VARCHAR(100) NOT NULL,
  filters JSONB DEFAULT '{}',
  columns JSONB DEFAULT '[]',
  grouping JSONB DEFAULT '[]',
  sorting JSONB DEFAULT '[]',
  chart_config JSONB DEFAULT '{}',
  schedule VARCHAR(20) CHECK (schedule IN ('none', 'daily', 'weekly', 'monthly')),
  recipients TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_creator ON custom_reports(created_by);
CREATE INDEX idx_reports_schedule ON custom_reports(schedule) WHERE schedule != 'none';

-- =====================================================
-- 7. COMMUNICATION HUB
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES email_templates(id),
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_logs_status ON email_logs(status, created_at);
CREATE INDEX idx_sms_logs_status ON sms_logs(status, created_at);

-- =====================================================
-- 8. AUDIT LOGS & SECURITY
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_table ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- =====================================================
-- 9. PREDICTIVE ANALYTICS CACHE
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_type VARCHAR(50) NOT NULL,
  subject_id UUID,
  prediction_data JSONB NOT NULL,
  confidence_score DECIMAL(5,2),
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_predictions_type ON analytics_predictions(prediction_type, valid_until);

-- =====================================================
-- 10. API INTEGRATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_name VARCHAR(255) NOT NULL,
  api_key VARCHAR(500) UNIQUE NOT NULL,
  permissions JSONB DEFAULT '[]',
  rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  secret_key VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_event ON webhooks(event_type, is_active);

-- =====================================================
-- 11. TRAINING & CERTIFICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS training_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_hours INTEGER,
  instructor VARCHAR(255),
  max_participants INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES training_courses(id),
  user_id UUID REFERENCES users(id),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  certificate_url VARCHAR(1000),
  score INTEGER,
  status VARCHAR(20) DEFAULT 'enrolled'
);

CREATE INDEX idx_enrollments_user ON course_enrollments(user_id);

-- =====================================================
-- FUNCTIONS FOR AUTOMATION
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_workflow_timestamp BEFORE UPDATE ON workflow_automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_timestamp BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_timestamp BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update invoice status to overdue
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices 
  SET status = 'overdue' 
  WHERE status = 'sent' 
  AND due_date < CURRENT_DATE
  AND paid_amount < total_amount;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- =====================================================
-- INITIAL DATA & PERMISSIONS
-- =====================================================

-- Enable RLS (Row Level Security)
ALTER TABLE workflow_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust based on your needs)
CREATE POLICY "Users can view their own workflows" ON workflow_automations
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can view shared documents" ON documents
  FOR SELECT USING (
    uploaded_by = auth.uid() OR 
    auth.uid() = ANY(shared_with)
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check all indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

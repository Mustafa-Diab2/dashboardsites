
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- =====================================================
-- 1. Profiles (for users)
-- =====================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text check (role in ('admin', 'frontend', 'backend', 'trainee', 'ui_ux', 'security', 'ai_specialist')) default 'frontend',
  hourly_rate decimal(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Profiles are viewable by everyone" on profiles;
drop policy if exists "Admins can update any profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Profiles are viewable by authenticated" on profiles;
drop policy if exists "Admins full access to profiles" on profiles;
drop policy if exists "Profiles_Select" on profiles;
drop policy if exists "Profiles_Update_Own" on profiles;
drop policy if exists "Profiles_Admin_All" on profiles;

create policy "Profiles_Select" on profiles for select to authenticated using (true);
create policy "Profiles_Update_Own" on profiles for update to authenticated using (auth.uid() = id);
create policy "Profiles_Admin_All" on profiles for all to authenticated 
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- =====================================================
-- 2. Clients
-- =====================================================
create table if not exists clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  project_name text not null,
  total_payment decimal(12, 2) default 0,
  paid_amount decimal(12, 2) default 0,
  contact_info text,
  notes text,
  public_token text,
  billing_notes text,
  default_requirements text,
  payment_terms text,
  created_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table clients enable row level security;

drop policy if exists "Clients are viewable by admins." on clients;
drop policy if exists "Admins can manage clients." on clients;
drop policy if exists "Public can view client via public token." on clients;
drop policy if exists "Clients_Select" on clients;
drop policy if exists "Clients_Admin_All" on clients;

create policy "Clients_Select" on clients for select to authenticated using (true);
create policy "Clients_Admin_All" on clients for all to authenticated 
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- =====================================================
-- 3. Tasks
-- =====================================================
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  type text check (type in ('work', 'training')) default 'work',
  assigned_to uuid[] default '{}',
  created_by uuid references auth.users not null,
  client_id uuid references clients on delete set null,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  status text check (status in ('backlog', 'in_progress', 'review', 'done')) default 'backlog',
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  start_date timestamp with time zone,
  due_date timestamp with time zone,
  deliverable_location text,
  delivery_method text check (delivery_method in ('in_person', 'upload', 'link')),
  deliverable_details text,
  client_payment decimal(12, 2) default 0,
  backend_share_pct decimal(5, 2) default 0,
  frontend_share_pct decimal(5, 2) default 0,
  payment_schedule text,
  backend_conditions text,
  frontend_conditions text,
  ux_requirements text,
  market_research_link text,
  tags text[] default '{}',
  checklist jsonb default '[]',
  blocked_by uuid[] default '{}',
  blocks uuid[] default '{}',
  approvals jsonb default '[]',
  payment_status text check (payment_status in ('pending', 'partial', 'paid')) default 'pending',
  due_alert_48h boolean default false,
  research jsonb default '[]',
  template_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tasks enable row level security;

drop policy if exists "Users can view tasks they are assigned to or created." on tasks;
drop policy if exists "Staff can manage tasks." on tasks;
drop policy if exists "Public can view tasks via client public token." on tasks;
drop policy if exists "Tasks_Select_All" on tasks;
drop policy if exists "Tasks_Admin_Manage" on tasks;

create policy "Tasks_Select_All" on tasks for select to authenticated using (true);
create policy "Tasks_Admin_Manage" on tasks for all to authenticated 
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR auth.uid()::uuid = created_by OR auth.uid()::uuid = ANY(assigned_to) );

-- =====================================================
-- 4. Courses
-- =====================================================
create table if not exists courses (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  link text,
  duration text,
  user_id uuid references auth.users on delete cascade not null,
  status text check (status in ('not_started', 'in_progress', 'completed')) default 'not_started',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table courses enable row level security;

drop policy if exists "Users can view their own courses." on courses;
drop policy if exists "Admins can manage courses." on courses;
drop policy if exists "Courses_Own_Select" on courses;
drop policy if exists "Courses_Admin_All" on courses;
drop policy if exists "Courses_Select" on courses;

create policy "Courses_Select" on courses for select to authenticated using (auth.uid() = user_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
create policy "Courses_Admin_All" on courses for all to authenticated using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- =====================================================
-- 5. Leaves
-- =====================================================
create table if not exists leaves (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  user_name text,
  type text check (type in ('sick', 'annual', 'unpaid', 'emergency', 'other')) default 'annual',
  start_date date not null,
  end_date date not null,
  reason text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  approved_by uuid references auth.users,
  approved_at timestamp with time zone,
  source text default 'manual',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table leaves enable row level security;

drop policy if exists "Users can view/create their own leaves." on leaves;
drop policy if exists "Users can insert their own leaves." on leaves;
drop policy if exists "Admins can manage all leaves." on leaves;
drop policy if exists "HR_ReadOnly_Member" on leaves;
drop policy if exists "HR_Admin_All_Leaves" on leaves;
drop policy if exists "Leaves_Select" on leaves;
drop policy if exists "Leaves_Insert" on leaves;
drop policy if exists "Leaves_Admin_All" on leaves;

create policy "Leaves_Select" on leaves for select to authenticated using (auth.uid() = user_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
create policy "Leaves_Insert" on leaves for insert to authenticated with check (auth.uid() = user_id);
create policy "Leaves_Admin_All" on leaves for all to authenticated using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- =====================================================
-- 6. Deductions
-- =====================================================
create table if not exists deductions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  user_name text,
  amount decimal(10, 2) not null,
  reason text,
  type text check (type in ('absence', 'late', 'penalty', 'other')) default 'other',
  source text default 'manual',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table deductions enable row level security;

drop policy if exists "Users can view their own deductions." on deductions;
drop policy if exists "Admins can manage deductions." on deductions;
drop policy if exists "HR_Admin_All_Deductions" on deductions;
drop policy if exists "Deductions_Select" on deductions;
drop policy if exists "Deductions_Admin_All" on deductions;

create policy "Deductions_Select" on deductions for select to authenticated using (auth.uid() = user_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
create policy "Deductions_Admin_All" on deductions for all to authenticated using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- =====================================================
-- 7. Audit Logs
-- =====================================================
create table if not exists audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table audit_logs enable row level security;

drop policy if exists "Everyone can view audit logs." on audit_logs;
drop policy if exists "Audit_Logs_Select" on audit_logs;

create policy "Audit_Logs_Select" on audit_logs for select to authenticated using (true);

-- =====================================================
-- 8. Attendance
-- =====================================================
create table if not exists attendance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  clock_in timestamp with time zone not null,
  clock_out timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table attendance enable row level security;

drop policy if exists "Users can view/manage their own attendance." on attendance;
drop policy if exists "Attendance_Own_All" on attendance;
drop policy if exists "Attendance_All_Authenticated" on attendance;

create policy "Attendance_All_Authenticated" on attendance for all to authenticated 
  using ( auth.uid() = user_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- =====================================================
-- 9. Chat
-- =====================================================
create table if not exists chat (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  user_name text,
  text text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table chat enable row level security;

drop policy if exists "Everyone can view chat." on chat;
drop policy if exists "Authenticated users can post to chat." on chat;
drop policy if exists "Chat_Select" on chat;
drop policy if exists "Chat_Insert" on chat;

create policy "Chat_Select" on chat for select to authenticated using (true);
create policy "Chat_Insert" on chat for insert to authenticated with check (auth.uid() = user_id);

-- =====================================================
-- 10. Notifications (NEW)
-- =====================================================
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text check (type in ('task_assigned', 'leave_approved', 'leave_rejected', 'mention', 'task_completed', 'general')) default 'general',
  title text not null,
  message text not null,
  link text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notifications enable row level security;

drop policy if exists "Notifications_Select_Own" on notifications;
drop policy if exists "Notifications_Update_Own" on notifications;
drop policy if exists "Notifications_Delete_Own" on notifications;
drop policy if exists "Notifications_Insert" on notifications;

create policy "Notifications_Select_Own" on notifications for select to authenticated 
  using (auth.uid() = user_id);
create policy "Notifications_Update_Own" on notifications for update to authenticated 
  using (auth.uid() = user_id);
create policy "Notifications_Delete_Own" on notifications for delete to authenticated 
  using (auth.uid() = user_id);
create policy "Notifications_Insert" on notifications for insert to authenticated 
  with check (true);

-- =====================================================
-- 11. Files (NEW)
-- =====================================================
create table if not exists files (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null,
  folder text default 'general',
  client_id uuid references clients on delete set null,
  task_id uuid references tasks on delete set null,
  uploaded_by uuid references auth.users on delete set null,
  uploaded_by_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table files enable row level security;

drop policy if exists "Files_Select" on files;
drop policy if exists "Files_Insert" on files;
drop policy if exists "Files_Delete" on files;
drop policy if exists "Files_Admin_All" on files;

create policy "Files_Select" on files for select to authenticated using (true);
create policy "Files_Insert" on files for insert to authenticated with check (auth.uid() = uploaded_by);
create policy "Files_Delete" on files for delete to authenticated 
  using (auth.uid() = uploaded_by OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
create policy "Files_Admin_All" on files for all to authenticated 
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- =====================================================
-- 12. Handle New User Function
-- =====================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', 'Unknown'), 
    new.email, 
    coalesce(new.raw_user_meta_data->>'role', 'frontend')
  )
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name;
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger if it doesn't exist
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- 13. Enable Realtime for tables
-- =====================================================
-- Note: Run these separately if you get "already exists" errors
do $$ 
begin
  alter publication supabase_realtime add table profiles;
exception when others then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table tasks;
exception when others then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table clients;
exception when others then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table chat;
exception when others then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table notifications;
exception when others then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table files;
exception when others then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table leaves;
exception when others then null;
end $$;

-- Security: Vulnerabilities
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id UUID PRIMARY KEY DEFAULT crypto.randomUUID(),
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
    category TEXT,
    affected_component TEXT,
    reported_by TEXT,
    assigned_to TEXT,
    cve_id TEXT,
    fix_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage vulnerabilities" ON vulnerabilities;
CREATE POLICY "Allow authenticated users to manage vulnerabilities" ON vulnerabilities
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Security: Pen Tests
CREATE TABLE IF NOT EXISTS pen_tests (
    id UUID PRIMARY KEY DEFAULT crypto.randomUUID(),
    name TEXT NOT NULL,
    scope TEXT,
    tester TEXT,
    status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    findings_count INTEGER DEFAULT 0,
    report_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE pen_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage pen_tests" ON pen_tests;
CREATE POLICY "Allow authenticated users to manage pen_tests" ON pen_tests
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Security: Incidents
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT crypto.randomUUID(),
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status TEXT CHECK (status IN ('detected', 'investigating', 'contained', 'resolved')),
    incident_type TEXT,
    affected_systems TEXT,
    detected_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    response_actions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage security_incidents" ON security_incidents;
CREATE POLICY "Allow authenticated users to manage security_incidents" ON security_incidents
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Backend: API Endpoints
CREATE TABLE IF NOT EXISTS api_endpoints (
    id UUID PRIMARY KEY DEFAULT crypto.randomUUID(),
    name TEXT NOT NULL,
    method TEXT CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
    path TEXT NOT NULL,
    description TEXT,
    category TEXT,
    auth_required BOOLEAN DEFAULT TRUE,
    request_body TEXT,
    response_example TEXT,
    query_params TEXT,
    headers TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage api_endpoints" ON api_endpoints;
CREATE POLICY "Allow authenticated users to manage api_endpoints" ON api_endpoints
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Backend: Environment Variables
CREATE TABLE IF NOT EXISTS env_variables (
    id UUID PRIMARY KEY DEFAULT crypto.randomUUID(),
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    environment TEXT CHECK (environment IN ('development', 'staging', 'production')),
    description TEXT,
    is_secret BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE env_variables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage env_variables" ON env_variables;
CREATE POLICY "Allow authenticated users to manage env_variables" ON env_variables
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable Realtime for new tables
do $$ 
begin
  alter publication supabase_realtime add table vulnerabilities;
exception when others then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table pen_tests;
exception when others then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table security_incidents;
exception when others then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table api_endpoints;
exception when others then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table env_variables;
exception when others then null;
end $$;


-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles (for users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text check (role in ('admin', 'frontend', 'backend', 'trainee', 'ui_ux', 'security', 'ai_specialist')) default 'frontend',
  hourly_rate decimal(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

-- Clear old policies to avoid conflicts
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Profiles are viewable by everyone" on profiles;
drop policy if exists "Admins can update any profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Profiles are viewable by authenticated" on profiles;
drop policy if exists "Admins full access to profiles" on profiles;

-- New robust policies using JWT metadata to avoid recursion
create policy "Profiles_Select" on profiles for select to authenticated using (true);
create policy "Profiles_Update_Own" on profiles for update to authenticated using (auth.uid() = id);
create policy "Profiles_Admin_All" on profiles for all to authenticated 
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- 2. Clients
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

-- Add created_by if it doesn't exist (in case table already existed)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='clients' and column_name='created_by') then
    alter table clients add column created_by uuid references auth.users;
  end if;
end $$;

alter table clients enable row level security;

drop policy if exists "Clients are viewable by admins." on clients;
drop policy if exists "Admins can manage clients." on clients;
drop policy if exists "Public can view client via public token." on clients;
drop policy if exists "Clients_Select" on clients;
drop policy if exists "Clients_Admin_All" on clients;

create policy "Clients_Select" on clients for select to authenticated using (true);
create policy "Clients_Admin_All" on clients for all to authenticated 
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- 3. Tasks
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
drop policy if exists "Tasks_Insert_Admin" on tasks;
drop policy if exists "Tasks_Update_Admin" on tasks;
drop policy if exists "Tasks_Delete_Admin" on tasks;

create policy "Tasks_Select_All" on tasks for select to authenticated using (true);
create policy "Tasks_Admin_Manage" on tasks for all to authenticated 
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR auth.uid()::uuid = created_by OR auth.uid()::uuid = ANY(assigned_to) );

-- 4. Courses
alter table courses enable row level security;
drop policy if exists "Users can view their own courses." on courses;
drop policy if exists "Admins can manage courses." on courses;
drop policy if exists "Courses_Own_Select" on courses;
drop policy if exists "Courses_Admin_All" on courses;

create policy "Courses_Select" on courses for select to authenticated using (auth.uid() = user_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
create policy "Courses_Admin_All" on courses for all to authenticated using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 5. Leaves
alter table leaves enable row level security;
drop policy if exists "Users can view/create their own leaves." on leaves;
drop policy if exists "Users can insert their own leaves." on leaves;
drop policy if exists "Admins can manage all leaves." on leaves;
drop policy if exists "HR_ReadOnly_Member" on leaves;
drop policy if exists "HR_Admin_All_Leaves" on leaves;

create policy "Leaves_Select" on leaves for select to authenticated using (auth.uid() = user_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
create policy "Leaves_Insert" on leaves for insert to authenticated with check (auth.uid() = user_id);
create policy "Leaves_Admin_All" on leaves for all to authenticated using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 6. Deductions
alter table deductions enable row level security;
drop policy if exists "Users can view their own deductions." on deductions;
drop policy if exists "Admins can manage deductions." on deductions;
drop policy if exists "HR_Admin_All_Deductions" on deductions;

create policy "Deductions_Select" on deductions for select to authenticated using (auth.uid() = user_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
create policy "Deductions_Admin_All" on deductions for all to authenticated using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 7. Audit Logs
alter table audit_logs enable row level security;
drop policy if exists "Everyone can view audit logs." on audit_logs;
create policy "Audit_Logs_Select" on audit_logs for select to authenticated using (true);

-- 8. Attendance
alter table attendance enable row level security;
drop policy if exists "Users can view/manage their own attendance." on attendance;
drop policy if exists "Attendance_Own_All" on attendance;
create policy "Attendance_All_Authenticated" on attendance for all to authenticated 
  using ( auth.uid() = user_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- 9. Chat
alter table chat enable row level security;
drop policy if exists "Everyone can view chat." on chat;
drop policy if exists "Authenticated users can post to chat." on chat;
drop policy if exists "Chat_Select" on chat;
drop policy if exists "Chat_Insert" on chat;

create policy "Chat_Select" on chat for select to authenticated using (true);
create policy "Chat_Insert" on chat for insert to authenticated with check (auth.uid() = user_id);

-- 10. Update handle_new_user to ensure metadata role is respected
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

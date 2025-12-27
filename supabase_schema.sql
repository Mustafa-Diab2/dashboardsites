
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles (for users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text check (role in ('admin', 'frontend', 'backend', 'trainee', 'ui_ux', 'security', 'ai_specialist')) default 'frontend',
  hourly_rate decimal(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

create policy "Admins can update any profile." on profiles
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 2. Clients
create table clients (
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table clients enable row level security;

-- Clients Policies
create policy "Clients are viewable by admins." on clients
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Public can view client via public token." on clients
  for select using (true);

create policy "Admins can manage clients." on clients
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 3. Tasks
create table tasks (
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

-- Tasks Policies
create policy "Users can view tasks they are assigned to or created." on tasks
  for select using (
    auth.uid() = created_by or 
    auth.uid() = any(assigned_to) or
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Public can view tasks via client public token." on tasks
  for select using (
    exists (
      select 1 from clients
      where clients.id = tasks.client_id
    )
  );

create policy "Staff can manage tasks." on tasks
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'backend', 'frontend'))
  );

-- 4. Courses
create table courses (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  duration text,
  status text,
  link text,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table courses enable row level security;

create policy "Users can view their own courses." on courses
  for select using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can manage courses." on courses
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 5. Leaves
create table leaves (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  type text check (type in ('sick', 'annual', 'unpaid', 'emergency', 'other')),
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  days integer,
  reason text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  approved_by uuid references auth.users,
  approved_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table leaves enable row level security;

create policy "Users can view/create their own leaves." on leaves
  for select using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Users can insert their own leaves." on leaves
  for insert with check (auth.uid() = user_id);

create policy "Admins can manage all leaves." on leaves
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 6. Deductions
create table deductions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount decimal(12, 2) not null,
  reason text not null,
  type text check (type in ('absence', 'late', 'penalty', 'other')),
  date date not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text
);

alter table deductions enable row level security;

create policy "Users can view their own deductions." on deductions
  for select using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can manage deductions." on deductions
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 7. Audit Logs
create table audit_logs (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks on delete cascade,
  user_id uuid references auth.users,
  action text,
  field text,
  old_value jsonb,
  new_value jsonb,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table audit_logs enable row level security;

create policy "Everyone can view audit logs." on audit_logs
  for select using (true);

-- 8. Attendance (Simplified for start)
create table attendance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  status text default 'present',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table attendance enable row level security;

create policy "Users can view/manage their own attendance." on attendance
  for all using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 9. Chat
create table chat (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  user_name text,
  text text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table chat enable row level security;

create policy "Everyone can view chat." on chat
  for select using (true);

create policy "Authenticated users can post to chat." on chat
  for insert with check (auth.uid() = user_id);

-- Function to handle profile creation on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'frontend');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

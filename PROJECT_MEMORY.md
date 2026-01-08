# 🧠 ذاكرة المشروع - NEXUS Management Dashboard

> **آخر تحديث:** 8 يناير 2026  
> **الإصدار:** 1.0.0  
> **الحالة:** Production Ready (مع توصيات للتحسين)

---

## 📋 جدول المحتويات

1. [نظرة عامة](#-نظرة-عامة)
2. [التقنيات المستخدمة](#-التقنيات-المستخدمة)
3. [البنية المعمارية](#-البنية-المعمارية)
4. [الميزات الرئيسية](#-الميزات-الرئيسية)
5. [قاعدة البيانات](#-قاعدة-البيانات)
6. [أنظمة الصلاحيات والأمان](#-أنظمة-الصلاحيات-والأمان)
7. [التكاملات الخارجية](#-التكاملات-الخارجية)
8. [دليل الكود السريع](#-دليل-الكود-السريع)
9. [التدفقات الحرجة](#-التدفقات-الحرجة)
10. [نقاط التحسين](#-نقاط-التحسين-والتوصيات)
11. [الأوامر المهمة](#-الأوامر-المهمة)

---

## 🎯 نظرة عامة

**NEXUS Management Dashboard** هو نظام إدارة شامل ومتكامل لإدارة:
- 📋 **المهام والمشاريع** (Task Management)
- 👥 **الفرق والموارد البشرية** (Team & HR)
- 💼 **العملاء والمدفوعات** (Clients & Payments)
- 🤖 **تحليلات الذكاء الاصطناعي** (AI Insights)
- 📊 **التقارير والإحصائيات** (Reports & Analytics)
- 🔒 **الأمان والثغرات** (Security)

### الهدف الرئيسي
توفير منصة موحدة لإدارة جميع جوانب العمل من واجهة واحدة مع دعم Real-time، تعدد اللغات، وتحليلات AI متقدمة.

### المستخدمون المستهدفون
- **Admins**: صلاحيات كاملة
- **Developers**: Frontend, Backend, Fullstack
- **Trainees**: متدربون
- **Specialists**: UI/UX, Security, AI
- **Clients**: بوابة خاصة للعملاء

---

## 🛠️ التقنيات المستخدمة

### Frontend Stack
```json
{
  "framework": "Next.js 15.3.8",
  "language": "TypeScript 5",
  "styling": "Tailwind CSS 3.4",
  "ui-library": "Radix UI",
  "animation": "Framer Motion 11.18",
  "charts": "Recharts 2.15",
  "forms": "React Hook Form + Zod",
  "dates": "date-fns 4.1"
}
```

### Backend & Database
```json
{
  "database": "PostgreSQL (Supabase)",
  "authentication": "Supabase Auth",
  "real-time": "Supabase Realtime",
  "storage": "Supabase Storage",
  "security": "Row Level Security (RLS)"
}
```

### AI Integration
```json
{
  "framework": "Firebase Genkit 1.20.0",
  "model": "Google Gemini 2.5 Flash",
  "alternative": "OpenAI SDK"
}
```

### Other Tools
- **PDF Export**: jsPDF + html2canvas
- **Excel Export**: xlsx
- **Command Palette**: cmdk
- **Theming**: next-themes
- **i18n**: Custom Context (AR/EN)

---

## 🏗️ البنية المعمارية

### هيكل المجلدات

```
Dashboard/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/ai/              # AI API Endpoints
│   │   ├── client-portal/       # بوابة العملاء
│   │   ├── layout.tsx           # Layout رئيسي
│   │   └── page.tsx             # الصفحة الرئيسية
│   │
│   ├── components/               # 50+ مكون React
│   │   ├── *-management.tsx     # مكونات الإدارة
│   │   ├── *-dashboard.tsx      # لوحات التحكم
│   │   ├── charts/              # مكونات الرسوم البيانية
│   │   ├── templates/           # قوالب المهام
│   │   └── ui/                  # مكونات UI الأساسية
│   │
│   ├── ai/                       # AI Configuration & Flows
│   │   ├── genkit.ts            # إعدادات Genkit
│   │   └── flows/               # AI Workflows
│   │
│   ├── lib/                      # Libraries & Utilities
│   │   ├── supabase.ts          # Supabase client
│   │   ├── actions.ts           # Server actions
│   │   ├── admin-actions.ts     # Admin-only actions
│   │   ├── data.ts              # Type definitions
│   │   ├── notifications.ts     # Notification helpers
│   │   └── utils.ts             # Utility functions
│   │
│   ├── hooks/                    # Custom React Hooks
│   │   ├── use-supabase-data.ts # Real-time data hooks
│   │   ├── use-mutations.ts     # CRUD operations
│   │   ├── use-clients.ts       # Client-specific hooks
│   │   └── use-users.ts         # User-specific hooks
│   │
│   ├── context/                  # React Context Providers
│   │   ├── supabase-context.tsx # Auth & Session
│   │   ├── language-context.tsx # i18n
│   │   └── theme-context.tsx    # Dark/Light mode
│   │
│   └── locales/                  # Translation files
│       ├── ar.json              # العربية
│       └── en.json              # English
│
├── public/                       # Static files
├── scripts/                      # Setup scripts
└── docs/                         # Documentation
```

### نمط المعمارية

**Architecture Pattern**: 
- ✅ Next.js 15 App Router (Server Components + Client Components)
- ✅ Server Actions للعمليات الحساسة
- ✅ Real-time Subscriptions (Supabase)
- ✅ Context API لإدارة الحالة
- ✅ Custom Hooks للمنطق القابل لإعادة الاستخدام

**Data Flow**:
```
User Action → Component → Hook/Server Action → Supabase → Real-time Update → UI
```

---

## 🎨 الميزات الرئيسية

### 1️⃣ إدارة المهام (Task Management) ⭐⭐⭐⭐⭐
**الملفات**: [task-form.tsx](src/components/task-form.tsx), [task-details-dialog.tsx](src/components/task-details-dialog.tsx)

**الميزات**:
- ✅ نظام Kanban (Backlog → In Progress → Review → Done)
- ✅ تعيين متعدد (Multiple assignees)
- ✅ أولويات (High, Medium, Low)
- ✅ تتبع التقدم (Progress %)
- ✅ **Checklist** → [task-checklist.tsx](src/components/task-checklist.tsx)
- ✅ **Research Hub** → [task-research.tsx](src/components/task-research.tsx)
- ✅ **Dependencies** → [task-dependencies.tsx](src/components/task-dependencies.tsx)
- ✅ **Approvals** → [task-approvals.tsx](src/components/task-approvals.tsx)
- ✅ تفاصيل مالية (Client Payment + Backend/Frontend shares)
- ✅ متطلبات UX وشروط تقنية

### 2️⃣ إدارة العملاء (Client Management) ⭐⭐⭐⭐
**الملف**: [clients-dashboard.tsx](src/components/clients-dashboard.tsx)

**الميزات**:
- ✅ إضافة/تعديل/حذف العملاء
- ✅ تتبع المدفوعات (Total/Paid/Balance)
- ✅ **Client Portal** - بوابة للعملاء → [src/app/client-portal/[token]/page.tsx](src/app/client-portal/[token]/page.tsx)
- ✅ ربط المهام بالعملاء
- ✅ Token-based authentication

### 3️⃣ إدارة الموارد البشرية (HR) ⭐⭐⭐⭐⭐
**الملف**: [hr-management-page.tsx](src/components/hr-management-page.tsx)

#### أ. الحضور والانصراف
**الملفات**: [attendance.tsx](src/components/attendance.tsx), [attendance-admin.tsx](src/components/attendance-admin.tsx)
- ✅ تسجيل Clock In/Out
- ✅ حساب ساعات العمل تلقائياً
- ✅ تقارير شهرية للأدمن
- ✅ تصدير Excel

#### ب. إدارة الإجازات
**الملف**: [leave-management.tsx](src/components/leave-management.tsx)
- ✅ طلب إجازة (Sick/Annual/Unpaid/Emergency)
- ✅ الموافقة/الرفض (Admin only)
- ✅ **استخلاص تلقائي من المحادثات** باستخدام NLP

#### ج. إدارة الخصومات
**الملف**: [deductions-management.tsx](src/components/deductions-management.tsx)
- ✅ تسجيل خصومات (غياب، تأخير، جزاءات)
- ✅ **استخلاص تلقائي من المحادثات**
- ✅ ربط بكشوف المرتبات

### 4️⃣ إدارة الفريق (Team Management) ⭐⭐⭐⭐⭐
**الملف**: [team-management.tsx](src/components/team-management.tsx)

**الميزات**:
- ✅ إضافة/تعديل/حذف أعضاء الفريق
- ✅ **Admin Actions** → [admin-actions.ts](src/lib/admin-actions.ts)
  - إنشاء/حذف Users من Supabase Auth
  - استخدام Service Role Key
- ✅ تحديد الأدوار (Admin, Frontend, Backend, Trainee, UI/UX, Security, AI)
- ✅ معدلات الساعة (Hourly rates)

### 5️⃣ تقارير الرواتب (Salary Reports) ⭐⭐⭐⭐
**الملف**: [salary-report.tsx](src/components/salary-report.tsx)

**الميزات**:
- ✅ حساب الراتب من ساعات العمل
- ✅ خصم الخصومات تلقائياً
- ✅ عرض الراتب الصافي
- ✅ **تحليل الأداء بـ AI** لكل موظف
- ✅ تتبع المهام المكتملة

### 6️⃣ الذكاء الاصطناعي (AI Features) ⭐⭐⭐⭐⭐
**الملفات**: 
- [ai-insights.tsx](src/components/ai-insights.tsx)
- [src/ai/flows/generate-team-insights.ts](src/ai/flows/generate-team-insights.ts)
- [src/ai/flows/generate-salary-insights.ts](src/ai/flows/generate-salary-insights.ts)
- [actions.ts](src/lib/actions.ts)

**الميزات**:
- ✅ **تحليل أداء الفريق** - تقارير ملخصة ومفصلة بالعربية
- ✅ **توصيات ذكية** - إعادة توزيع المهام، تحديد الاختناقات
- ✅ **تحليل فردي** - تقييم أداء كل عضو
- ✅ استخدام **Google Gemini 2.5 Flash**
- ✅ **AI Prompt Generator** → [ai-prompt-generator.tsx](src/components/ai-prompt-generator.tsx)

### 7️⃣ خريطة الأحمال (Workload Heatmap) ⭐⭐⭐⭐
**الملف**: [workload-heatmap.tsx](src/components/workload-heatmap.tsx)

- ✅ عرض أحمال كل عضو لـ 7/14 يوم القادمة
- ✅ ترميز بالألوان (خفيف → محمّل جداً)
- ✅ تنبيهات لإعادة التوزيع

### 8️⃣ إدارة المدفوعات (Payment Management) ⭐⭐⭐⭐
**الملف**: [payment-management.tsx](src/components/payment-management.tsx)

- ✅ إجمالي الإيرادات
- ✅ المدفوعات المعلقة/الجزئية/المكتملة
- ✅ المدفوعات المتأخرة
- ✅ تقسيم Backend/Frontend
- ✅ تصدير CSV

### 9️⃣ محادثة الفريق (Team Chat) ⭐⭐⭐⭐
**الملف**: [team-chat.tsx](src/components/team-chat.tsx)

- ✅ محادثة فورية Real-time
- ✅ **استخلاص تلقائي للإجازات والخصومات** من رسائل الأدمن
- ✅ دعم Mentions
- ✅ عرض الوقت النسبي

### 🔟 Command Palette ⭐⭐⭐⭐⭐
**الملف**: [command-palette.tsx](src/components/command-palette.tsx)

- ✅ اختصار `Ctrl+K` / `⌘+K`
- ✅ إنشاء مهام/عملاء سريعاً
- ✅ التنقل السريع
- ✅ تطبيق فلاتر
- ✅ تصدير PDF

### 1️⃣1️⃣ الدورات التدريبية (Courses) ⭐⭐⭐⭐
**الملف**: [courses.tsx](src/components/courses.tsx)

- ✅ تعيين دورات للأعضاء
- ✅ تتبع الحالة (Not Started/In Progress/Completed)
- ✅ إشعارات بالبريد الإلكتروني

### 1️⃣2️⃣ التقويم الشامل (Global Calendar) ⭐⭐⭐⭐
**الملف**: [global-calendar.tsx](src/components/global-calendar.tsx)

- ✅ عرض مواعيد تسليم المهام
- ✅ عرض الإجازات المعتمدة
- ✅ دعم اللغتين

### 1️⃣3️⃣ إدارة الملفات (File Manager) ⭐⭐⭐⭐
**الملف**: [file-manager.tsx](src/components/file-manager.tsx)

- ✅ رفع/تحميل/حذف الملفات
- ✅ تنظيم بالمجلدات
- ✅ ربط بالعملاء والمهام
- ✅ Supabase Storage

### 1️⃣4️⃣ مركز الإشعارات (Notifications) ⭐⭐⭐⭐
**الملف**: [notification-center.tsx](src/components/notification-center.tsx)

- ✅ إشعارات Real-time
- ✅ أنواع متعددة (Task Assigned, Leave, Mentions, etc.)
- ✅ تحديد كمقروء

### 1️⃣5️⃣ لوحة الأمان (Security Dashboard) ⭐⭐⭐⭐⭐
**الملف**: [security-dashboard.tsx](src/components/security-dashboard.tsx)

- ✅ إدارة الثغرات الأمنية (Vulnerabilities)
- ✅ اختبارات الاختراق (Pen Tests)
- ✅ الحوادث الأمنية (Incidents)
- ✅ تصنيف حسب الخطورة

### 1️⃣6️⃣ أدوات Backend (Backend Tools) ⭐⭐⭐⭐⭐
**الملف**: [backend-tools.tsx](src/components/backend-tools.tsx)

- ✅ API Documentation
- ✅ Environment Variables Manager
- ✅ Code Review Checklist
- ✅ اختبار API endpoints

### 1️⃣7️⃣ سجل النشاط (Activity Log) ⭐⭐⭐
**الملف**: [activity-log.tsx](src/components/activity-log.tsx)

- ✅ تتبع التغييرات على المهام
- ✅ Audit trail

### 1️⃣8️⃣ قوالب المهام (Templates) ⭐⭐⭐⭐
**الملف**: [src/components/templates/task-templates.tsx](src/components/templates/task-templates.tsx)

- ✅ حفظ قوالب للمهام المتكررة
- ✅ Checklists جاهزة

---

## 🗄️ قاعدة البيانات

### الجداول الرئيسية

#### 1. **profiles** (المستخدمون)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'frontend', 'backend', 'trainee', 'ui_ux', 'security', 'ai_specialist')),
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. **tasks** (المهام)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('work', 'training')),
  assigned_to UUID[] DEFAULT '{}',  -- تعيين متعدد
  client_id UUID REFERENCES clients,
  status TEXT DEFAULT 'backlog',
  priority TEXT DEFAULT 'medium',
  progress INTEGER DEFAULT 0,
  start_date DATE,
  due_date DATE,
  client_payment DECIMAL(10,2),
  backend_share_pct INTEGER,
  frontend_share_pct INTEGER,
  checklist JSONB DEFAULT '[]',
  research JSONB DEFAULT '[]',
  blocked_by UUID[] DEFAULT '{}',
  blocks UUID[] DEFAULT '{}',
  approvals JSONB DEFAULT '[]',
  payment_status TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. **clients** (العملاء)
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project_name TEXT,
  total_payment DECIMAL(10,2),
  paid_amount DECIMAL(10,2) DEFAULT 0,
  contact_info TEXT,
  notes TEXT,
  public_token TEXT UNIQUE,  -- للبوابة
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. **attendance** (الحضور)
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. **leaves** (الإجازات)
```sql
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  user_name TEXT NOT NULL,
  type TEXT CHECK (type IN ('sick', 'annual', 'unpaid', 'emergency', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES profiles,
  approved_at TIMESTAMPTZ,
  source TEXT DEFAULT 'manual',  -- manual | chat
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. **deductions** (الخصومات)
```sql
CREATE TABLE deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  user_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  type TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. **notifications** (الإشعارات)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8. **files** (الملفات)
```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  folder TEXT,
  client_id UUID REFERENCES clients,
  task_id UUID REFERENCES tasks,
  uploaded_by UUID REFERENCES profiles,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 9. **chat** (المحادثة)
```sql
CREATE TABLE chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

#### 10. **courses** (الدورات)
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  link TEXT,
  duration TEXT,
  user_id UUID REFERENCES profiles NOT NULL,
  status TEXT DEFAULT 'not_started',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 11-15. جداول الأمان والـ Backend
- **vulnerabilities** - الثغرات الأمنية
- **pen_tests** - اختبارات الاختراق
- **security_incidents** - الحوادث الأمنية
- **api_endpoints** - توثيق API
- **env_variables** - متغيرات البيئة

#### 16. **audit_logs** (سجل المراجعة)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### العلاقات الرئيسية
```
profiles ─┬─ tasks (created_by, assigned_to[])
          ├─ clients (via tasks)
          ├─ courses (user_id)
          ├─ leaves (user_id, approved_by)
          ├─ attendance (user_id)
          ├─ files (uploaded_by)
          └─ notifications (user_id)

tasks ─┬─ files (task_id)
       └─ tasks (dependencies: blocked_by[], blocks[])

clients ─┬─ tasks (client_id)
         └─ files (client_id)
```

---

## 🔐 أنظمة الصلاحيات والأمان

### Row Level Security (RLS) Policies

#### Profiles
```sql
-- SELECT: الكل يرى الكل
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);

-- UPDATE: own profile أو admin
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));
```

#### Tasks
```sql
-- SELECT: الكل يرى الكل
CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated USING (true);

-- INSERT/UPDATE/DELETE: admin أو creator أو assignee
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));
```

#### Clients
```sql
-- SELECT: authenticated
-- CRUD: admin only
CREATE POLICY "clients_admin_only" ON clients FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));
```

#### Leaves
```sql
-- SELECT: own leaves أو admin
-- INSERT: own leaves only
-- UPDATE/DELETE: admin only
CREATE POLICY "leaves_select" ON leaves FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));
```

#### Deductions
```sql
-- SELECT: own أو admin
-- CRUD: admin only
```

#### Attendance
```sql
-- CRUD: own records أو admin
```

#### Notifications
```sql
-- CRUD: own notifications only
CREATE POLICY "notifications_own" ON notifications FOR ALL TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());
```

#### Files
```sql
-- SELECT: authenticated
-- INSERT: authenticated (uploaded_by = self)
-- DELETE: owner أو admin
```

### Authentication System

**Supabase Auth Features**:
- ✅ Email/Password authentication
- ✅ Session management مع cookies
- ✅ Role-based access control
- ✅ User metadata لتخزين الدور
- ✅ Service Role Key للعمليات Admin

**Security Measures**:
- ✅ Environment variables للأسرار
- ✅ CORS configuration
- ✅ RLS على كل الجداول
- ✅ Server Actions للعمليات الحساسة
- ✅ Token-based client portal

---

## 🔗 التكاملات الخارجية

### 1. Supabase
**الملف الرئيسي**: [src/lib/supabase.ts](src/lib/supabase.ts)

**الاستخدامات**:
- ✅ PostgreSQL Database
- ✅ Authentication & Authorization
- ✅ Real-time subscriptions
- ✅ Storage (للملفات)
- ✅ Row Level Security

**Environment Variables المطلوبة**:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # للعمليات Admin فقط
```

### 2. Firebase Genkit + Google AI
**الملفات**:
- [src/ai/genkit.ts](src/ai/genkit.ts) - Configuration
- [src/ai/flows/](src/ai/flows/) - AI Workflows
- [src/lib/actions.ts](src/lib/actions.ts) - Server action wrapper

**الاستخدامات**:
- ✅ تحليل أداء الفريق
- ✅ توليد insights بالعربية
- ✅ تقارير ملخصة ومفصلة
- ✅ AI Prompt Generation

**Environment Variables**:
```env
GOOGLE_GENAI_API_KEY=
```

**الأوامر**:
```bash
npm run genkit:dev  # تشغيل Genkit للتطوير
npm run dev         # Next.js + Genkit معاً
```

### 3. Email Notifications
**حسب التوثيق**: [EMAIL_NOTIFICATIONS_GUIDE.md](EMAIL_NOTIFICATIONS_GUIDE.md)

**الميزات**:
- ✅ إرسال إشعارات عند إنشاء مهمة
- ✅ إرسال إشعارات عند تعيين دورة
- ✅ استخدام Nodemailer
- ✅ Templates احترافية

**ملاحظة**: الكود موجود في مجلد `functions/` منفصل

### 4. Theming & i18n

**Theming** - [src/context/theme-context.tsx](src/context/theme-context.tsx):
- ✅ Dark/Light mode
- ✅ next-themes integration
- ✅ LocalStorage persistence

**i18n** - [src/context/language-context.tsx](src/context/language-context.tsx):
- ✅ العربية/English
- ✅ ملفات الترجمة: [ar.json](src/locales/ar.json), [en.json](src/locales/en.json)
- ✅ دالة `t(key)` للترجمة
- ✅ RTL support للعربية

---

## 📚 دليل الكود السريع

### الملفات الأساسية

#### 1. **Supabase Client & Context**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(url, key)

// src/context/supabase-context.tsx
// Context يوفر: user, session, role, loading
import { useSupabase } from '@/context/supabase-context'
const { user, role, session } = useSupabase()
```

#### 2. **Real-time Data Hooks**
```typescript
// src/hooks/use-supabase-data.ts
import { useCollection, useDocument } from '@/hooks/use-supabase-data'

// جلب collection مع Real-time
const tasks = useCollection<Task>('tasks', {
  orderBy: { column: 'created_at', ascending: false }
})

// جلب document واحد
const task = useDocument<Task>('tasks', taskId)
```

#### 3. **Mutations (CRUD Operations)**
```typescript
// src/hooks/use-mutations.ts
import { useAddMutation, useUpdateMutation, useDeleteMutation } from '@/hooks/use-mutations'

const { mutate: addTask, isLoading } = useAddMutation('tasks')
const { mutate: updateTask } = useUpdateMutation('tasks')
const { mutate: deleteTask } = useDeleteMutation('tasks')

// استخدام
addTask({ title: 'New Task', ... })
updateTask({ id, ...updates })
deleteTask(id)
```

#### 4. **Server Actions (AI & Admin)**
```typescript
// src/lib/actions.ts
import { generateTeamInsights } from '@/lib/actions'

// استدعاء AI
const insights = await generateTeamInsights(teamData, language)

// src/lib/admin-actions.ts
import { createUserWithAuth, deleteUserCompletely } from '@/lib/admin-actions'

// إنشاء مستخدم (Admin only)
await createUserWithAuth(email, password, userData)

// حذف مستخدم (Admin only)
await deleteUserCompletely(userId)
```

#### 5. **Notifications**
```typescript
// src/lib/notifications.ts
import { createNotification } from '@/lib/notifications'

await createNotification({
  user_id: userId,
  type: 'task_assigned',
  title: 'مهمة جديدة',
  message: 'تم تعيين مهمة لك',
  link: `/tasks/${taskId}`
})
```

#### 6. **PDF Export**
```typescript
// src/lib/pdf-export.ts
import { exportTeamReportToPDF } from '@/lib/pdf-export'

await exportTeamReportToPDF(teamData, 'ar')
```

#### 7. **i18n (Translations)**
```typescript
// src/context/language-context.tsx
import { useLanguage } from '@/context/language-context'

const { language, setLanguage, t, dir } = useLanguage()

// استخدام
<h1>{t('dashboard.title')}</h1>
```

### الأنماط الشائعة (Common Patterns)

#### Pattern 1: قراءة وعرض بيانات Real-time
```typescript
'use client'
import { useCollection } from '@/hooks/use-supabase-data'

export default function MyComponent() {
  const tasks = useCollection<Task>('tasks')
  
  if (!tasks) return <div>Loading...</div>
  
  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>{task.title}</div>
      ))}
    </div>
  )
}
```

#### Pattern 2: إضافة/تعديل بيانات
```typescript
'use client'
import { useAddMutation, useUpdateMutation } from '@/hooks/use-mutations'
import { useToast } from '@/hooks/use-toast'

export default function TaskForm() {
  const { mutate: addTask } = useAddMutation('tasks')
  const { toast } = useToast()
  
  const handleSubmit = async (data) => {
    await addTask(data)
    toast({ title: 'تم الحفظ بنجاح' })
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

#### Pattern 3: فحص الصلاحيات
```typescript
import { useSupabase } from '@/context/supabase-context'

export default function AdminPanel() {
  const { role } = useSupabase()
  
  if (role !== 'admin') {
    return <div>غير مصرح لك بالوصول</div>
  }
  
  return <div>لوحة الأدمن</div>
}
```

#### Pattern 4: استدعاء AI
```typescript
'use server'
import { generateTeamInsights } from '@/lib/actions'

export async function analyzeTeam(teamId: string) {
  const result = await generateTeamInsights({
    teamId,
    period: 'month'
  }, 'ar')
  
  return result
}
```

---

## 🔄 التدفقات الحرجة (Critical Workflows)

### 1. إنشاء مستخدم جديد (Admin)
```
1. [team-management.tsx] → Admin يدخل بيانات المستخدم
2. [admin-actions.ts] → createUserWithAuth()
   └─ createClient() مع Service Role Key
   └─ auth.admin.createUser() → إنشاء في Supabase Auth
   └─ INSERT في جدول profiles
   └─ حفظ user_metadata (role)
3. Real-time → تحديث قائمة الأعضاء تلقائياً
4. إشعار للمستخدم الجديد (optional)
```

**الملفات المستخدمة**:
- [team-management.tsx](src/components/team-management.tsx)
- [admin-actions.ts](src/lib/admin-actions.ts)

### 2. تعيين مهمة جديدة
```
1. [task-form.tsx] → إدخال تفاصيل المهمة
2. [use-mutations.ts] → useAddMutation('tasks')
   └─ supabase.from('tasks').insert()
3. [notifications.ts] → createNotification() لكل assignee
4. Real-time → تحديث:
   - قائمة المهام
   - Workload Heatmap
   - إشعارات المستخدمين
5. (Optional) Email Notification
```

**الملفات المستخدمة**:
- [task-form.tsx](src/components/task-form.tsx)
- [use-mutations.ts](src/hooks/use-mutations.ts)
- [notifications.ts](src/lib/notifications.ts)

### 3. حساب الراتب الشهري
```
1. [salary-report.tsx] → اختيار الموظف والشهر
2. جلب بيانات:
   └─ attendance → حساب إجمالي ساعات العمل
   └─ deductions → جلب الخصومات
   └─ tasks → عدد المهام المكتملة
3. الحساب:
   grossSalary = totalHours * hourlyRate
   netSalary = grossSalary - totalDeductions
4. [generate-salary-insights.ts] → AI Analysis
   └─ تحليل الأداء
   └─ توصيات وملاحظات
5. عرض النتائج + تصدير PDF
```

**الملفات المستخدمة**:
- [salary-report.tsx](src/components/salary-report.tsx)
- [attendance.tsx](src/components/attendance.tsx)
- [deductions-management.tsx](src/components/deductions-management.tsx)
- [src/ai/flows/generate-salary-insights.ts](src/ai/flows/generate-salary-insights.ts)

### 4. استخلاص إجازة من المحادثة
```
1. [team-chat.tsx] → Admin يكتب رسالة تحتوي على إجازة
   مثال: "محمد في إجازة مرضية من 15-1 إلى 17-1"
2. NLP Pattern Matching:
   └─ تحديد النوع (sick/annual/etc.)
   └─ استخراج الاسم
   └─ استخراج التواريخ (start_date, end_date)
3. [use-mutations.ts] → INSERT في جدول leaves
   └─ status: 'approved' (لأنه من الأدمن)
   └─ source: 'chat'
4. Real-time → تحديث:
   - قائمة الإجازات
   - Global Calendar
5. إشعار للموظف
```

**الملفات المستخدمة**:
- [team-chat.tsx](src/components/team-chat.tsx)
- [leave-management.tsx](src/components/leave-management.tsx)

### 5. تحليل أداء الفريق بالـ AI
```
1. [ai-insights.tsx] → النقر على "تحليل الفريق"
2. جلب البيانات:
   └─ tasks (كل المهام)
   └─ profiles (كل الأعضاء)
   └─ attendance (الحضور)
3. [actions.ts] → generateTeamInsights()
   └─ [genkit.ts] → تشغيل AI flow
   └─ [generate-team-insights.ts] → Gemini 2.5 Flash
      - تحليل توزيع المهام
      - تحديد الاختناقات
      - توصيات لإعادة التوزيع
      - تقييم كل عضو
4. عرض النتائج (ملخص + تفاصيل)
5. (Optional) حفظ كـ PDF
```

**الملفات المستخدمة**:
- [ai-insights.tsx](src/components/ai-insights.tsx)
- [actions.ts](src/lib/actions.ts)
- [genkit.ts](src/ai/genkit.ts)
- [generate-team-insights.ts](src/ai/flows/generate-team-insights.ts)

### 6. رفع ملف وربطه بمهمة
```
1. [file-manager.tsx] → اختيار ملف + مهمة
2. Supabase Storage:
   └─ supabase.storage.from('files').upload()
   └─ الحصول على publicURL أو path
3. [use-mutations.ts] → INSERT في جدول files
   └─ file_path, task_id, uploaded_by
4. Real-time → تحديث قائمة الملفات
5. إشعار لأصحاب المهمة (optional)
```

**الملفات المستخدمة**:
- [file-manager.tsx](src/components/file-manager.tsx)
- [use-mutations.ts](src/hooks/use-mutations.ts)

---

## ⚠️ نقاط التحسين والتوصيات

### 🔴 أولوية عالية (High Priority)

#### 1. إصلاح TypeScript Errors
**الملف**: [tsconfig.json](tsconfig.json)
```json
// حالياً
"skipLibCheck": true  // ⚠️ يخفي الأخطاء

// التوصية
// إزالة هذا الخيار وإصلاح كل الأخطاء
```

**الإجراء**:
1. إزالة `skipLibCheck: true`
2. تشغيل `npm run build` ومعالجة الأخطاء
3. إضافة types مفقودة

#### 2. تقييد RLS Policies
**الجداول المتأثرة**: `api_endpoints`, `env_variables`

**المشكلة**: حالياً مفتوحة لكل authenticated user

**التوصية**:
```sql
-- api_endpoints
DROP POLICY IF EXISTS "api_endpoints_select" ON api_endpoints;
CREATE POLICY "api_endpoints_admin_only" ON api_endpoints FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- env_variables
DROP POLICY IF EXISTS "env_variables_select" ON env_variables;
CREATE POLICY "env_variables_admin_only" ON env_variables FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));
```

#### 3. إضافة File Upload Validation
**الملف**: [file-manager.tsx](src/components/file-manager.tsx)

**التوصية**:
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/*', 'application/pdf', 'application/msword', ...]

const validateFile = (file: File) => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('الملف كبير جداً (الحد الأقصى 10MB)')
  }
  
  if (!ALLOWED_TYPES.some(type => file.type.match(type))) {
    throw new Error('نوع الملف غير مسموح')
  }
}
```

#### 4. إضافة Unit Tests
**الإجراء**:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**ملفات للاختبار أولاً**:
- [src/lib/utils.ts](src/lib/utils.ts)
- [src/hooks/use-mutations.ts](src/hooks/use-mutations.ts)
- [src/lib/notifications.ts](src/lib/notifications.ts)

**مثال**:
```typescript
// src/lib/__tests__/utils.test.ts
import { cn, formatDate } from '../utils'

describe('utils', () => {
  it('should merge class names correctly', () => {
    expect(cn('text-red', 'bg-blue')).toBe('text-red bg-blue')
  })
})
```

### 🟡 أولوية متوسطة (Medium Priority)

#### 5. Automated Audit Logs
**الملف**: [supabase_schema.sql](supabase_schema.sql)

**التوصية**: إضافة Database Triggers
```sql
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    'tasks',
    COALESCE(NEW.id, OLD.id),
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION log_task_changes();
```

#### 6. تحسين Loading States
**الملفات المتأثرة**: معظم المكونات

**التوصية**:
```typescript
// إضافة Skeleton Loaders
import { Skeleton } from '@/components/ui/skeleton'

if (!data) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}
```

#### 7. Rate Limiting
**الملف**: Middleware جديد

**التوصية**:
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimit = new Map()

export function middleware(request: NextRequest) {
  const ip = request.ip ?? 'unknown'
  const now = Date.now()
  const windowMs = 60000 // 1 دقيقة
  const max = 100 // 100 طلب في الدقيقة
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
  } else {
    const data = rateLimit.get(ip)
    if (now > data.resetTime) {
      data.count = 1
      data.resetTime = now + windowMs
    } else {
      data.count++
      if (data.count > max) {
        return new NextResponse('Too Many Requests', { status: 429 })
      }
    }
  }
  
  return NextResponse.next()
}
```

#### 8. تقسيم المكونات الكبيرة
**الملفات**: [team-management.tsx](src/components/team-management.tsx), [hr-management-page.tsx](src/components/hr-management-page.tsx)

**التوصية**:
```typescript
// بدلاً من مكون واحد 500+ سطر:

// src/components/team-management/index.tsx
export { TeamManagement } from './TeamManagement'

// src/components/team-management/TeamManagement.tsx
import { TeamList } from './TeamList'
import { TeamFilters } from './TeamFilters'
import { AddMemberDialog } from './AddMemberDialog'
import { TeamStats } from './TeamStats'

export function TeamManagement() {
  return (
    <div>
      <TeamStats />
      <TeamFilters />
      <TeamList />
      <AddMemberDialog />
    </div>
  )
}
```

### 🟢 أولوية منخفضة (Low Priority)

#### 9. Mobile Responsiveness للجداول
**التوصية**:
```typescript
// إضافة horizontal scroll للجداول على الموبايل
<div className="overflow-x-auto">
  <Table>...</Table>
</div>

// أو استخدام Card view على الموبايل
<div className="hidden md:block">
  <Table>...</Table>
</div>
<div className="md:hidden">
  {data.map(item => <Card key={item.id}>...</Card>)}
</div>
```

#### 10. Accessibility Labels
**التوصية**:
```typescript
// إضافة ARIA labels
<Button aria-label="إضافة مهمة جديدة">
  <Plus className="w-4 h-4" />
</Button>

<Dialog aria-labelledby="dialog-title" aria-describedby="dialog-description">
  <DialogTitle id="dialog-title">عنوان</DialogTitle>
  <DialogDescription id="dialog-description">وصف</DialogDescription>
</Dialog>
```

#### 11. Shared Real-time Channels
**الملف**: [use-supabase-data.ts](src/hooks/use-supabase-data.ts)

**التوصية**:
```typescript
// بدلاً من channel لكل subscription:
// استخدام channel واحد shared

const channel = supabase.channel('main-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleTasksChange)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleProfilesChange)
  .subscribe()
```

#### 12. Dynamic Imports
**التوصية**:
```typescript
// للمكونات الثقيلة
import dynamic from 'next/dynamic'

const AIInsights = dynamic(() => import('@/components/ai-insights'), {
  loading: () => <Skeleton />,
  ssr: false
})

const Charts = dynamic(() => import('@/components/charts'), {
  loading: () => <div>Loading...</div>
})
```

### 🔒 Security Hardening

#### 13. Environment Variables
**الملف**: [.env.local](.env.local)

**التحقق**:
```bash
# التأكد من وجود .env.local في .gitignore
echo ".env.local" >> .gitignore
```

**Production**:
- نقل كل المتغيرات الحساسة إلى Vercel/Production Secrets
- عدم استخدام Service Role Key في Client-side code

#### 14. CORS Configuration
**الملف**: [next.config.ts](next.config.ts)

**التوصية**:
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ]
  },
}
```

---

## 🚀 الأوامر المهمة

### التطوير (Development)
```bash
# تشغيل Next.js + Genkit معاً
npm run dev

# تشغيل Genkit منفصل
npm run genkit:dev

# Build للإنتاج
npm run build

# تشغيل Production build
npm start
```

### Database
```bash
# تطبيق Schema على Supabase
# 1. افتح Supabase Dashboard
# 2. SQL Editor
# 3. انسخ محتوى supabase_schema.sql
# 4. Run

# أو استخدم Supabase CLI
supabase db push
```

### Git
```bash
# Commit & Push
git add .
git commit -m "feat: وصف التغيير"
git push origin main
```

### Testing (بعد الإضافة)
```bash
npm run test          # تشغيل الاختبارات
npm run test:watch    # Watch mode
npm run test:coverage # تقرير التغطية
```

---

## 📊 إحصائيات المشروع

### الأكواد
- **إجمالي المكونات**: 50+ component
- **الصفحات**: 2 صفحة رئيسية (Dashboard + Client Portal)
- **API Routes**: 1 (AI endpoint)
- **Custom Hooks**: 10+ hooks
- **Context Providers**: 3 providers
- **Database Tables**: 16 جدول

### الميزات
- **الميزات الرئيسية**: 18 ميزة
- **التكاملات**: 4 تكاملات (Supabase, AI, Email, Theming)
- **اللغات المدعومة**: 2 (العربية، الإنجليزية)
- **الأدوار**: 7 أدوار

### الأمان
- **RLS Policies**: 15+ policy
- **Authentication**: Supabase Auth
- **Authorization**: Role-based

---

## 🎯 الخلاصة

**NEXUS Management Dashboard** هو مشروع **متقدم** و**شامل** يجمع بين:
- ✅ بنية معمارية احترافية (Next.js 15 + Supabase)
- ✅ ميزات شاملة (18+ ميزة)
- ✅ أمان قوي (RLS + RBAC)
- ✅ تكامل AI متقدم (Gemini 2.5)
- ✅ تجربة مستخدم ممتازة (Dark mode, i18n, Real-time)

### التقييم الإجمالي
⭐⭐⭐⭐ (4.5/5)

### الحالة
✅ **جاهز للاستخدام** في Production مع تطبيق التوصيات الأمنية أعلاه

---

## 📝 ملاحظات مهمة

### عند إضافة ميزة جديدة
☑️ تحديث [PROJECT_MEMORY.md](PROJECT_MEMORY.md)  
☑️ تحديث RLS policies إن لزم  
☑️ إضافة translations في [ar.json](src/locales/ar.json) و [en.json](src/locales/en.json)  
☑️ إضافة types في [data.ts](src/lib/data.ts)  
☑️ اختبار Real-time subscriptions  

### عند تعديل Database Schema
☑️ تحديث [supabase_schema.sql](supabase_schema.sql)  
☑️ تحديث types في [data.ts](src/lib/data.ts)  
☑️ مراجعة RLS policies  
☑️ تحديث التوثيق  

### قبل الـ Deployment
☑️ `npm run build` بدون أخطاء  
☑️ فحص Environment Variables  
☑️ مراجعة Security policies  
☑️ اختبار على staging أولاً  
☑️ Backup للـ Database  

---

**آخر تحديث**: 8 يناير 2026  
**المطورون**: NEXUS Team  
**الترخيص**: Private

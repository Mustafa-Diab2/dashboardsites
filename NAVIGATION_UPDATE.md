# تحديثات Navigation - الصفحات الجديدة

تم إضافة 4 صفحات enterprise جديدة للنظام:

## الصفحات المضافة:
1. **AI Command Center** - مركز الأوامر الذكي
2. **Workflow Builder** - سير العمل الآلي
3. **Document Management** - إدارة المستندات
4. **Invoicing System** - نظام الفواتير

## التعديلات المطلوبة في `reports-dashboard.tsx`:

### 1. تحديث Icons (السطر 6):
```typescript
import { FileDown, Plus, LogOut, LayoutDashboard, ListTodo, BarChart, Users, GanttChartSquare, Clock, BookOpen, FilePlus, MessageSquare, UserCog, Briefcase, Banknote, CalendarDays, FolderOpen, Shield, Server, Brain, Workflow, FileText, Receipt, History } from 'lucide-react';
```

### 2. إضافة Component Imports (بعد السطر 56):
```typescript
import { AICommandCenter } from './ai-command-center';
import { WorkflowBuilder } from './workflow-builder';
import { DocumentManagement } from './document-management';
import { InvoicingSystem } from './invoicing-system';
```

### 3. تحديث View Type (السطر 68):
```typescript
type View = 'dashboard' | 'my-tasks' | 'reports' | 'clients' | 'attendance' | 'courses' | 'chat' | 'hr' | 'team' | 'salary' | 'calendar' | 'files' | 'ai-prompt' | 'security' | 'backend' | 'activity' | 'ai-command' | 'workflows' | 'documents' | 'invoicing';
```

### 4. إضافة Render Cases (في دالة renderContent قبل case 'dashboard'):
```typescript
      case 'ai-command':
        return <AICommandCenter />;
      case 'workflows':
        return <WorkflowBuilder />;
      case 'documents':
        return <DocumentManagement />;
      case 'invoicing':
        return <InvoicingSystem />;
```

### 5. إضافة Sidebar Menu Items (قبل آخر `</>` في `{isAdmin && (`):
```typescript
                  <SidebarSeparator className="my-2 opacity-20" />
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'ai-command'} onClick={() => setActiveView('ai-command')}>
                      <Brain />
                      <span>{language === 'ar' ? 'مركز الأوامر الذكي' : 'AI Command Center'}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'workflows'} onClick={() => setActiveView('workflows')}>
                      <Workflow />
                      <span>{language === 'ar' ? 'سير العمل الآلي' : 'Workflow Automation'}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'documents'} onClick={() => setActiveView('documents')}>
                      <FileText />
                      <span>{language === 'ar' ? 'إدارة المستندات' : 'Document Management'}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'invoicing'} onClick={() => setActiveView('invoicing')}>
                      <Receipt />
                      <span>{language === 'ar' ? 'نظام الفواتير' : 'Invoicing System'}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
```

## الخطوات:
1. افتح `src/components/reports-dashboard.tsx`
2. طبّق التعديلات أعلاه
3. احفظ الملف
4. اختبر الصفحات الجديدة

## الملفات الموجودة والجاهزة:
- ✅ `ai-command-center.tsx` (~450 سطر)
- ✅ `workflow-builder.tsx` (~550 سطر)
- ✅ `document-management.tsx` (~450 سطر)
- ✅ `invoicing-system.tsx` (~600 سطر)
- ✅ `complete-system-schema.sql` (قاعدة البيانات)

تاريخ التحديث: 8 يناير 2026

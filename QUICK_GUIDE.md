# 🚀 دليل الاستخدام السريع - NEXUS Enterprise Features

## المحتويات
1. [البدء السريع](#البدء-السريع)
2. [إدارة الأهداف (OKRs)](#إدارة-الأهداف-okrs)
3. [إدارة الميزانيات](#إدارة-الميزانيات)
4. [مؤشرات الأداء (KPIs)](#مؤشرات-الأداء-kpis)
5. [الأتمتة والتصعيد](#الأتمتة-والتصعيد)
6. [التعيين الذكي](#التعيين-الذكي)

---

## البدء السريع

### 1. تحديث قاعدة البيانات

```bash
# طريقة 1: Supabase Dashboard
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى supabase_enterprise_schema.sql
4. اضغط Run

# طريقة 2: Supabase CLI
supabase db push
```

### 2. إضافة الصفحات الجديدة

أنشئ الملفات التالية:

```typescript
// src/app/okrs/page.tsx
import { GoalsOKRsManagement } from '@/components/goals-okrs'

export default function OKRsPage() {
  return <GoalsOKRsManagement />
}

// src/app/budgets/page.tsx
import { BudgetManagement } from '@/components/budget-management'

export default function BudgetsPage() {
  return <BudgetManagement />
}

// src/app/kpis/page.tsx
import { KPIDashboard } from '@/components/kpi-dashboard'

export default function KPIsPage() {
  return <KPIDashboard />
}
```

### 3. إضافة روابط في Navigation

في `src/components/main-page.tsx` أو navbar component:

```typescript
const menuItems = [
  // ... existing items
  { name: 'OKRs', icon: Target, href: '/okrs' },
  { name: 'Budgets', icon: DollarSign, href: '/budgets' },
  { name: 'KPIs', icon: BarChart, href: '/kpis' },
]
```

---

## إدارة الأهداف (OKRs)

### إنشاء هدف جديد

1. اذهب إلى صفحة **OKRs**
2. اضغط **"إضافة هدف جديد"**
3. املأ البيانات:
   - **الهدف**: مثال: "زيادة رضا العملاء"
   - **الوصف**: تفاصيل إضافية
   - **المسؤول**: اختر عضو الفريق
   - **الربع**: Q1 2026

4. اضغط **"حفظ الهدف"**

### إضافة نتائج رئيسية (Key Results)

1. في بطاقة الهدف، اضغط **"إضافة نتيجة"**
2. املأ:
   - **الوصف**: "زيادة NPS إلى 50"
   - **القيمة الحالية**: 42
   - **الهدف**: 50
   - **الوحدة**: points
   - **الموعد النهائي**: تاريخ

3. اضغط **"حفظ"**

### تحديث التقدم

- في بطاقة Key Result
- حدّث الرقم في حقل **"تحديث"**
- سيُحدث Progress تلقائياً
- الألوان تتغير حسب الأداء:
  - 🟢 أخضر: ≥70% (On Track)
  - 🟡 أصفر: 40-69% (At Risk)
  - 🔴 أحمر: <40% (Off Track)

---

## إدارة الميزانيات

### إنشاء ميزانية مشروع

1. اذهب إلى **Budgets**
2. اضغط **"إضافة ميزانية"** (Admin فقط)
3. املأ:
   - **العميل/المشروع**: اختر من القائمة
   - **اسم المشروع**: اسم واضح
   - **الميزانية الكلية**: $50,000
   - **ميزانية العمل**: $35,000
   - **ميزانية المصروفات**: $15,000
   - **تاريخ البدء/الانتهاء**

4. اضغط **"حفظ"**

### إضافة مصروف

1. في بطاقة الميزانية، اضغط **"إضافة مصروف"**
2. املأ:
   - **الفئة**: Software/Hardware/Hosting...
   - **الوصف**: "AWS Hosting - شهر يناير"
   - **المبلغ**: $500
   - **التاريخ**: تاريخ المصروف

3. اضغط **"حفظ"**

### فهم Budget Health Status

- 🟢 **On Track**: < 75% من الميزانية
- 🟡 **At Risk**: 75-90%
- 🟠 **Critical**: 90-100%
- 🔴 **Over Budget**: > 100%

### التقارير المالية

في صفحة Budgets:
- **Summary Cards**: إجمالي الميزانيات، التكلفة الفعلية، الفرق
- **Budget vs Actual Chart**: مقارنة بصرية
- **Cost Distribution**: توزيع التكاليف بين المشاريع

---

## مؤشرات الأداء (KPIs)

### المؤشرات المحسوبة تلقائياً

1. **Sprint Velocity**
   - عدد المهام المكتملة/أسبوع
   - الهدف: 15 مهمة/أسبوع

2. **On-Time Delivery**
   - نسبة المهام المسلمة في الموعد
   - الهدف: 90%

3. **Team Utilization**
   - نسبة الأعضاء المشغولين
   - الهدف: 85%

4. **Client Satisfaction**
   - متوسط رضا العملاء (محسوب من المدفوعات)
   - الهدف: 4.5/5

5. **Avg Completion Time**
   - متوسط وقت إنجاز المهمة
   - الهدف: 7 أيام

6. **Revenue Achievement**
   - نسبة تحقيق الإيرادات
   - الهدف: 100%

### الفلترة حسب الفئة

- **All**: كل المؤشرات
- **Productivity**: الإنتاجية
- **Quality**: الجودة
- **Financial**: المالية
- **Customer**: العملاء
- **Team**: الفريق

### Performance Summary

في أسفل الصفحة:
- **أداء ممتاز**: KPIs > 100%
- **يحتاج تحسين**: KPIs 70-99%
- **يحتاج اهتمام عاجل**: KPIs < 70%

---

## الأتمتة والتصعيد

### تفعيل التصعيد التلقائي

سيعمل تلقائياً عند تشغيل:

```typescript
// يمكن إضافته في Supabase Edge Function أو Cron Job
import { checkEscalations } from '@/lib/escalation'

// تشغيل كل ساعة
await checkEscalations()
```

### قواعد التصعيد الافتراضية

1. **مهام متأخرة 48 ساعة**
   - يتم التصعيد للأدمن
   - إشعار فوري
   - إضافة tag "escalated"

2. **مهام عالية الأولوية متأخرة 24 ساعة**
   - تصعيد سريع
   - تغيير الأولوية

3. **مهام محجوبة أكثر من 72 ساعة**
   - تنبيه الأدمن
   - اقتراح حلول

4. **تقدم منخفض قرب الموعد**
   - إذا مضى 70% من الوقت والتقدم < 30%
   - تنبيه المعنيين

### تصعيد يدوي

```typescript
import { escalateTaskManually } from '@/lib/escalation'

await escalateTaskManually(
  taskId,
  'المهمة عالقة منذ أسبوع بسبب مشكلة تقنية',
  [adminId, managerId]
)
```

### Workflows التلقائية

يمكن إضافة قواعد مخصصة في قاعدة البيانات:

```sql
INSERT INTO workflow_rules (name, trigger, conditions, actions, enabled, priority) VALUES (
  'إشعار للعميل عند الإنجاز',
  'status_changed',
  '[{"field": "status", "operator": "equals", "value": "done"}]',
  '[
    {"type": "notify", "params": {"title": "مهمة مكتملة", "message": "تم إنجاز مهمتك"}},
    {"type": "change_status", "params": {"status": "done"}}
  ]',
  true,
  10
);
```

---

## التعيين الذكي

### تعيين تلقائي بناءً على الدور

```typescript
import { autoAssignTask } from '@/lib/auto-assignment'

// عند إنشاء مهمة backend
await autoAssignTask(taskId, { 
  role: 'backend',
  priority: 'high'
})

// سيختار تلقائياً أقل مطور backend تحميلاً
```

### موازنة الأحمال

```typescript
import { suggestTaskReallocation } from '@/lib/auto-assignment'

const { overloaded, underutilized, suggestions } = await suggestTaskReallocation()

console.log('محملون بزيادة:', overloaded)
console.log('أقل استخداماً:', underutilized)
console.log('اقتراحات:', suggestions)
// يمكن تطبيق الاقتراحات أو عرضها للأدمن
```

### حساب Workload

```typescript
import { calculateWorkload } from '@/lib/auto-assignment'

const workload = await calculateWorkload(userId)
console.log(`Workload: ${workload}`)

// الحساب: عدد المهام × الأولوية × (100 - التقدم%)
```

---

## نصائح مهمة

### 1. التحديثات الدورية

قم بتشغيل هذه الوظائف دورياً (كل ساعة):

```typescript
// Supabase Edge Function
import { checkOverdueTasks, checkUpcomingDeadlines } from '@/lib/workflows'
import { checkEscalations } from '@/lib/escalation'

export default async function handler() {
  await checkOverdueTasks()
  await checkUpcomingDeadlines()
  await checkEscalations()
}
```

### 2. الصلاحيات

- **Admin**: صلاحيات كاملة
- **Regular Users**: قراءة + تحديث مهامهم + OKRs الخاصة بهم

### 3. الأداء

- كل الحسابات تتم على الطرف الخادم (Server-side)
- Real-time updates عبر Supabase subscriptions
- Indexes موجودة للأداء السريع

### 4. الإشعارات

- تلقائية عبر `createNotification()`
- يمكن إضافة Email/SMS لاحقاً
- مركزية في `notifications` table

---

## الأسئلة الشائعة

### Q: كيف أضيف KPI جديد؟

```sql
INSERT INTO kpis (name, description, category, target_value, unit, period) VALUES (
  'Customer Churn Rate',
  'نسبة العملاء المغادرين',
  'customer',
  5, -- 5% target
  '%',
  'monthly'
);
```

### Q: كيف أتتبع التاريخ للـ KPIs؟

```typescript
import { supabase } from '@/lib/supabase'

await supabase.from('kpi_history').insert({
  kpi_id: kpiId,
  value: currentValue,
  period_start: '2026-01-01',
  period_end: '2026-01-31'
})
```

### Q: هل يمكن تخصيص قواعد التصعيد؟

نعم! عدّل `DEFAULT_ESCALATION_RULES` في `src/lib/escalation.ts`

### Q: كيف أضيف workflow مخصص؟

أضف قاعدة جديدة في جدول `workflow_rules` أو في `WORKFLOW_PRESETS`

---

## الدعم والمساعدة

للمزيد من المعلومات:
- 📚 [PROJECT_MEMORY.md](PROJECT_MEMORY.md) - الذاكرة الكاملة للمشروع
- 🚀 [ENTERPRISE_UPDATE.md](ENTERPRISE_UPDATE.md) - تفاصيل التحديثات
- 📖 [README.md](README.md) - دليل المشروع

---

**آخر تحديث**: 8 يناير 2026  
**الإصدار**: 2.0.0

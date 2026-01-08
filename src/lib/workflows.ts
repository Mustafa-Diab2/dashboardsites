// Workflow Engine - محرك العمليات التلقائية
import { supabase } from './supabase'
import { createNotification } from './notifications'

export type WorkflowAction = 
  | 'assign_task'
  | 'change_status'
  | 'notify'
  | 'escalate'
  | 'update_field'
  | 'run_automation'

export type WorkflowTrigger = 
  | 'task_created'
  | 'task_updated'
  | 'status_changed'
  | 'due_date_approaching'
  | 'task_overdue'
  | 'task_completed'
  | 'manual'

export interface WorkflowRule {
  id: string
  name: string
  description?: string
  trigger: WorkflowTrigger
  conditions: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
    value: any
  }[]
  actions: {
    type: WorkflowAction
    params: Record<string, any>
  }[]
  enabled: boolean
  priority: number
}

// تنفيذ Workflow
export async function executeWorkflow(
  trigger: WorkflowTrigger,
  data: any,
  userId?: string
): Promise<void> {
  try {
    // جلب القواعد المفعّلة
    const { data: rules } = await supabase
      .from('workflow_rules')
      .select('*')
      .eq('trigger', trigger)
      .eq('enabled', true)
      .order('priority', { ascending: false })

    if (!rules || rules.length === 0) return

    for (const rule of rules) {
      // فحص الشروط
      if (checkConditions(rule.conditions, data)) {
        // تنفيذ الإجراءات
        await executeActions(rule.actions, data, userId)
      }
    }
  } catch (error) {
    console.error('Workflow execution error:', error)
  }
}

// فحص الشروط
function checkConditions(
  conditions: WorkflowRule['conditions'],
  data: any
): boolean {
  if (!conditions || conditions.length === 0) return true

  return conditions.every(condition => {
    const fieldValue = getNestedValue(data, condition.field)
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'not_equals':
        return fieldValue !== condition.value
      case 'contains':
        return String(fieldValue).includes(condition.value)
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      default:
        return false
    }
  })
}

// تنفيذ الإجراءات
async function executeActions(
  actions: WorkflowRule['actions'],
  data: any,
  userId?: string
): Promise<void> {
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'assign_task':
          await assignTask(data.id, action.params.assignee)
          break
        
        case 'change_status':
          await changeTaskStatus(data.id, action.params.status)
          break
        
        case 'notify':
          await sendNotification(
            action.params.user_id || data.assigned_to,
            action.params.title,
            action.params.message,
            action.params.link
          )
          break
        
        case 'escalate':
          await escalateTask(data.id, action.params.to)
          break
        
        case 'update_field':
          await updateTaskField(
            data.id,
            action.params.field,
            action.params.value
          )
          break
        
        case 'run_automation':
          await runCustomAutomation(action.params.automation_id, data)
          break
      }
    } catch (error) {
      console.error(`Action ${action.type} failed:`, error)
    }
  }
}

// مساعدات
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

async function assignTask(taskId: string, userId: string): Promise<void> {
  const { data: task } = await supabase
    .from('tasks')
    .select('assigned_to')
    .eq('id', taskId)
    .single()

  const assignedTo = task?.assigned_to || []
  if (!assignedTo.includes(userId)) {
    await supabase
      .from('tasks')
      .update({ assigned_to: [...assignedTo, userId] })
      .eq('id', taskId)
  }
}

async function changeTaskStatus(taskId: string, status: string): Promise<void> {
  await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
}

async function sendNotification(
  userId: string | string[],
  title: string,
  message: string,
  link?: string
): Promise<void> {
  const users = Array.isArray(userId) ? userId : [userId]
  
  for (const user of users) {
    await createNotification({
      user_id: user,
      type: 'workflow',
      title,
      message,
      link
    })
  }
}

async function escalateTask(taskId: string, managerId: string): Promise<void> {
  await assignTask(taskId, managerId)
  
  await createNotification({
    user_id: managerId,
    type: 'escalation',
    title: 'تصعيد مهمة',
    message: 'تم تصعيد مهمة تحتاج اهتمامك',
    link: `/tasks/${taskId}`
  })
}

async function updateTaskField(
  taskId: string,
  field: string,
  value: any
): Promise<void> {
  await supabase
    .from('tasks')
    .update({ [field]: value })
    .eq('id', taskId)
}

async function runCustomAutomation(
  automationId: string,
  data: any
): Promise<void> {
  // يمكن توسيعه لاحقاً
  console.log('Running custom automation:', automationId, data)
}

// Workflow Presets - قوالب جاهزة
export const WORKFLOW_PRESETS: WorkflowRule[] = [
  {
    id: 'auto-escalate-overdue',
    name: 'تصعيد المهام المتأخرة',
    description: 'تصعيد تلقائي للمهام المتأخرة أكثر من 48 ساعة',
    trigger: 'task_overdue',
    conditions: [
      { field: 'hours_overdue', operator: 'greater_than', value: 48 }
    ],
    actions: [
      {
        type: 'notify',
        params: {
          title: 'تنبيه: مهمة متأخرة',
          message: 'مهمة متأخرة أكثر من 48 ساعة'
        }
      },
      {
        type: 'escalate',
        params: { to: 'admin' }
      }
    ],
    enabled: true,
    priority: 10
  },
  {
    id: 'auto-assign-backend',
    name: 'تعيين تلقائي للـ Backend',
    description: 'تعيين مهام Backend للمطور الأقل تحميلاً',
    trigger: 'task_created',
    conditions: [
      { field: 'type', operator: 'contains', value: 'backend' },
      { field: 'assigned_to', operator: 'equals', value: [] }
    ],
    actions: [
      {
        type: 'run_automation',
        params: { automation_id: 'smart-backend-assignment' }
      }
    ],
    enabled: false,
    priority: 5
  },
  {
    id: 'notify-on-completion',
    name: 'إشعار عند الإنجاز',
    description: 'إشعار العميل عند إنجاز المهمة',
    trigger: 'status_changed',
    conditions: [
      { field: 'status', operator: 'equals', value: 'done' }
    ],
    actions: [
      {
        type: 'notify',
        params: {
          title: 'مهمة مكتملة',
          message: 'تم إنجاز مهمتك بنجاح'
        }
      }
    ],
    enabled: true,
    priority: 7
  }
]

// Schedule Checker - فحص دوري للمهام المتأخرة
export async function checkOverdueTasks(): Promise<void> {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .lt('due_date', new Date().toISOString())
    .neq('status', 'done')

  if (!tasks) return

  for (const task of tasks) {
    const dueDate = new Date(task.due_date)
    const now = new Date()
    const hoursOverdue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60)

    await executeWorkflow('task_overdue', {
      ...task,
      hours_overdue: hoursOverdue
    })
  }
}

// Check upcoming deadlines (48 hours before)
export async function checkUpcomingDeadlines(): Promise<void> {
  const twoDaysFromNow = new Date()
  twoDaysFromNow.setHours(twoDaysFromNow.getHours() + 48)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, profiles!tasks_created_by_fkey(*)')
    .lt('due_date', twoDaysFromNow.toISOString())
    .gt('due_date', new Date().toISOString())
    .neq('status', 'done')

  if (!tasks) return

  for (const task of tasks) {
    const assignees = task.assigned_to || []
    
    for (const userId of assignees) {
      await createNotification({
        user_id: userId,
        type: 'deadline_approaching',
        title: 'موعد تسليم قريب',
        message: `مهمة "${task.title}" موعد تسليمها خلال 48 ساعة`,
        link: `/tasks/${task.id}`
      })
    }
  }
}

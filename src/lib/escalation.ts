// Task Escalation System - نظام التصعيد
import { supabase } from './supabase'
import { createNotification } from './notifications'

export interface EscalationRule {
  id: string
  name: string
  condition: 'overdue' | 'high_priority_delayed' | 'blocked_too_long' | 'low_progress'
  threshold: number // hours or percentage
  escalateTo: 'admin' | 'manager' | 'client'
  actions: ('notify' | 'reassign' | 'change_priority' | 'flag')[]
  enabled: boolean
}

// Default escalation rules
export const DEFAULT_ESCALATION_RULES: EscalationRule[] = [
  {
    id: 'overdue-48h',
    name: 'مهام متأخرة 48 ساعة',
    condition: 'overdue',
    threshold: 48,
    escalateTo: 'admin',
    actions: ['notify', 'flag'],
    enabled: true
  },
  {
    id: 'high-priority-delayed',
    name: 'مهمة عالية الأولوية متأخرة 24 ساعة',
    condition: 'high_priority_delayed',
    threshold: 24,
    escalateTo: 'admin',
    actions: ['notify', 'change_priority'],
    enabled: true
  },
  {
    id: 'blocked-too-long',
    name: 'مهمة محجوبة أكثر من 72 ساعة',
    condition: 'blocked_too_long',
    threshold: 72,
    escalateTo: 'admin',
    actions: ['notify', 'flag'],
    enabled: true
  },
  {
    id: 'low-progress',
    name: 'تقدم منخفض قرب الموعد',
    condition: 'low_progress',
    threshold: 30, // 30% progress when 70% of time passed
    escalateTo: 'admin',
    actions: ['notify'],
    enabled: true
  }
]

// Check and execute escalations
export async function checkEscalations(): Promise<void> {
  const now = new Date()

  // جلب المهام غير المكتملة
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .neq('status', 'done')

  if (!tasks) return

  for (const task of tasks) {
    for (const rule of DEFAULT_ESCALATION_RULES) {
      if (!rule.enabled) continue

      let shouldEscalate = false

      switch (rule.condition) {
        case 'overdue':
          if (task.due_date) {
            const dueDate = new Date(task.due_date)
            const hoursOverdue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60)
            shouldEscalate = hoursOverdue > rule.threshold
          }
          break

        case 'high_priority_delayed':
          if (task.priority === 'high' && task.due_date) {
            const dueDate = new Date(task.due_date)
            const hoursOverdue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60)
            shouldEscalate = hoursOverdue > rule.threshold
          }
          break

        case 'blocked_too_long':
          if (task.blocked_by && task.blocked_by.length > 0) {
            // افترض أن لدينا حقل blocked_since
            // shouldEscalate = check blocked duration
            shouldEscalate = true // مؤقت
          }
          break

        case 'low_progress':
          if (task.start_date && task.due_date) {
            const start = new Date(task.start_date).getTime()
            const end = new Date(task.due_date).getTime()
            const totalDuration = end - start
            const elapsed = now.getTime() - start
            const percentElapsed = (elapsed / totalDuration) * 100
            const progress = task.progress || 0

            // إذا مضى 70% من الوقت والتقدم أقل من 30%
            shouldEscalate = percentElapsed > 70 && progress < rule.threshold
          }
          break
      }

      if (shouldEscalate) {
        await executeEscalation(task, rule)
      }
    }
  }
}

// Execute escalation actions
async function executeEscalation(task: any, rule: EscalationRule): Promise<void> {
  // Check if already escalated recently (avoid spam)
  const { data: recentEscalation } = await supabase
    .from('escalations')
    .select('*')
    .eq('task_id', task.id)
    .eq('rule_id', rule.id)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .single()

  if (recentEscalation) return // Already escalated in last 24h

  // Record escalation
  await supabase.from('escalations').insert({
    task_id: task.id,
    rule_id: rule.id,
    escalated_to: rule.escalateTo,
    reason: rule.name,
    created_at: new Date().toISOString()
  })

  // Execute actions
  for (const action of rule.actions) {
    switch (action) {
      case 'notify':
        await notifyEscalation(task, rule)
        break

      case 'reassign':
        // يمكن إضافة منطق إعادة التعيين
        break

      case 'change_priority':
        await supabase
          .from('tasks')
          .update({ priority: 'high' })
          .eq('id', task.id)
        break

      case 'flag':
        await supabase
          .from('tasks')
          .update({ 
            tags: [...(task.tags || []), 'escalated'] 
          })
          .eq('id', task.id)
        break
    }
  }
}

// Notify about escalation
async function notifyEscalation(task: any, rule: EscalationRule): Promise<void> {
  // Get admin users
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  if (!admins) return

  const message = `مهمة "${task.title}" تحتاج اهتمام: ${rule.name}`

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: 'escalation',
      title: 'تصعيد مهمة ⚠️',
      message,
      link: `/tasks/${task.id}`
    })
  }

  // Notify assignees too
  if (task.assigned_to && task.assigned_to.length > 0) {
    for (const userId of task.assigned_to) {
      await createNotification({
        userId: userId,
        type: 'warning',
        title: 'تنبيه: مهمة تحتاج اهتمام',
        message: `مهمتك "${task.title}" تم تصعيدها: ${rule.name}`,
        link: `/tasks/${task.id}`
      })
    }
  }
}

// Manual escalation
export async function escalateTaskManually(
  taskId: string,
  reason: string,
  escalateTo: string[]
): Promise<void> {
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task) return

  // Record manual escalation
  await supabase.from('escalations').insert({
    task_id: taskId,
    rule_id: 'manual',
    escalated_to: 'manual',
    reason,
    created_at: new Date().toISOString()
  })

  // Notify recipients
  for (const userId of escalateTo) {
    await createNotification({
      userId: userId,
      type: 'escalation',
      title: 'تصعيد مهمة يدوي',
      message: `مهمة "${task.title}": ${reason}`,
      link: `/tasks/${taskId}`
    })
  }
}

// Get escalation history for a task
export async function getTaskEscalations(taskId: string) {
  const { data } = await supabase
    .from('escalations')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  return data || []
}

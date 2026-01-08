// Auto Task Assignment - تعيين المهام الذكي
import { supabase } from './supabase'
import { createNotification } from './notifications'

export interface TeamMember {
  id: string
  full_name: string
  role: string
  hourly_rate: number
  current_workload: number
  skills?: string[]
  availability?: number // 0-100%
}

export interface TaskRequirements {
  skills?: string[]
  role?: string
  priority?: string
  estimatedHours?: number
}

// حساب workload لكل عضو
export async function calculateWorkload(userId: string): Promise<number> {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .contains('assigned_to', [userId])
    .neq('status', 'done')

  if (!tasks) return 0

  // حساب بسيط: عدد المهام * الأولوية
  return tasks.reduce((total, task) => {
    const priorityWeight = task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1
    const progressWeight = (100 - (task.progress || 0)) / 100
    return total + (priorityWeight * progressWeight)
  }, 0)
}

// الحصول على أفضل عضو لمهمة معينة
export async function findBestAssignee(
  requirements: TaskRequirements
): Promise<TeamMember | null> {
  // جلب كل الأعضاء
  let query = supabase
    .from('profiles')
    .select('*')

  // فلترة حسب الدور إذا كان محدداً
  if (requirements.role) {
    query = query.eq('role', requirements.role)
  }

  const { data: members } = await query

  if (!members || members.length === 0) return null

  // حساب workload لكل عضو
  const membersWithWorkload = await Promise.all(
    members.map(async (member) => ({
      ...member,
      current_workload: await calculateWorkload(member.id)
    }))
  )

  // ترتيب حسب الأقل تحميلاً
  membersWithWorkload.sort((a, b) => a.current_workload - b.current_workload)

  // اختيار الأفضل (الأقل تحميلاً)
  return membersWithWorkload[0]
}

// تعيين تلقائي ذكي
export async function autoAssignTask(
  taskId: string,
  requirements: TaskRequirements = {}
): Promise<boolean> {
  try {
    const bestMember = await findBestAssignee(requirements)

    if (!bestMember) {
      console.error('No suitable team member found')
      return false
    }

    // تعيين المهمة
    const { error } = await supabase
      .from('tasks')
      .update({
        assigned_to: [bestMember.id]
      })
      .eq('id', taskId)

    if (error) throw error

    // إرسال إشعار
    const { data: task } = await supabase
      .from('tasks')
      .select('title')
      .eq('id', taskId)
      .single()

    await createNotification({
      user_id: bestMember.id,
      type: 'task_assigned',
      title: 'مهمة جديدة (تعيين تلقائي)',
      message: `تم تعيينك تلقائياً لمهمة: ${task?.title}`,
      link: `/tasks/${taskId}`
    })

    return true
  } catch (error) {
    console.error('Auto-assignment failed:', error)
    return false
  }
}

// اقتراح إعادة توزيع المهام
export async function suggestTaskReallocation(): Promise<{
  overloaded: TeamMember[]
  underutilized: TeamMember[]
  suggestions: {
    taskId: string
    from: string
    to: string
    reason: string
  }[]
}> {
  const { data: members } = await supabase
    .from('profiles')
    .select('*')

  if (!members) {
    return { overloaded: [], underutilized: [], suggestions: [] }
  }

  // حساب workload لكل عضو
  const membersWithWorkload = await Promise.all(
    members.map(async (member) => ({
      ...member,
      current_workload: await calculateWorkload(member.id)
    }))
  )

  // تحديد المحملين بزيادة والأقل استخداماً
  const avgWorkload = membersWithWorkload.reduce((sum, m) => sum + m.current_workload, 0) / membersWithWorkload.length
  
  const overloaded = membersWithWorkload.filter(m => m.current_workload > avgWorkload * 1.5)
  const underutilized = membersWithWorkload.filter(m => m.current_workload < avgWorkload * 0.5)

  const suggestions: {
    taskId: string
    from: string
    to: string
    reason: string
  }[] = []

  // اقتراح نقل مهام من المحملين للأقل استخداماً
  for (const overloadedMember of overloaded) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .contains('assigned_to', [overloadedMember.id])
      .eq('status', 'backlog')
      .limit(3)

    if (tasks && underutilized.length > 0) {
      for (const task of tasks) {
        const target = underutilized[0] // أبسط: اختيار الأول
        suggestions.push({
          taskId: task.id,
          from: overloadedMember.id,
          to: target.id,
          reason: `${overloadedMember.full_name} محمّل (${overloadedMember.current_workload.toFixed(1)}), ${target.full_name} متاح (${target.current_workload.toFixed(1)})`
        })
      }
    }
  }

  return { overloaded, underutilized, suggestions }
}

// Balance team workload
export async function balanceTeamWorkload(): Promise<void> {
  const { suggestions } = await suggestTaskReallocation()

  for (const suggestion of suggestions) {
    // تنفيذ الاقتراح تلقائياً (يمكن جعله يدوي)
    const { data: task } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('id', suggestion.taskId)
      .single()

    if (task) {
      const newAssignedTo = task.assigned_to.filter((id: string) => id !== suggestion.from)
      newAssignedTo.push(suggestion.to)

      await supabase
        .from('tasks')
        .update({ assigned_to: newAssignedTo })
        .eq('id', suggestion.taskId)

      // إشعار
      await createNotification({
        user_id: suggestion.to,
        type: 'task_reassigned',
        title: 'إعادة تعيين مهمة',
        message: `تم تعيينك لمهمة لموازنة الأحمال`,
        link: `/tasks/${suggestion.taskId}`
      })
    }
  }
}

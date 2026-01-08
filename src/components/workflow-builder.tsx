'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/language-context'
import { useSupabase } from '@/context/supabase-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Workflow, Plus, Play, Pause, Settings, Trash2, Copy,
  GitBranch, Mail, Bell, Database, Calendar, Check 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCollection } from '@/hooks/use-supabase-data'
import { useAddMutation, useUpdateMutation, useDeleteMutation } from '@/hooks/use-mutations'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action'
  config: any
  position: { x: number; y: number }
}

interface WorkflowAutomation {
  id: string
  name: string
  description: string
  trigger_type: 'task_created' | 'task_completed' | 'budget_exceeded' | 'date_reached' | 'manual'
  trigger_config: any
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  is_active: boolean
  created_by: string
  execution_count: number
  last_executed: string
}

interface WorkflowCondition {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
  value: any
}

interface WorkflowAction {
  id: string
  type: 'assign_task' | 'send_email' | 'send_notification' | 'update_field' | 'create_task' | 'call_webhook'
  config: any
}

export function WorkflowBuilder() {
  const { language } = useLanguage()
  const { user } = useSupabase()
  const { toast } = useToast()
  const [showDialog, setShowDialog] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowAutomation | null>(null)

  const { data: workflows } = useCollection<WorkflowAutomation>('workflow_automations', (q) => 
    q.order('created_at', { ascending: false })
  )
  
  const { mutate: addWorkflow } = useAddMutation('workflow_automations')
  const { mutate: updateWorkflow } = useUpdateMutation('workflow_automations')
  const { mutate: deleteWorkflow } = useDeleteMutation('workflow_automations')

  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger_type: 'task_created' as const,
    trigger_config: {},
    conditions: [] as WorkflowCondition[],
    actions: [] as WorkflowAction[],
    is_active: true
  })

  const triggerTypes = [
    { value: 'task_created', label: language === 'ar' ? 'عند إنشاء مهمة' : 'When task is created' },
    { value: 'task_completed', label: language === 'ar' ? 'عند إكمال مهمة' : 'When task is completed' },
    { value: 'budget_exceeded', label: language === 'ar' ? 'عند تجاوز الميزانية' : 'When budget is exceeded' },
    { value: 'date_reached', label: language === 'ar' ? 'عند وصول تاريخ' : 'When date is reached' },
    { value: 'manual', label: language === 'ar' ? 'يدوي' : 'Manual' },
  ]

  const actionTypes = [
    { value: 'assign_task', label: language === 'ar' ? 'تعيين مهمة' : 'Assign task', icon: Check },
    { value: 'send_email', label: language === 'ar' ? 'إرسال بريد' : 'Send email', icon: Mail },
    { value: 'send_notification', label: language === 'ar' ? 'إرسال إشعار' : 'Send notification', icon: Bell },
    { value: 'update_field', label: language === 'ar' ? 'تحديث حقل' : 'Update field', icon: Database },
    { value: 'create_task', label: language === 'ar' ? 'إنشاء مهمة' : 'Create task', icon: Plus },
    { value: 'call_webhook', label: language === 'ar' ? 'استدعاء Webhook' : 'Call webhook', icon: GitBranch },
  ]

  const addCondition = () => {
    setForm({
      ...form,
      conditions: [
        ...form.conditions,
        {
          id: Date.now().toString(),
          field: '',
          operator: 'equals',
          value: ''
        }
      ]
    })
  }

  const removeCondition = (id: string) => {
    setForm({
      ...form,
      conditions: form.conditions.filter(c => c.id !== id)
    })
  }

  const addAction = () => {
    setForm({
      ...form,
      actions: [
        ...form.actions,
        {
          id: Date.now().toString(),
          type: 'send_notification',
          config: {}
        }
      ]
    })
  }

  const removeAction = (id: string) => {
    setForm({
      ...form,
      actions: form.actions.filter(a => a.id !== id)
    })
  }

  const handleSave = async () => {
    await addWorkflow({
      ...form,
      created_by: user?.id,
      execution_count: 0,
      last_executed: null
    })
    
    setShowDialog(false)
    setForm({
      name: '',
      description: '',
      trigger_type: 'task_created',
      trigger_config: {},
      conditions: [],
      actions: [],
      is_active: true
    })
    
    toast({
      title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      description: language === 'ar' ? 'تم إنشاء Workflow بنجاح' : 'Workflow created successfully'
    })
  }

  const toggleWorkflow = async (workflow: WorkflowAutomation) => {
    await updateWorkflow({
      id: workflow.id,
      is_active: !workflow.is_active
    })
    
    toast({
      title: language === 'ar' ? (workflow.is_active ? 'تم الإيقاف' : 'تم التفعيل') : (workflow.is_active ? 'Paused' : 'Activated'),
    })
  }

  const duplicateWorkflow = async (workflow: WorkflowAutomation) => {
    await addWorkflow({
      ...workflow,
      name: `${workflow.name} (Copy)`,
      execution_count: 0,
      last_executed: null,
      created_by: user?.id
    })
    
    toast({
      title: language === 'ar' ? 'تم النسخ' : 'Duplicated',
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Workflow className="w-8 h-8" />
            {language === 'ar' ? 'أتمتة سير العمل' : 'Workflow Automation'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'قم بإنشاء workflows تلقائية للمهام المتكررة' : 'Create automated workflows for repetitive tasks'}
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'Workflow جديد' : 'New Workflow'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إنشاء Workflow' : 'Create Workflow'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={language === 'ar' ? 'اسم Workflow' : 'Workflow name'}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={language === 'ar' ? 'وصف Workflow' : 'Workflow description'}
                    rows={2}
                  />
                </div>
              </div>

              {/* Trigger */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  {language === 'ar' ? '1. المُشغِّل (Trigger)' : '1. Trigger'}
                </h3>
                <div>
                  <Label>{language === 'ar' ? 'متى يتم التشغيل؟' : 'When to trigger?'}</Label>
                  <Select
                    value={form.trigger_type}
                    onValueChange={(value: any) => setForm({ ...form, trigger_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditions */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    {language === 'ar' ? '2. الشروط (اختياري)' : '2. Conditions (Optional)'}
                  </h3>
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="w-3 h-3 mr-1" />
                    {language === 'ar' ? 'شرط' : 'Condition'}
                  </Button>
                </div>
                
                {form.conditions.map((condition, idx) => (
                  <div key={condition.id} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        placeholder={language === 'ar' ? 'الحقل' : 'Field'}
                        value={condition.field}
                        onChange={(e) => {
                          const newConditions = [...form.conditions]
                          newConditions[idx].field = e.target.value
                          setForm({ ...form, conditions: newConditions })
                        }}
                      />
                      <Select
                        value={condition.operator}
                        onValueChange={(value: any) => {
                          const newConditions = [...form.conditions]
                          newConditions[idx].operator = value
                          setForm({ ...form, conditions: newConditions })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">=</SelectItem>
                          <SelectItem value="not_equals">≠</SelectItem>
                          <SelectItem value="greater_than">&gt;</SelectItem>
                          <SelectItem value="less_than">&lt;</SelectItem>
                          <SelectItem value="contains">{language === 'ar' ? 'يحتوي' : 'Contains'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder={language === 'ar' ? 'القيمة' : 'Value'}
                        value={condition.value}
                        onChange={(e) => {
                          const newConditions = [...form.conditions]
                          newConditions[idx].value = e.target.value
                          setForm({ ...form, conditions: newConditions })
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {language === 'ar' ? '3. الإجراءات' : '3. Actions'}
                  </h3>
                  <Button variant="outline" size="sm" onClick={addAction}>
                    <Plus className="w-3 h-3 mr-1" />
                    {language === 'ar' ? 'إجراء' : 'Action'}
                  </Button>
                </div>

                {form.actions.map((action, idx) => (
                  <div key={action.id} className="flex gap-2 items-start border rounded p-3">
                    <div className="flex-1 space-y-3">
                      <Select
                        value={action.type}
                        onValueChange={(value: any) => {
                          const newActions = [...form.actions]
                          newActions[idx].type = value
                          setForm({ ...form, actions: newActions })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Action-specific config */}
                      {action.type === 'send_email' && (
                        <Input placeholder={language === 'ar' ? 'عنوان البريد' : 'Email subject'} />
                      )}
                      {action.type === 'send_notification' && (
                        <Textarea placeholder={language === 'ar' ? 'نص الإشعار' : 'Notification message'} rows={2} />
                      )}
                      {action.type === 'assign_task' && (
                        <Input placeholder={language === 'ar' ? 'معرف المستخدم' : 'User ID'} />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(action.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleSave} className="w-full" disabled={!form.name || form.actions.length === 0}>
                {language === 'ar' ? 'حفظ Workflow' : 'Save Workflow'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflows List */}
      <div className="grid gap-4">
        {workflows?.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                      {workflow.is_active ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'متوقف' : 'Paused')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{workflow.description}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {triggerTypes.find(t => t.value === workflow.trigger_type)?.label}
                    </div>
                    <div className="flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      {workflow.actions.length} {language === 'ar' ? 'إجراء' : 'actions'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {language === 'ar' ? 'نُفذ' : 'Executed'} {workflow.execution_count} {language === 'ar' ? 'مرة' : 'times'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleWorkflow(workflow)}
                  >
                    {workflow.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateWorkflow(workflow)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWorkflow(workflow.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}

        {(!workflows || workflows.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Workflow className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>{language === 'ar' ? 'لا توجد Workflows بعد' : 'No workflows yet'}</p>
              <p className="text-sm">{language === 'ar' ? 'قم بإنشاء أول Workflow للبدء' : 'Create your first workflow to get started'}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

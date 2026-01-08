'use client'

import { useState } from 'react'
import { useSupabase } from '@/context/supabase-context'
import { useCollection } from '@/hooks/use-supabase-data'
import { useAddMutation, useUpdateMutation } from '@/hooks/use-mutations'
import { useLanguage } from '@/context/language-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, Plus, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle2, Receipt, BarChart3, PieChart 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ProjectBudget {
  id: string
  client_id: string
  project_name: string
  total_budget: number
  labor_budget: number
  expenses_budget: number
  actual_labor_cost: number
  actual_expenses: number
  start_date: string
  end_date: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  health_status: 'on_track' | 'at_risk' | 'over_budget' | 'critical'
  notes: string
}

interface BudgetExpense {
  id: string
  budget_id: string
  category: string
  description: string
  amount: number
  expense_date: string
  created_by: string
}

export function BudgetManagement() {
  const { user, role } = useSupabase()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [showBudgetDialog, setShowBudgetDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null)

  const budgets = useCollection<ProjectBudget>('project_budgets', {
    orderBy: { column: 'created_at', ascending: false }
  })

  const expenses = useCollection<BudgetExpense>('budget_expenses')
  const clients = useCollection<any>('clients')
  const tasks = useCollection<any>('tasks')
  const attendance = useCollection<any>('attendance')
  const profiles = useCollection<any>('profiles')

  const { mutate: addBudget } = useAddMutation('project_budgets')
  const { mutate: updateBudget } = useUpdateMutation('project_budgets')
  const { mutate: addExpense } = useAddMutation('budget_expenses')

  const [budgetForm, setBudgetForm] = useState({
    client_id: '',
    project_name: '',
    total_budget: 0,
    labor_budget: 0,
    expenses_budget: 0,
    start_date: '',
    end_date: '',
    status: 'planning' as const,
    notes: ''
  })

  const [expenseForm, setExpenseForm] = useState({
    budget_id: '',
    category: 'software',
    description: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0]
  })

  const calculateLaborCost = (budgetId: string) => {
    // حساب تكلفة العمل من ساعات الحضور والمهام
    const budgetTasks = tasks?.filter((t: any) => {
      const budget = budgets?.find(b => b.id === budgetId)
      return t.client_id === budget?.client_id
    }) || []

    let totalCost = 0
    budgetTasks.forEach((task: any) => {
      const assignees = task.assigned_to || []
      assignees.forEach((userId: string) => {
        const userProfile = profiles?.find(p => p.id === userId)
        const userAttendance = attendance?.filter((a: any) => 
          a.user_id === userId && 
          new Date(a.clock_in) >= new Date(budgetForm.start_date)
        ) || []
        
        const totalHours = userAttendance.reduce((sum: number, att: any) => {
          if (att.clock_out) {
            const hours = (new Date(att.clock_out).getTime() - new Date(att.clock_in).getTime()) / (1000 * 60 * 60)
            return sum + hours
          }
          return sum
        }, 0)

        totalCost += totalHours * (userProfile?.hourly_rate || 0)
      })
    })

    return totalCost
  }

  const getBudgetExpenses = (budgetId: string) => {
    return expenses?.filter(e => e.budget_id === budgetId) || []
  }

  const calculateBudgetHealth = (budget: ProjectBudget): ProjectBudget['health_status'] => {
    const actualLabor = budget.actual_labor_cost || calculateLaborCost(budget.id)
    const actualExpenses = budget.actual_expenses || getBudgetExpenses(budget.id).reduce((sum, e) => sum + e.amount, 0)
    const totalActual = actualLabor + actualExpenses
    const percentage = (totalActual / budget.total_budget) * 100

    if (percentage >= 100) return 'over_budget'
    if (percentage >= 90) return 'critical'
    if (percentage >= 75) return 'at_risk'
    return 'on_track'
  }

  const handleAddBudget = async () => {
    const health_status = 'on_track'
    await addBudget({
      ...budgetForm,
      health_status,
      created_by: user?.id
    })
    setShowBudgetDialog(false)
    setBudgetForm({
      client_id: '',
      project_name: '',
      total_budget: 0,
      labor_budget: 0,
      expenses_budget: 0,
      start_date: '',
      end_date: '',
      status: 'planning',
      notes: ''
    })
    toast({ title: language === 'ar' ? 'تم إضافة الميزانية بنجاح' : 'Budget added successfully' })
  }

  const handleAddExpense = async () => {
    await addExpense({
      ...expenseForm,
      created_by: user?.id
    })
    
    // Update budget actual expenses
    const budget = budgets?.find(b => b.id === expenseForm.budget_id)
    if (budget) {
      const newActualExpenses = (budget.actual_expenses || 0) + expenseForm.amount
      await updateBudget({
        id: expenseForm.budget_id,
        actual_expenses: newActualExpenses,
        health_status: calculateBudgetHealth({ ...budget, actual_expenses: newActualExpenses })
      })
    }

    setShowExpenseDialog(false)
    setExpenseForm({
      budget_id: '',
      category: 'software',
      description: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0]
    })
    toast({ title: language === 'ar' ? 'تم إضافة المصروف' : 'Expense added' })
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'on_track': return 'text-green-600'
      case 'at_risk': return 'text-yellow-600'
      case 'critical': return 'text-orange-600'
      case 'over_budget': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthBadge = (health: string) => {
    const variants: Record<string, any> = {
      on_track: 'default',
      at_risk: 'secondary',
      critical: 'destructive',
      over_budget: 'destructive'
    }
    return variants[health] || 'outline'
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'on_track': return <CheckCircle2 className="w-4 h-4" />
      case 'at_risk':
      case 'critical':
      case 'over_budget': return <AlertTriangle className="w-4 h-4" />
      default: return null
    }
  }

  // Summary Stats
  const totalBudgets = budgets?.reduce((sum, b) => sum + b.total_budget, 0) || 0
  const totalActualCost = budgets?.reduce((sum, b) => {
    const laborCost = b.actual_labor_cost || calculateLaborCost(b.id)
    const expenseCost = b.actual_expenses || 0
    return sum + laborCost + expenseCost
  }, 0) || 0
  const variance = totalBudgets - totalActualCost
  const utilizationRate = totalBudgets > 0 ? (totalActualCost / totalBudgets) * 100 : 0

  const budgetData = budgets?.map(budget => {
    const laborCost = budget.actual_labor_cost || calculateLaborCost(budget.id)
    const expenseCost = budget.actual_expenses || 0
    return {
      name: budget.project_name,
      budget: budget.total_budget,
      actual: laborCost + expenseCost,
      labor: laborCost,
      expenses: expenseCost
    }
  }) || []

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'إدارة الميزانيات والتكاليف' : 'Budget & Cost Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تتبع ميزانيات المشاريع والتكاليف الفعلية' : 'Track project budgets and actual costs'}
          </p>
        </div>
        {role === 'admin' && (
          <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'إضافة ميزانية' : 'Add Budget'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'ميزانية جديدة' : 'New Budget'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{language === 'ar' ? 'العميل/المشروع' : 'Client/Project'}</Label>
                  <Select value={budgetForm.client_id} onValueChange={(value) => setBudgetForm({ ...budgetForm, client_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر العميل' : 'Select client'} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'اسم المشروع' : 'Project Name'}</Label>
                  <Input
                    value={budgetForm.project_name}
                    onChange={(e) => setBudgetForm({ ...budgetForm, project_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{language === 'ar' ? 'الميزانية الكلية' : 'Total Budget'}</Label>
                    <Input
                      type="number"
                      value={budgetForm.total_budget}
                      onChange={(e) => setBudgetForm({ ...budgetForm, total_budget: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'ميزانية العمل' : 'Labor Budget'}</Label>
                    <Input
                      type="number"
                      value={budgetForm.labor_budget}
                      onChange={(e) => setBudgetForm({ ...budgetForm, labor_budget: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'ميزانية المصروفات' : 'Expenses Budget'}</Label>
                    <Input
                      type="number"
                      value={budgetForm.expenses_budget}
                      onChange={(e) => setBudgetForm({ ...budgetForm, expenses_budget: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</Label>
                    <Input
                      type="date"
                      value={budgetForm.start_date}
                      onChange={(e) => setBudgetForm({ ...budgetForm, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</Label>
                    <Input
                      type="date"
                      value={budgetForm.end_date}
                      onChange={(e) => setBudgetForm({ ...budgetForm, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                  <Textarea
                    value={budgetForm.notes}
                    onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button onClick={handleAddBudget} className="w-full">
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي الميزانيات' : 'Total Budgets'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudgets.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'التكلفة الفعلية' : 'Actual Cost'}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalActualCost.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'الفرق' : 'Variance'}
            </CardTitle>
            {variance >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(variance).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'معدل الاستخدام' : 'Utilization'}
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilizationRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'الميزانية مقابل التكلفة الفعلية' : 'Budget vs Actual'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="budget" fill="#8884d8" name={language === 'ar' ? 'الميزانية' : 'Budget'} />
                <Bar dataKey="actual" fill="#82ca9d" name={language === 'ar' ? 'التكلفة الفعلية' : 'Actual'} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'توزيع التكاليف' : 'Cost Distribution'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="actual"
                  label={(entry) => entry.name}
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budgets List */}
      <div className="grid gap-4">
        {budgets?.map(budget => {
          const laborCost = budget.actual_labor_cost || calculateLaborCost(budget.id)
          const expenseCost = budget.actual_expenses || 0
          const totalActual = laborCost + expenseCost
          const budgetPercentage = (totalActual / budget.total_budget) * 100
          const client = clients?.find(c => c.id === budget.client_id)
          const budgetExpenses = getBudgetExpenses(budget.id)

          return (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{budget.project_name}</CardTitle>
                    <CardDescription>{client?.name}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getHealthBadge(budget.health_status)}>
                        {getHealthIcon(budget.health_status)}
                        <span className="ml-1">{budget.health_status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge variant="outline">{budget.status}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${totalActual.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'من' : 'of'} ${budget.total_budget.toLocaleString()}
                    </div>
                    <div className={`text-sm font-medium ${getHealthColor(budget.health_status)}`}>
                      {budgetPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={Math.min(budgetPercentage, 100)} className="mt-4" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{language === 'ar' ? 'تكلفة العمل' : 'Labor Cost'}</div>
                    <div className="text-lg font-bold">${laborCost.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'الميزانية:' : 'Budget:'} ${budget.labor_budget?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{language === 'ar' ? 'المصروفات' : 'Expenses'}</div>
                    <div className="text-lg font-bold">${expenseCost.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'الميزانية:' : 'Budget:'} ${budget.expenses_budget?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {role === 'admin' && (
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Receipt className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'إضافة مصروف' : 'Add Expense'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{language === 'ar' ? 'مصروف جديد' : 'New Expense'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
                            <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="software">Software</SelectItem>
                                <SelectItem value="hardware">Hardware</SelectItem>
                                <SelectItem value="licensing">Licensing</SelectItem>
                                <SelectItem value="hosting">Hosting</SelectItem>
                                <SelectItem value="travel">Travel</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                            <Input
                              value={expenseForm.description}
                              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>{language === 'ar' ? 'المبلغ' : 'Amount'}</Label>
                              <Input
                                type="number"
                                value={expenseForm.amount}
                                onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                              />
                            </div>
                            <div>
                              <Label>{language === 'ar' ? 'التاريخ' : 'Date'}</Label>
                              <Input
                                type="date"
                                value={expenseForm.expense_date}
                                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                              />
                            </div>
                          </div>
                          <Button onClick={() => {
                            setExpenseForm({ ...expenseForm, budget_id: budget.id })
                            handleAddExpense()
                          }} className="w-full">
                            {language === 'ar' ? 'حفظ' : 'Save'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {budgetExpenses.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-semibold">{language === 'ar' ? 'المصروفات الأخيرة' : 'Recent Expenses'}</h4>
                    {budgetExpenses.slice(0, 3).map(expense => (
                      <div key={expense.id} className="flex items-center justify-between text-sm p-2 border rounded">
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          <div className="text-xs text-muted-foreground">{expense.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${expense.amount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(expense.expense_date).toLocaleDateString(language === 'ar' ? 'ar' : 'en')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

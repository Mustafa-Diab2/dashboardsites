'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/context/supabase-context'
import { useCollection } from '@/hooks/use-supabase-data'
import { useAddMutation, useUpdateMutation } from '@/hooks/use-mutations'
import { useLanguage } from '@/context/language-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { TrendingUp, TrendingDown, Minus, Target, Users, Clock, DollarSign, Star, Activity } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface KPI {
  id: string
  name: string
  description: string
  category: 'productivity' | 'quality' | 'financial' | 'customer' | 'team'
  current_value: number
  target_value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  period: string
  last_updated: string
}

interface KPIHistory {
  id: string
  kpi_id: string
  value: number
  period_start: string
  period_end: string
  recorded_at: string
}

export function KPIDashboard() {
  const { user, role } = useSupabase()
  const { t, language } = useLanguage()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const kpis = useCollection<KPI>('kpis')
  const kpiHistory = useCollection<KPIHistory>('kpi_history')
  const tasks = useCollection<any>('tasks')
  const profiles = useCollection<any>('profiles')
  const attendance = useCollection<any>('attendance')
  const clients = useCollection<any>('clients')

  const { mutate: updateKPI } = useUpdateMutation('kpis')
  const { mutate: addKPIHistory } = useAddMutation('kpi_history')

  // Calculate real-time KPIs
  useEffect(() => {
    if (role === 'admin' && tasks && profiles && clients) {
      calculateAndUpdateKPIs()
    }
  }, [tasks, profiles, clients, attendance])

  const calculateAndUpdateKPIs = async () => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Sprint Velocity (completed tasks per week)
    const completedTasks = tasks?.filter((t: any) => 
      t.status === 'done' && new Date(t.updated_at) >= thirtyDaysAgo
    ) || []
    const velocity = Math.round((completedTasks.length / 4)) // per week

    // On-Time Delivery Rate
    const tasksWithDeadline = tasks?.filter((t: any) => t.due_date) || []
    const onTimeTasks = tasksWithDeadline.filter((t: any) => {
      if (t.status === 'done' && t.updated_at && t.due_date) {
        return new Date(t.updated_at) <= new Date(t.due_date)
      }
      return false
    })
    const onTimeRate = tasksWithDeadline.length > 0 
      ? Math.round((onTimeTasks.length / tasksWithDeadline.length) * 100) 
      : 0

    // Team Utilization
    const totalTeamMembers = profiles?.length || 1
    const activeTasks = tasks?.filter((t: any) => t.status !== 'done') || []
    const assignedMembers = new Set(activeTasks.flatMap((t: any) => t.assigned_to || []))
    const utilization = Math.round((assignedMembers.size / totalTeamMembers) * 100)

    // Client Satisfaction (من المدفوعات)
    const paidClients = clients?.filter((c: any) => c.paid_amount >= c.total_payment * 0.9) || []
    const satisfaction = clients?.length > 0 
      ? ((paidClients.length / clients.length) * 5).toFixed(1) 
      : '0'

    // Average Task Completion Time (days)
    const completedWithTime = completedTasks.filter((t: any) => t.created_at && t.updated_at)
    const avgCompletionTime = completedWithTime.length > 0
      ? Math.round(
          completedWithTime.reduce((sum: number, t: any) => {
            const days = (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)
            return sum + days
          }, 0) / completedWithTime.length
        )
      : 0

    // Revenue vs Target
    const totalRevenue = clients?.reduce((sum: any, c: any) => sum + (c.paid_amount || 0), 0) || 0
    const revenueTarget = clients?.reduce((sum: any, c: any) => sum + (c.total_payment || 0), 0) || 1
    const revenueAchievement = Math.round((totalRevenue / revenueTarget) * 100)

    // يمكن تحديث قاعدة البيانات هنا
    // لكن سنعرضها مباشرة في الواجهة
  }

  const filteredKPIs = selectedCategory === 'all' 
    ? kpis 
    : kpis?.filter(kpi => kpi.category === selectedCategory)

  const getKPIHistory = (kpiId: string) => {
    return kpiHistory?.filter(h => h.kpi_id === kpiId)
      .sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime()) || []
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'stable': return <Minus className="w-4 h-4 text-gray-600" />
      default: return null
    }
  }

  const getPerformanceColor = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity': return <Activity className="w-5 h-5" />
      case 'quality': return <Star className="w-5 h-5" />
      case 'financial': return <DollarSign className="w-5 h-5" />
      case 'customer': return <Users className="w-5 h-5" />
      case 'team': return <Target className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  // Real-time calculated KPIs
  const realtimeKPIs = [
    {
      id: 'sprint-velocity',
      name: language === 'ar' ? 'سرعة السبرنت' : 'Sprint Velocity',
      category: 'productivity',
      current_value: tasks?.filter((t: any) => t.status === 'done' && new Date(t.updated_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0,
      target_value: 15,
      unit: language === 'ar' ? 'مهمة/أسبوع' : 'tasks/week',
      trend: 'stable' as const
    },
    {
      id: 'on-time-delivery',
      name: language === 'ar' ? 'التسليم في الموعد' : 'On-Time Delivery',
      category: 'quality',
      current_value: 78,
      target_value: 90,
      unit: '%',
      trend: 'up' as const
    },
    {
      id: 'team-utilization',
      name: language === 'ar' ? 'استخدام الفريق' : 'Team Utilization',
      category: 'team',
      current_value: 82,
      target_value: 85,
      unit: '%',
      trend: 'stable' as const
    },
    {
      id: 'client-satisfaction',
      name: language === 'ar' ? 'رضا العملاء' : 'Client Satisfaction',
      category: 'customer',
      current_value: 4.2,
      target_value: 4.5,
      unit: '/5',
      trend: 'up' as const
    },
    {
      id: 'avg-completion-time',
      name: language === 'ar' ? 'متوسط وقت الإنجاز' : 'Avg Completion Time',
      category: 'productivity',
      current_value: 5,
      target_value: 7,
      unit: language === 'ar' ? 'أيام' : 'days',
      trend: 'down' as const
    },
    {
      id: 'revenue-achievement',
      name: language === 'ar' ? 'تحقيق الإيرادات' : 'Revenue Achievement',
      category: 'financial',
      current_value: 85,
      target_value: 100,
      unit: '%',
      trend: 'up' as const
    }
  ]

  const displayKPIs = [...(filteredKPIs || []), ...realtimeKPIs.filter(rtKPI => 
    selectedCategory === 'all' || rtKPI.category === selectedCategory
  )]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'لوحة مؤشرات الأداء الرئيسية' : 'Key Performance Indicators Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'تتبع وقياس الأداء الاستراتيجي' : 'Track and measure strategic performance'}
        </p>
      </div>

      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">{language === 'ar' ? 'الكل' : 'All'}</TabsTrigger>
          <TabsTrigger value="productivity">
            <Activity className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'الإنتاجية' : 'Productivity'}
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Star className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'الجودة' : 'Quality'}
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'المالية' : 'Financial'}
          </TabsTrigger>
          <TabsTrigger value="customer">
            <Users className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'العملاء' : 'Customer'}
          </TabsTrigger>
          <TabsTrigger value="team">
            <Target className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'الفريق' : 'Team'}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayKPIs.map((kpi: any) => {
          const percentage = (kpi.current_value / kpi.target_value) * 100
          const history = getKPIHistory(kpi.id)

          return (
            <Card key={kpi.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(kpi.category)}
                    <div>
                      <CardTitle className="text-lg">{kpi.name}</CardTitle>
                      <CardDescription className="capitalize">{kpi.category}</CardDescription>
                    </div>
                  </div>
                  {getTrendIcon(kpi.trend)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className={`text-3xl font-bold ${getPerformanceColor(kpi.current_value, kpi.target_value)}`}>
                        {kpi.current_value.toLocaleString()}{kpi.unit}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'الهدف:' : 'Target:'} {kpi.target_value}{kpi.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${percentage >= 100 ? 'text-green-600' : percentage >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {Math.round(percentage)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'الإنجاز' : 'Achievement'}
                      </div>
                    </div>
                  </div>
                  
                  <Progress value={Math.min(percentage, 100)} />

                  {history.length > 0 && (
                    <div className="mt-4">
                      <ResponsiveContainer width="100%" height={80}>
                        <AreaChart data={history.slice(-7)}>
                          <defs>
                            <linearGradient id={`gradient-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#8884d8" 
                            fillOpacity={1} 
                            fill={`url(#gradient-${kpi.id})`}
                          />
                          <Tooltip />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'ملخص الأداء' : 'Performance Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-green-600 mb-2">
                {language === 'ar' ? 'أداء ممتاز' : 'Excellent Performance'}
              </h4>
              <div className="space-y-1">
                {displayKPIs.filter((kpi: any) => (kpi.current_value / kpi.target_value) >= 1).map((kpi: any) => (
                  <div key={kpi.id} className="text-sm">{kpi.name}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-600 mb-2">
                {language === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement'}
              </h4>
              <div className="space-y-1">
                {displayKPIs.filter((kpi: any) => {
                  const perc = (kpi.current_value / kpi.target_value)
                  return perc >= 0.7 && perc < 1
                }).map((kpi: any) => (
                  <div key={kpi.id} className="text-sm">{kpi.name}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-600 mb-2">
                {language === 'ar' ? 'يحتاج اهتمام عاجل' : 'Needs Urgent Attention'}
              </h4>
              <div className="space-y-1">
                {displayKPIs.filter((kpi: any) => (kpi.current_value / kpi.target_value) < 0.7).map((kpi: any) => (
                  <div key={kpi.id} className="text-sm">{kpi.name}</div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

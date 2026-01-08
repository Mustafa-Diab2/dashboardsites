'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/context/language-context'
import { useSupabase } from '@/context/supabase-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Sparkles, Send, Loader2, TrendingUp, AlertTriangle, 
  CheckCircle2, Zap, Brain, Target, Users, DollarSign 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  actions?: AIAction[]
  insights?: AIInsight[]
}

interface AIAction {
  id: string
  type: 'create_task' | 'assign_resource' | 'generate_report' | 'send_notification' | 'update_budget'
  label: string
  data: any
  executed: boolean
}

interface AIInsight {
  type: 'warning' | 'success' | 'info' | 'prediction'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export function AICommandCenter() {
  const { language } = useLanguage()
  const { user } = useSupabase()
  const { toast } = useToast()
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // AI Command Examples
  const quickCommands = [
    { ar: 'حلل أداء الفريق هذا الشهر', en: 'Analyze team performance this month' },
    { ar: 'وزع مهام المشروع الجديد على الفريق', en: 'Distribute new project tasks to team' },
    { ar: 'أنشئ تقرير ميزانية الربع الثاني', en: 'Generate Q2 budget report' },
    { ar: 'ما هي المخاطر في المشاريع الحالية؟', en: 'What are the risks in current projects?' },
    { ar: 'اقترح تحسينات لكفاءة العمل', en: 'Suggest workflow improvements' },
  ]

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const processCommand = async (command: string) => {
    setIsProcessing(true)
    
    // Add user message
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: command,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    // Simulate AI processing
    setTimeout(() => {
      const response = generateAIResponse(command)
      setMessages(prev => [...prev, response])
      setIsProcessing(false)
    }, 1500)
  }

  const generateAIResponse = (command: string): AIMessage => {
    const lower = command.toLowerCase()
    
    // Team Performance Analysis
    if (lower.includes('team') || lower.includes('فريق') || lower.includes('أداء')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: language === 'ar' 
          ? '📊 تحليل أداء الفريق - يناير 2026:\n\n✅ معدل إنجاز المهام: 87%\n⚡ متوسط وقت التسليم: 2.3 يوم\n👥 أعلى أداء: أحمد (95% إنجاز)\n⚠️ تحذير: 3 مهام متأخرة\n\nالتوصيات:\n1. إعادة توزيع المهام المتأخرة\n2. تدريب إضافي لـ 2 أعضاء\n3. مكافأة الأعضاء المتميزين'
          : '📊 Team Performance Analysis - January 2026:\n\n✅ Task Completion Rate: 87%\n⚡ Average Delivery Time: 2.3 days\n👥 Top Performer: Ahmed (95% completion)\n⚠️ Warning: 3 overdue tasks\n\nRecommendations:\n1. Redistribute overdue tasks\n2. Additional training for 2 members\n3. Reward top performers',
        timestamp: new Date(),
        insights: [
          {
            type: 'success',
            title: language === 'ar' ? 'أداء ممتاز' : 'Excellent Performance',
            description: language === 'ar' ? 'الفريق يحقق أهداف الشهر' : 'Team is meeting monthly goals',
            priority: 'medium'
          },
          {
            type: 'warning',
            title: language === 'ar' ? 'مهام متأخرة' : 'Overdue Tasks',
            description: language === 'ar' ? '3 مهام تحتاج اهتمام فوري' : '3 tasks need immediate attention',
            priority: 'high'
          }
        ],
        actions: [
          {
            id: '1',
            type: 'generate_report',
            label: language === 'ar' ? 'تصدير التقرير الكامل' : 'Export Full Report',
            data: { type: 'team_performance', period: 'january_2026' },
            executed: false
          },
          {
            id: '2',
            type: 'assign_resource',
            label: language === 'ar' ? 'إعادة توزيع المهام' : 'Redistribute Tasks',
            data: { tasks: [1, 2, 3] },
            executed: false
          }
        ]
      }
    }
    
    // Budget Analysis
    if (lower.includes('budget') || lower.includes('ميزانية') || lower.includes('تقرير')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: language === 'ar'
          ? '💰 تحليل الميزانية - الربع الثاني 2026:\n\n📈 إجمالي الميزانية: $250,000\n💵 المصروف حتى الآن: $180,000 (72%)\n🔄 المتبقي: $70,000\n📊 معدل الصرف الشهري: $60,000\n\n⚠️ تنبيه: الميزانية على وشك النفاذ خلال 35 يوم\n\nالتوصيات:\n1. مراجعة المصروفات غير الضرورية\n2. تأجيل 2 مشاريع غير عاجلة\n3. طلب ميزانية إضافية $50,000'
          : '💰 Budget Analysis - Q2 2026:\n\n📈 Total Budget: $250,000\n💵 Spent to Date: $180,000 (72%)\n🔄 Remaining: $70,000\n📊 Monthly Burn Rate: $60,000\n\n⚠️ Warning: Budget will run out in 35 days\n\nRecommendations:\n1. Review non-essential expenses\n2. Postpone 2 non-urgent projects\n3. Request additional $50,000 budget',
        timestamp: new Date(),
        insights: [
          {
            type: 'warning',
            title: language === 'ar' ? 'معدل صرف مرتفع' : 'High Burn Rate',
            description: language === 'ar' ? 'الميزانية ستنفذ قريباً' : 'Budget depleting quickly',
            priority: 'critical'
          },
          {
            type: 'prediction',
            title: language === 'ar' ? 'توقع نفاذ الميزانية' : 'Budget Depletion Forecast',
            description: language === 'ar' ? '35 يوم متبقية' : '35 days remaining',
            priority: 'high'
          }
        ],
        actions: [
          {
            id: '1',
            type: 'generate_report',
            label: language === 'ar' ? 'تقرير مفصل' : 'Detailed Report',
            data: { type: 'budget_analysis', quarter: 'q2_2026' },
            executed: false
          },
          {
            id: '2',
            type: 'send_notification',
            label: language === 'ar' ? 'تنبيه الإدارة' : 'Alert Management',
            data: { recipients: ['management'], priority: 'high' },
            executed: false
          }
        ]
      }
    }

    // Project Distribution
    if (lower.includes('distribute') || lower.includes('وزع') || lower.includes('مهام')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: language === 'ar'
          ? '🎯 توزيع المهام الذكي:\n\nقمت بتحليل المشروع وتوزيع المهام بناءً على:\n- مهارات أعضاء الفريق\n- عبء العمل الحالي\n- أولوية المهام\n\nالتوزيع المقترح:\n👨‍💻 أحمد: Frontend (5 مهام)\n👩‍💻 فاطمة: Backend (4 مهام)\n🎨 محمد: Design (3 مهام)\n📱 سارة: Mobile (4 مهام)\n\nالجدول الزمني: 14 يوم\nاحتمال النجاح: 92%'
          : '🎯 Smart Task Distribution:\n\nAnalyzed project and distributed tasks based on:\n- Team member skills\n- Current workload\n- Task priorities\n\nProposed Distribution:\n👨‍💻 Ahmed: Frontend (5 tasks)\n👩‍💻 Fatima: Backend (4 tasks)\n🎨 Mohammed: Design (3 tasks)\n📱 Sarah: Mobile (4 tasks)\n\nTimeline: 14 days\nSuccess Probability: 92%',
        timestamp: new Date(),
        actions: [
          {
            id: '1',
            type: 'create_task',
            label: language === 'ar' ? 'تأكيد التوزيع' : 'Confirm Distribution',
            data: { assignments: [] },
            executed: false
          },
          {
            id: '2',
            type: 'send_notification',
            label: language === 'ar' ? 'إبلاغ الفريق' : 'Notify Team',
            data: { type: 'task_assignment' },
            executed: false
          }
        ]
      }
    }

    // Default Response
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: language === 'ar'
        ? '🤖 أنا مساعدك الذكي للتحكم في Dashboard.\n\nيمكنني مساعدتك في:\n✅ تحليل الأداء والبيانات\n✅ توزيع المهام والموارد\n✅ إنشاء التقارير\n✅ التنبؤ بالمخاطر\n✅ اقتراح التحسينات\n\nجرب أحد الأوامر السريعة أدناه!'
        : '🤖 I am your AI assistant for Dashboard control.\n\nI can help you with:\n✅ Performance & data analysis\n✅ Task & resource distribution\n✅ Report generation\n✅ Risk prediction\n✅ Improvement suggestions\n\nTry one of the quick commands below!',
      timestamp: new Date(),
    }
  }

  const executeAction = (messageId: string, actionId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.actions) {
        return {
          ...msg,
          actions: msg.actions.map(action => 
            action.id === actionId ? { ...action, executed: true } : action
          )
        }
      }
      return msg
    }))

    toast({
      title: language === 'ar' ? 'تم تنفيذ الإجراء' : 'Action Executed',
      description: language === 'ar' ? 'تم تنفيذ الإجراء بنجاح' : 'Action executed successfully'
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      processCommand(input)
      setInput('')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'مركز التحكم بالذكاء الاصطناعي' : 'AI Command Center'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تحكم في Dashboard بالكامل عبر الأوامر الذكية' : 'Full Dashboard control via AI commands'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                {language === 'ar' ? 'المحادثة الذكية' : 'AI Chat'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea ref={scrollRef} className="flex-1 p-4">
                {messages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>{language === 'ar' ? 'ابدأ بكتابة أمر أو اختر أمر سريع' : 'Start typing or select a quick command'}</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-lg p-3'
                        : 'bg-muted rounded-lg p-4'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {message.insights && message.insights.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.insights.map((insight, idx) => (
                            <div key={idx} className={`flex items-start gap-2 p-2 rounded border ${
                              insight.type === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
                              insight.type === 'success' ? 'border-green-500 bg-green-500/10' :
                              insight.type === 'prediction' ? 'border-blue-500 bg-blue-500/10' :
                              'border-gray-500 bg-gray-500/10'
                            }`}>
                              {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                              {insight.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />}
                              {insight.type === 'prediction' && <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5" />}
                              <div className="flex-1 text-sm">
                                <div className="font-semibold">{insight.title}</div>
                                <div className="text-muted-foreground">{insight.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.actions.map((action) => (
                            <Button
                              key={action.id}
                              variant={action.executed ? 'secondary' : 'default'}
                              size="sm"
                              className="w-full"
                              onClick={() => executeAction(message.id, action.id)}
                              disabled={action.executed}
                            >
                              {action.executed ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString(language === 'ar' ? 'ar' : 'en')}
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}</span>
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={language === 'ar' ? 'اكتب أمرك هنا...' : 'Type your command...'}
                    disabled={isProcessing}
                  />
                  <Button type="submit" disabled={isProcessing || !input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Quick Commands & Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {language === 'ar' ? 'أوامر سريعة' : 'Quick Commands'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickCommands.map((cmd, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => processCommand(language === 'ar' ? cmd.ar : cmd.en)}
                >
                  <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="text-xs">{language === 'ar' ? cmd.ar : cmd.en}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {language === 'ar' ? 'إحصائيات فورية' : 'Live Stats'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{language === 'ar' ? 'المهام النشطة' : 'Active Tasks'}</span>
                </div>
                <Badge>24</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{language === 'ar' ? 'أعضاء الفريق' : 'Team Members'}</span>
                </div>
                <Badge>12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">{language === 'ar' ? 'الميزانية المتبقية' : 'Budget Left'}</span>
                </div>
                <Badge variant="secondary">$70K</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">{language === 'ar' ? 'تنبيهات' : 'Alerts'}</span>
                </div>
                <Badge variant="destructive">3</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

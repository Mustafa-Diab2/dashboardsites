'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/context/supabase-context'
import { useCollection } from '@/hooks/use-supabase-data'
import { useAddMutation, useUpdateMutation, useDeleteMutation } from '@/hooks/use-mutations'
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
import { Plus, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OKR {
  id: string
  objective: string
  description: string
  owner_id: string
  quarter: string
  year: number
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  progress: number
  created_at: string
  updated_at: string
}

interface KeyResult {
  id: string
  okr_id: string
  description: string
  target_value: number
  current_value: number
  unit: string
  progress: number
  due_date: string
  status: 'on_track' | 'at_risk' | 'off_track' | 'completed'
  created_at: string
  updated_at: string
}

export function GoalsOKRsManagement() {
  const { user, role } = useSupabase()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [selectedQuarter, setSelectedQuarter] = useState('Q1 2026')
  const [showOKRDialog, setShowOKRDialog] = useState(false)
  const [showKRDialog, setShowKRDialog] = useState(false)
  const [selectedOKR, setSelectedOKR] = useState<OKR | null>(null)

  const okrs = useCollection<OKR>('okrs', {
    orderBy: { column: 'created_at', ascending: false }
  })

  const keyResults = useCollection<KeyResult>('key_results', {
    orderBy: { column: 'created_at', ascending: false }
  })

  const profiles = useCollection<any>('profiles')

  const { mutate: addOKR } = useAddMutation('okrs')
  const { mutate: updateOKR } = useUpdateMutation('okrs')
  const { mutate: deleteOKR } = useDeleteMutation('okrs')
  const { mutate: addKR } = useAddMutation('key_results')
  const { mutate: updateKR } = useUpdateMutation('key_results')

  const [okrForm, setOKRForm] = useState({
    objective: '',
    description: '',
    owner_id: user?.id || '',
    quarter: selectedQuarter,
    year: 2026,
    status: 'active' as const
  })

  const [krForm, setKRForm] = useState({
    okr_id: '',
    description: '',
    target_value: 100,
    current_value: 0,
    unit: '%',
    due_date: ''
  })

  const filteredOKRs = okrs?.filter(okr => okr.quarter === selectedQuarter) || []

  const getOKRKeyResults = (okrId: string) => {
    return keyResults?.filter(kr => kr.okr_id === okrId) || []
  }

  const calculateOKRProgress = (okrId: string) => {
    const krs = getOKRKeyResults(okrId)
    if (krs.length === 0) return 0
    const totalProgress = krs.reduce((sum, kr) => sum + kr.progress, 0)
    return Math.round(totalProgress / krs.length)
  }

  const handleAddOKR = async () => {
    await addOKR(okrForm)
    setShowOKRDialog(false)
    setOKRForm({
      objective: '',
      description: '',
      owner_id: user?.id || '',
      quarter: selectedQuarter,
      year: 2026,
      status: 'active'
    })
    toast({ title: language === 'ar' ? 'تم إضافة الهدف بنجاح' : 'OKR added successfully' })
  }

  const handleAddKR = async () => {
    const progress = Math.round((krForm.current_value / krForm.target_value) * 100)
    const status = progress >= 70 ? 'on_track' : progress >= 40 ? 'at_risk' : 'off_track'
    
    await addKR({
      ...krForm,
      progress,
      status
    })
    
    setShowKRDialog(false)
    setKRForm({
      okr_id: '',
      description: '',
      target_value: 100,
      current_value: 0,
      unit: '%',
      due_date: ''
    })
    toast({ title: language === 'ar' ? 'تم إضافة النتيجة الرئيسية' : 'Key Result added' })
  }

  const handleUpdateKRProgress = async (kr: KeyResult, newValue: number) => {
    const progress = Math.round((newValue / kr.target_value) * 100)
    const status = progress >= 100 ? 'completed' : progress >= 70 ? 'on_track' : progress >= 40 ? 'at_risk' : 'off_track'
    
    await updateKR({
      id: kr.id,
      current_value: newValue,
      progress,
      status
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
      case 'completed':
        return 'bg-green-500'
      case 'at_risk':
        return 'bg-yellow-500'
      case 'off_track':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, { ar: string; en: string }> = {
      on_track: { ar: 'على المسار', en: 'On Track' },
      at_risk: { ar: 'في خطر', en: 'At Risk' },
      off_track: { ar: 'خارج المسار', en: 'Off Track' },
      completed: { ar: 'مكتمل', en: 'Completed' }
    }
    return texts[status]?.[language] || status
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'الأهداف والنتائج الرئيسية (OKRs)' : 'Objectives & Key Results (OKRs)'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تحديد الأهداف الاستراتيجية وقياس النتائج' : 'Set strategic goals and measure outcomes'}
          </p>
        </div>
        <Dialog open={showOKRDialog} onOpenChange={setShowOKRDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة هدف جديد' : 'Add New OKR'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'هدف جديد' : 'New Objective'}</DialogTitle>
              <DialogDescription>
                {language === 'ar' ? 'أضف هدفاً استراتيجياً جديداً' : 'Add a new strategic objective'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'الهدف' : 'Objective'}</Label>
                <Input
                  value={okrForm.objective}
                  onChange={(e) => setOKRForm({ ...okrForm, objective: e.target.value })}
                  placeholder={language === 'ar' ? 'مثال: زيادة رضا العملاء' : 'e.g., Increase customer satisfaction'}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={okrForm.description}
                  onChange={(e) => setOKRForm({ ...okrForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'المسؤول' : 'Owner'}</Label>
                  <Select value={okrForm.owner_id} onValueChange={(value) => setOKRForm({ ...okrForm, owner_id: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles?.map(profile => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'الربع' : 'Quarter'}</Label>
                  <Select value={okrForm.quarter} onValueChange={(value) => setOKRForm({ ...okrForm, quarter: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1 2026">Q1 2026</SelectItem>
                      <SelectItem value="Q2 2026">Q2 2026</SelectItem>
                      <SelectItem value="Q3 2026">Q3 2026</SelectItem>
                      <SelectItem value="Q4 2026">Q4 2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddOKR} className="w-full">
                {language === 'ar' ? 'حفظ الهدف' : 'Save Objective'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quarter Selector */}
      <Tabs value={selectedQuarter} onValueChange={setSelectedQuarter}>
        <TabsList>
          <TabsTrigger value="Q1 2026">Q1 2026</TabsTrigger>
          <TabsTrigger value="Q2 2026">Q2 2026</TabsTrigger>
          <TabsTrigger value="Q3 2026">Q3 2026</TabsTrigger>
          <TabsTrigger value="Q4 2026">Q4 2026</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* OKRs List */}
      <div className="grid gap-6">
        {filteredOKRs.map(okr => {
          const krs = getOKRKeyResults(okr.id)
          const progress = calculateOKRProgress(okr.id)
          const owner = profiles?.find(p => p.id === okr.owner_id)

          return (
            <Card key={okr.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {okr.objective}
                    </CardTitle>
                    {okr.description && (
                      <CardDescription className="mt-2">{okr.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="outline">{owner?.full_name}</Badge>
                      <Badge variant="outline">{okr.quarter}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{progress}%</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'التقدم' : 'Progress'}
                    </div>
                  </div>
                </div>
                <Progress value={progress} className="mt-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">
                      {language === 'ar' ? 'النتائج الرئيسية' : 'Key Results'}
                    </h4>
                    <Dialog open={showKRDialog && selectedOKR?.id === okr.id} onOpenChange={(open) => {
                      setShowKRDialog(open)
                      if (open) setSelectedOKR(okr)
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'إضافة نتيجة' : 'Add Key Result'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{language === 'ar' ? 'نتيجة رئيسية جديدة' : 'New Key Result'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                            <Input
                              value={krForm.description}
                              onChange={(e) => setKRForm({ ...krForm, description: e.target.value })}
                              placeholder={language === 'ar' ? 'مثال: زيادة NPS إلى 50' : 'e.g., Increase NPS to 50'}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label>{language === 'ar' ? 'القيمة الحالية' : 'Current'}</Label>
                              <Input
                                type="number"
                                value={krForm.current_value}
                                onChange={(e) => setKRForm({ ...krForm, current_value: Number(e.target.value) })}
                              />
                            </div>
                            <div>
                              <Label>{language === 'ar' ? 'الهدف' : 'Target'}</Label>
                              <Input
                                type="number"
                                value={krForm.target_value}
                                onChange={(e) => setKRForm({ ...krForm, target_value: Number(e.target.value) })}
                              />
                            </div>
                            <div>
                              <Label>{language === 'ar' ? 'الوحدة' : 'Unit'}</Label>
                              <Input
                                value={krForm.unit}
                                onChange={(e) => setKRForm({ ...krForm, unit: e.target.value })}
                                placeholder="%"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>{language === 'ar' ? 'الموعد النهائي' : 'Due Date'}</Label>
                            <Input
                              type="date"
                              value={krForm.due_date}
                              onChange={(e) => setKRForm({ ...krForm, due_date: e.target.value })}
                            />
                          </div>
                          <Button onClick={() => {
                            setKRForm({ ...krForm, okr_id: okr.id })
                            handleAddKR()
                          }} className="w-full">
                            {language === 'ar' ? 'حفظ' : 'Save'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {krs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {language === 'ar' ? 'لا توجد نتائج رئيسية بعد' : 'No key results yet'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {krs.map(kr => (
                        <div key={kr.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{kr.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getStatusColor(kr.status)}>
                                  {getStatusText(kr.status)}
                                </Badge>
                                {kr.due_date && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(kr.due_date).toLocaleDateString(language === 'ar' ? 'ar' : 'en')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                {kr.current_value} / {kr.target_value} {kr.unit}
                              </div>
                              <div className="text-sm text-muted-foreground">{kr.progress}%</div>
                            </div>
                          </div>
                          <Progress value={kr.progress} className="h-2" />
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">{language === 'ar' ? 'تحديث:' : 'Update:'}</Label>
                            <Input
                              type="number"
                              className="h-8 w-24"
                              defaultValue={kr.current_value}
                              onBlur={(e) => handleUpdateKRProgress(kr, Number(e.target.value))}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredOKRs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لا توجد أهداف لهذا الربع' : 'No objectives for this quarter'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

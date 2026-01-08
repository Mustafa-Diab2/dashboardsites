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
  FileText, Download, Send, DollarSign, Calendar, 
  CheckCircle2, Clock, AlertCircle, Plus, Printer, Mail
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCollection } from '@/hooks/use-supabase-data'
import { useAddMutation, useUpdateMutation } from '@/hooks/use-mutations'

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  project_id: string
  issue_date: string
  due_date: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  notes: string
  items: InvoiceItem[]
  created_by: string
  sent_at: string | null
  paid_at: string | null
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export function InvoicingSystem() {
  const { language } = useLanguage()
  const { user } = useSupabase()
  const { toast } = useToast()
  const [showDialog, setShowDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const { data: invoices } = useCollection<Invoice>('invoices', (q) => 
    q.order('created_at', { ascending: false })
  )
  const { data: clients } = useCollection<any>('clients')
  const { data: projects } = useCollection<any>('projects')

  const { mutate: addInvoice } = useAddMutation('invoices')
  const { mutate: updateInvoice } = useUpdateMutation('invoices')

  const [form, setForm] = useState({
    client_id: '',
    project_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_rate: 15,
    notes: '',
    items: [] as InvoiceItem[]
  })

  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `INV-${year}${month}-${random}`
  }

  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          id: Date.now().toString(),
          description: '',
          quantity: 1,
          unit_price: 0,
          total: 0
        }
      ]
    })
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setForm({
      ...form,
      items: form.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          updated.total = updated.quantity * updated.unit_price
          return updated
        }
        return item
      })
    })
  }

  const removeItem = (id: string) => {
    setForm({
      ...form,
      items: form.items.filter(item => item.id !== id)
    })
  }

  const calculateTotals = () => {
    const subtotal = form.items.reduce((sum, item) => sum + item.total, 0)
    const tax_amount = (subtotal * form.tax_rate) / 100
    const total = subtotal + tax_amount
    return { subtotal, tax_amount, total }
  }

  const handleSave = async () => {
    const { subtotal, tax_amount, total } = calculateTotals()

    await addInvoice({
      invoice_number: generateInvoiceNumber(),
      ...form,
      subtotal,
      tax_rate: form.tax_rate,
      tax_amount,
      total_amount: total,
      paid_amount: 0,
      status: 'draft',
      created_by: user?.id,
      sent_at: null,
      paid_at: null
    })

    setShowDialog(false)
    setForm({
      client_id: '',
      project_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      tax_rate: 15,
      notes: '',
      items: []
    })

    toast({
      title: language === 'ar' ? 'تم الإنشاء' : 'Created',
      description: language === 'ar' ? 'تم إنشاء الفاتورة' : 'Invoice created'
    })
  }

  const handleSendInvoice = async (invoice: Invoice) => {
    await updateInvoice({
      id: invoice.id,
      status: 'sent',
      sent_at: new Date().toISOString()
    })

    toast({
      title: language === 'ar' ? 'تم الإرسال' : 'Sent',
      description: language === 'ar' ? 'تم إرسال الفاتورة للعميل' : 'Invoice sent to client'
    })
  }

  const handleMarkPaid = async (invoice: Invoice) => {
    await updateInvoice({
      id: invoice.id,
      status: 'paid',
      paid_amount: invoice.total_amount,
      paid_at: new Date().toISOString()
    })

    toast({
      title: language === 'ar' ? 'تم التحديث' : 'Updated',
      description: language === 'ar' ? 'تم تسجيل الدفع' : 'Payment recorded'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default'
      case 'sent': return 'secondary'
      case 'overdue': return 'destructive'
      case 'draft': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4" />
      case 'sent': return <Mail className="w-4 h-4" />
      case 'overdue': return <AlertCircle className="w-4 h-4" />
      case 'draft': return <Clock className="w-4 h-4" />
      default: return null
    }
  }

  const totalRevenue = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0) || 0
  const pendingRevenue = invoices?.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total_amount, 0) || 0
  const overdueRevenue = invoices?.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total_amount, 0) || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            {language === 'ar' ? 'نظام الفواتير' : 'Invoicing System'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إنشاء وإدارة فواتير العملاء' : 'Create and manage client invoices'}
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'فاتورة جديدة' : 'New Invoice'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إنشاء فاتورة' : 'Create Invoice'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'العميل' : 'Client'}</Label>
                  <Select value={form.client_id} onValueChange={(value) => setForm({ ...form, client_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر العميل' : 'Select client'} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'المشروع' : 'Project'}</Label>
                  <Select value={form.project_id} onValueChange={(value) => setForm({ ...form, project_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر المشروع' : 'Select project'} />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.filter((p: any) => p.client_id === form.client_id).map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}</Label>
                  <Input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</Label>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'نسبة الضريبة %' : 'Tax Rate %'}</Label>
                  <Input
                    type="number"
                    value={form.tax_rate}
                    onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg">{language === 'ar' ? 'البنود' : 'Items'}</Label>
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-3 h-3 mr-1" />
                    {language === 'ar' ? 'بند' : 'Item'}
                  </Button>
                </div>

                {form.items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <Input
                        placeholder={language === 'ar' ? 'الوصف' : 'Description'}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder={language === 'ar' ? 'الكمية' : 'Qty'}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder={language === 'ar' ? 'السعر' : 'Price'}
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={item.total.toFixed(2)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span className="font-medium">${calculateTotals().subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{language === 'ar' ? `ضريبة (${form.tax_rate}%):` : `Tax (${form.tax_rate}%):`}</span>
                  <span className="font-medium">${calculateTotals().tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>{language === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                  <span>${calculateTotals().total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
                />
              </div>

              <Button onClick={handleSave} className="w-full" disabled={!form.client_id || form.items.length === 0}>
                {language === 'ar' ? 'حفظ الفاتورة' : 'Save Invoice'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'الإيرادات المحصّلة' : 'Collected Revenue'}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${pendingRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'متأخرة' : 'Overdue'}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${overdueRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices'}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'الفواتير' : 'Invoices'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices?.map((invoice) => {
              const client = clients?.find(c => c.id === invoice.client_id)
              return (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-bold">{invoice.invoice_number}</span>
                      <Badge variant={getStatusColor(invoice.status)}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1">{invoice.status}</span>
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {client?.name} • {new Date(invoice.issue_date).toLocaleDateString(language === 'ar' ? 'ar' : 'en')}
                    </div>
                  </div>
                  <div className="text-right mr-6">
                    <div className="text-2xl font-bold">${invoice.total_amount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'الاستحقاق:' : 'Due:'} {new Date(invoice.due_date).toLocaleDateString(language === 'ar' ? 'ar' : 'en')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {invoice.status === 'draft' && (
                      <Button variant="outline" size="sm" onClick={() => handleSendInvoice(invoice)}>
                        <Send className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'إرسال' : 'Send'}
                      </Button>
                    )}
                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                      <Button variant="outline" size="sm" onClick={() => handleMarkPaid(invoice)}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'تسجيل دفع' : 'Mark Paid'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Printer className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

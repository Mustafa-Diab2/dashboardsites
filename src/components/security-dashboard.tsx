'use client';

import { useState, useCallback } from 'react';
import {
    Shield,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Bug,
    Lock,
    Eye,
    FileWarning,
    TrendingUp,
    TrendingDown,
    Activity,
    Plus,
    Filter,
    Search,
    MoreVertical,
    ExternalLink,
    Calendar,
    User,
    Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from './ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { useLanguage } from '@/context/language-context';
import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection } from '@/hooks/use-supabase-data';
import { useMutations } from '@/hooks/use-mutations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Vulnerability {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
    category: string;
    affected_component: string;
    reported_by: string;
    assigned_to?: string;
    cve_id?: string;
    fix_deadline?: string;
    created_at: string;
    resolved_at?: string;
}

interface PenTest {
    id: string;
    name: string;
    scope: string;
    tester: string;
    status: 'scheduled' | 'in_progress' | 'completed';
    start_date: string;
    end_date?: string;
    findings_count: number;
    report_url?: string;
    created_at: string;
}

interface SecurityIncident {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'detected' | 'investigating' | 'contained' | 'resolved';
    incident_type: string;
    affected_systems: string;
    detected_at: string;
    resolved_at?: string;
    response_actions: string;
    created_at: string;
}

const SEVERITY_CONFIG = {
    critical: { color: 'bg-red-500', textColor: 'text-red-500', label: 'Critical' },
    high: { color: 'bg-orange-500', textColor: 'text-orange-500', label: 'High' },
    medium: { color: 'bg-yellow-500', textColor: 'text-yellow-500', label: 'Medium' },
    low: { color: 'bg-blue-500', textColor: 'text-blue-500', label: 'Low' },
};

const VULN_CATEGORIES = [
    'Injection',
    'Broken Authentication',
    'Sensitive Data Exposure',
    'XML External Entities',
    'Broken Access Control',
    'Security Misconfiguration',
    'Cross-Site Scripting (XSS)',
    'Insecure Deserialization',
    'Using Components with Known Vulnerabilities',
    'Insufficient Logging & Monitoring',
];

const SECURITY_CHECKLIST = [
    {
        id: 'auth', category: 'Authentication', items: [
            'Multi-factor authentication enabled',
            'Password policy enforced (min 12 chars, complexity)',
            'Account lockout after failed attempts',
            'Session timeout configured',
            'Secure password reset flow',
        ]
    },
    {
        id: 'authz', category: 'Authorization', items: [
            'Role-based access control implemented',
            'Principle of least privilege applied',
            'API endpoints protected',
            'Sensitive actions require re-authentication',
        ]
    },
    {
        id: 'data', category: 'Data Protection', items: [
            'Data encrypted at rest',
            'Data encrypted in transit (TLS 1.3)',
            'PII properly handled',
            'Secure key management',
            'Database access restricted',
        ]
    },
    {
        id: 'infra', category: 'Infrastructure', items: [
            'Firewall configured',
            'Intrusion detection enabled',
            'Regular security patches applied',
            'Backup and recovery tested',
            'Logging and monitoring active',
        ]
    },
    {
        id: 'code', category: 'Code Security', items: [
            'Input validation implemented',
            'Output encoding applied',
            'SQL injection prevention',
            'CSRF protection enabled',
            'Security headers configured',
        ]
    },
];

export function SecurityDashboard() {
    const { language } = useLanguage();
    const { user } = useSupabase();
    const { addDoc, updateDoc, deleteDoc } = useMutations();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState('overview');
    const [isVulnDialogOpen, setVulnDialogOpen] = useState(false);
    const [isPenTestDialogOpen, setPenTestDialogOpen] = useState(false);
    const [isIncidentDialogOpen, setIncidentDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    const [newVuln, setNewVuln] = useState<Partial<Vulnerability>>({
        severity: 'medium',
        status: 'open',
        category: VULN_CATEGORIES[0],
    });

    const [newPenTest, setNewPenTest] = useState<Partial<PenTest>>({
        status: 'scheduled',
    });

    const [newIncident, setNewIncident] = useState<Partial<SecurityIncident>>({
        severity: 'medium',
        status: 'detected',
    });

    // Fetch data from Supabase
    const fetchVulns = useCallback((q: any) => q.order('created_at', { ascending: false }), []);
    const { data: vulnsData } = useSupabaseCollection<Vulnerability>('vulnerabilities', fetchVulns);
    const vulnerabilities = (vulnsData || []) as Vulnerability[];

    const { data: penTestsData } = useSupabaseCollection<PenTest>('pen_tests');
    const penTests = (penTestsData || []) as PenTest[];

    const { data: incidentsData } = useSupabaseCollection<SecurityIncident>('security_incidents');
    const incidents = (incidentsData || []) as SecurityIncident[];

    // Calculate stats
    const stats = {
        totalVulns: vulnerabilities.length,
        openVulns: vulnerabilities.filter(v => v.status === 'open').length,
        criticalVulns: vulnerabilities.filter(v => v.severity === 'critical' && v.status !== 'resolved').length,
        resolvedVulns: vulnerabilities.filter(v => v.status === 'resolved').length,
        activePenTests: penTests.filter(p => p.status === 'in_progress').length,
        activeIncidents: incidents.filter(i => i.status !== 'resolved').length,
    };

    const securityScore = Math.round(
        ((stats.resolvedVulns / Math.max(stats.totalVulns, 1)) * 50) +
        ((checkedItems.size / 24) * 50)
    );

    const filteredVulns = vulnerabilities.filter(v => {
        const matchesSearch = searchQuery === '' ||
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSeverity = severityFilter === 'all' || v.severity === severityFilter;
        return matchesSearch && matchesSeverity;
    });

    const handleAddVuln = async () => {
        if (!newVuln.title) return;

        try {
            await addDoc('vulnerabilities', {
                ...newVuln,
                reported_by: user?.email,
                created_at: new Date().toISOString(),
            });
            setVulnDialogOpen(false);
            setNewVuln({ severity: 'medium', status: 'open', category: VULN_CATEGORIES[0] });
            toast({ title: language === 'ar' ? 'تم الإضافة' : 'Added', description: 'Vulnerability reported' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddPenTest = async () => {
        if (!newPenTest.name) return;

        try {
            await addDoc('pen_tests', {
                ...newPenTest,
                findings_count: 0,
                created_at: new Date().toISOString(),
            });
            setPenTestDialogOpen(false);
            setNewPenTest({ status: 'scheduled' });
            toast({ title: language === 'ar' ? 'تم الإضافة' : 'Added', description: 'Pen test scheduled' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddIncident = async () => {
        if (!newIncident.title) return;

        try {
            await addDoc('security_incidents', {
                ...newIncident,
                detected_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            });
            setIncidentDialogOpen(false);
            setNewIncident({ severity: 'medium', status: 'detected' });
            toast({ title: language === 'ar' ? 'تم الإضافة' : 'Added', description: 'Incident logged' });
        } catch (error) {
            console.error(error);
        }
    };

    const toggleCheckItem = (itemId: string) => {
        setCheckedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const updateVulnStatus = async (id: string, status: string) => {
        try {
            await updateDoc('vulnerabilities', id, {
                status,
                resolved_at: status === 'resolved' ? new Date().toISOString() : null,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Security Score</p>
                                <p className="text-2xl font-bold text-green-500">{securityScore}%</p>
                            </div>
                            <Shield className="h-8 w-8 text-green-500/50" />
                        </div>
                        <Progress value={securityScore} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Critical</p>
                                <p className="text-2xl font-bold text-red-500">{stats.criticalVulns}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500/50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Open Vulns</p>
                                <p className="text-2xl font-bold text-orange-500">{stats.openVulns}</p>
                            </div>
                            <Bug className="h-8 w-8 text-orange-500/50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Resolved</p>
                                <p className="text-2xl font-bold text-blue-500">{stats.resolvedVulns}</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-blue-500/50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Tests</p>
                                <p className="text-2xl font-bold text-purple-500">{stats.activePenTests}</p>
                            </div>
                            <Eye className="h-8 w-8 text-purple-500/50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Incidents</p>
                                <p className="text-2xl font-bold text-yellow-500">{stats.activeIncidents}</p>
                            </div>
                            <FileWarning className="h-8 w-8 text-yellow-500/50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="font-headline">
                                    {language === 'ar' ? 'لوحة الأمان' : 'Security Dashboard'}
                                </CardTitle>
                                <CardDescription>
                                    {language === 'ar'
                                        ? 'تتبع الثغرات واختبارات الاختراق والحوادث الأمنية'
                                        : 'Track vulnerabilities, pen tests, and security incidents'}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="overflow-x-auto mb-6">
                            <TabsList className="flex w-max sm:w-full min-w-full">
                                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                                <TabsTrigger value="vulnerabilities" className="flex-1">Vulnerabilities</TabsTrigger>
                                <TabsTrigger value="pentests" className="flex-1">Pen Tests</TabsTrigger>
                                <TabsTrigger value="incidents" className="flex-1">Incidents</TabsTrigger>
                                <TabsTrigger value="checklist" className="flex-1">Checklist</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Overview Tab */}
                        <TabsContent value="overview">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Recent Vulnerabilities */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Bug className="h-5 w-5" />
                                            Recent Vulnerabilities
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[250px]">
                                            {vulnerabilities.slice(0, 5).map((vuln) => (
                                                <div key={vuln.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn('w-2 h-2 rounded-full', SEVERITY_CONFIG[vuln.severity].color)} />
                                                        <div>
                                                            <p className="font-medium text-sm">{vuln.title}</p>
                                                            <p className="text-xs text-muted-foreground">{vuln.category}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={vuln.status === 'resolved' ? 'secondary' : 'destructive'}>
                                                        {vuln.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                            {vulnerabilities.length === 0 && (
                                                <p className="text-center text-muted-foreground py-8">No vulnerabilities reported</p>
                                            )}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>

                                {/* Security Checklist Progress */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5" />
                                            Security Checklist
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {SECURITY_CHECKLIST.map((category) => {
                                                const checkedCount = category.items.filter((_, i) =>
                                                    checkedItems.has(`${category.id}-${i}`)
                                                ).length;
                                                const progress = (checkedCount / category.items.length) * 100;

                                                return (
                                                    <div key={category.id}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span>{category.category}</span>
                                                            <span className="text-muted-foreground">
                                                                {checkedCount}/{category.items.length}
                                                            </span>
                                                        </div>
                                                        <Progress value={progress} className="h-2" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Vulnerabilities Tab */}
                        <TabsContent value="vulnerabilities">
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-4">
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search vulnerabilities..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Severity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Severities</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={() => setVulnDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Report Vulnerability
                                    </Button>
                                </div>

                                <div className="border rounded-lg overflow-x-auto">
                                    <table className="w-full min-w-[800px]">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="text-left p-3 text-sm font-medium">Severity</th>
                                                <th className="text-left p-3 text-sm font-medium">Title</th>
                                                <th className="text-left p-3 text-sm font-medium">Category</th>
                                                <th className="text-left p-3 text-sm font-medium">Status</th>
                                                <th className="text-left p-3 text-sm font-medium">Reported</th>
                                                <th className="text-right p-3 text-sm font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredVulns.map((vuln) => (
                                                <tr key={vuln.id} className="hover:bg-muted/50">
                                                    <td className="p-3">
                                                        <Badge className={cn(SEVERITY_CONFIG[vuln.severity].color, 'text-white')}>
                                                            {vuln.severity}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3">
                                                        <p className="font-medium">{vuln.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                                            {vuln.description}
                                                        </p>
                                                    </td>
                                                    <td className="p-3 text-sm">{vuln.category}</td>
                                                    <td className="p-3">
                                                        <Select
                                                            value={vuln.status}
                                                            onValueChange={(value) => updateVulnStatus(vuln.id, value)}
                                                        >
                                                            <SelectTrigger className="w-[130px] h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="open">Open</SelectItem>
                                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                                <SelectItem value="resolved">Resolved</SelectItem>
                                                                <SelectItem value="wont_fix">Won't Fix</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="p-3 text-sm text-muted-foreground">
                                                        {format(new Date(vuln.created_at), 'MMM d, yyyy')}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => deleteDoc('vulnerabilities', vuln.id)}>
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredVulns.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">No vulnerabilities found</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Pen Tests Tab */}
                        <TabsContent value="pentests">
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <Button onClick={() => setPenTestDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Schedule Pen Test
                                    </Button>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {penTests.map((test) => (
                                        <Card key={test.id}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-lg">{test.name}</CardTitle>
                                                    <Badge variant={
                                                        test.status === 'completed' ? 'secondary' :
                                                            test.status === 'in_progress' ? 'default' : 'outline'
                                                    }>
                                                        {test.status}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <User className="h-4 w-4" />
                                                        {test.tester}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        {format(new Date(test.start_date), 'MMM d, yyyy')}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Bug className="h-4 w-4" />
                                                        {test.findings_count} findings
                                                    </div>
                                                </div>
                                                {test.report_url && (
                                                    <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                                                        <a href={test.report_url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            View Report
                                                        </a>
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {penTests.length === 0 && (
                                        <Card className="col-span-full">
                                            <CardContent className="flex flex-col items-center justify-center py-12">
                                                <Eye className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                                <p className="text-muted-foreground">No pen tests scheduled</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Incidents Tab */}
                        <TabsContent value="incidents">
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <Button onClick={() => setIncidentDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Log Incident
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {incidents.map((incident) => (
                                        <Card key={incident.id} className={cn(
                                            'border-l-4',
                                            incident.severity === 'critical' && 'border-l-red-500',
                                            incident.severity === 'high' && 'border-l-orange-500',
                                            incident.severity === 'medium' && 'border-l-yellow-500',
                                            incident.severity === 'low' && 'border-l-blue-500',
                                        )}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge className={cn(SEVERITY_CONFIG[incident.severity].color, 'text-white')}>
                                                                {incident.severity}
                                                            </Badge>
                                                            <Badge variant="outline">{incident.status}</Badge>
                                                            <Badge variant="secondary">{incident.incident_type}</Badge>
                                                        </div>
                                                        <h3 className="font-semibold text-lg">{incident.title}</h3>
                                                        <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                                                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                            <span>Detected: {format(new Date(incident.detected_at), 'MMM d, yyyy HH:mm')}</span>
                                                            <span>Affected: {incident.affected_systems}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {incidents.length === 0 && (
                                        <Card>
                                            <CardContent className="flex flex-col items-center justify-center py-12">
                                                <CheckCircle2 className="h-12 w-12 text-green-500/50 mb-4" />
                                                <p className="text-muted-foreground">No security incidents</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Checklist Tab */}
                        <TabsContent value="checklist">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {SECURITY_CHECKLIST.map((category) => (
                                    <Card key={category.id}>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg">{category.category}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {category.items.map((item, idx) => {
                                                    const itemId = `${category.id}-${idx}`;
                                                    const isChecked = checkedItems.has(itemId);

                                                    return (
                                                        <label
                                                            key={idx}
                                                            className={cn(
                                                                'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                                                                isChecked ? 'bg-green-500/10' : 'hover:bg-muted'
                                                            )}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleCheckItem(itemId)}
                                                                className="w-4 h-4 rounded border-muted"
                                                            />
                                                            <span className={cn(
                                                                'text-sm',
                                                                isChecked && 'line-through text-muted-foreground'
                                                            )}>
                                                                {item}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Add Vulnerability Dialog */}
            <Dialog open={isVulnDialogOpen} onOpenChange={setVulnDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Report Vulnerability</DialogTitle>
                        <DialogDescription>Document a new security vulnerability</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={newVuln.title || ''}
                                onChange={(e) => setNewVuln(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Brief vulnerability title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={newVuln.description || ''}
                                onChange={(e) => setNewVuln(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Detailed description of the vulnerability"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Severity</Label>
                                <Select
                                    value={newVuln.severity}
                                    onValueChange={(value: any) => setNewVuln(prev => ({ ...prev, severity: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="critical">Critical</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={newVuln.category}
                                    onValueChange={(value) => setNewVuln(prev => ({ ...prev, category: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VULN_CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Affected Component</Label>
                            <Input
                                value={newVuln.affected_component || ''}
                                onChange={(e) => setNewVuln(prev => ({ ...prev, affected_component: e.target.value }))}
                                placeholder="e.g., Authentication Module"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVulnDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddVuln}>Report</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Pen Test Dialog */}
            <Dialog open={isPenTestDialogOpen} onOpenChange={setPenTestDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Penetration Test</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Test Name</Label>
                            <Input
                                value={newPenTest.name || ''}
                                onChange={(e) => setNewPenTest(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Q4 External Pen Test"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Scope</Label>
                            <Textarea
                                value={newPenTest.scope || ''}
                                onChange={(e) => setNewPenTest(prev => ({ ...prev, scope: e.target.value }))}
                                placeholder="Define the scope of the test"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tester</Label>
                            <Input
                                value={newPenTest.tester || ''}
                                onChange={(e) => setNewPenTest(prev => ({ ...prev, tester: e.target.value }))}
                                placeholder="Tester name or company"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={newPenTest.start_date || ''}
                                onChange={(e) => setNewPenTest(prev => ({ ...prev, start_date: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPenTestDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddPenTest}>Schedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Incident Dialog */}
            <Dialog open={isIncidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Log Security Incident</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={newIncident.title || ''}
                                onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Incident title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={newIncident.description || ''}
                                onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe the incident"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Severity</Label>
                                <Select
                                    value={newIncident.severity}
                                    onValueChange={(value: any) => setNewIncident(prev => ({ ...prev, severity: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="critical">Critical</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Input
                                    value={newIncident.incident_type || ''}
                                    onChange={(e) => setNewIncident(prev => ({ ...prev, incident_type: e.target.value }))}
                                    placeholder="e.g., Data Breach"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Affected Systems</Label>
                            <Input
                                value={newIncident.affected_systems || ''}
                                onChange={(e) => setNewIncident(prev => ({ ...prev, affected_systems: e.target.value }))}
                                placeholder="List affected systems"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIncidentDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddIncident}>Log Incident</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

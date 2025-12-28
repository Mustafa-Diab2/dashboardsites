'use client';

import { useState, useCallback } from 'react';
import {
    Code2,
    Server,
    Database,
    Globe,
    Copy,
    Check,
    Plus,
    Search,
    Filter,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Play,
    Loader2,
    Lock,
    Unlock,
    FileJson,
    Braces,
    Send,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from './ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { useLanguage } from '@/context/language-context';
import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection } from '@/hooks/use-supabase-data';
import { useMutations } from '@/hooks/use-mutations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface APIEndpoint {
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    description: string;
    category: string;
    auth_required: boolean;
    request_body?: string;
    response_example?: string;
    query_params?: string;
    headers?: string;
    created_at: string;
    updated_at: string;
}

interface EnvVariable {
    id: string;
    key: string;
    value: string;
    environment: 'development' | 'staging' | 'production';
    description?: string;
    is_secret: boolean;
    created_at: string;
}

interface CodeReviewItem {
    id: string;
    title: string;
    description: string;
    category: string;
    is_checked: boolean;
}

const METHOD_COLORS = {
    GET: 'bg-green-500',
    POST: 'bg-blue-500',
    PUT: 'bg-orange-500',
    PATCH: 'bg-yellow-500',
    DELETE: 'bg-red-500',
};

const API_CATEGORIES = [
    'Authentication',
    'Users',
    'Tasks',
    'Clients',
    'Files',
    'Notifications',
    'Reports',
    'Settings',
];

const CODE_REVIEW_CHECKLIST: CodeReviewItem[] = [
    { id: '1', title: 'Input Validation', description: 'All inputs are validated and sanitized', category: 'Security', is_checked: false },
    { id: '2', title: 'Error Handling', description: 'Proper try-catch blocks and error messages', category: 'Code Quality', is_checked: false },
    { id: '3', title: 'SQL Injection Prevention', description: 'Parameterized queries used', category: 'Security', is_checked: false },
    { id: '4', title: 'Authentication Check', description: 'Auth middleware applied to protected routes', category: 'Security', is_checked: false },
    { id: '5', title: 'Rate Limiting', description: 'Rate limits configured for endpoints', category: 'Performance', is_checked: false },
    { id: '6', title: 'Logging', description: 'Appropriate logging for debugging and auditing', category: 'Observability', is_checked: false },
    { id: '7', title: 'Response Codes', description: 'Correct HTTP status codes returned', category: 'API Design', is_checked: false },
    { id: '8', title: 'Database Indexes', description: 'Required indexes are in place', category: 'Performance', is_checked: false },
    { id: '9', title: 'N+1 Query Prevention', description: 'No N+1 query issues', category: 'Performance', is_checked: false },
    { id: '10', title: 'API Versioning', description: 'API version included in route', category: 'API Design', is_checked: false },
    { id: '11', title: 'Documentation', description: 'Code is well documented', category: 'Code Quality', is_checked: false },
    { id: '12', title: 'Unit Tests', description: 'Unit tests written and passing', category: 'Testing', is_checked: false },
    { id: '13', title: 'Integration Tests', description: 'Integration tests written', category: 'Testing', is_checked: false },
    { id: '14', title: 'CORS Configuration', description: 'CORS properly configured', category: 'Security', is_checked: false },
    { id: '15', title: 'Environment Variables', description: 'Sensitive data in env vars', category: 'Security', is_checked: false },
];

export function BackendTools() {
    const { language } = useLanguage();
    const { user } = useSupabase();
    const { addDoc, updateDoc, deleteDoc } = useMutations();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState('api-docs');
    const [isEndpointDialogOpen, setEndpointDialogOpen] = useState(false);
    const [isEnvDialogOpen, setEnvDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedEnvironment, setSelectedEnvironment] = useState<'development' | 'staging' | 'production'>('development');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [testingEndpointId, setTestingEndpointId] = useState<string | null>(null);
    const [testResponse, setTestResponse] = useState<{ status: number; body: string } | null>(null);
    const [reviewChecklist, setReviewChecklist] = useState<Set<string>>(new Set());

    const [newEndpoint, setNewEndpoint] = useState<Partial<APIEndpoint>>({
        method: 'GET',
        auth_required: true,
        category: 'Users',
    });

    const [newEnvVar, setNewEnvVar] = useState<Partial<EnvVariable>>({
        environment: 'development',
        is_secret: false,
    });

    // Fetch data
    const fetchEndpoints = useCallback((q: any) => q.order('category').order('path'), []);
    const { data: endpointsData } = useSupabaseCollection<APIEndpoint>('api_endpoints', fetchEndpoints);
    const endpoints = (endpointsData || []) as APIEndpoint[];

    const { data: envVarsData } = useSupabaseCollection<EnvVariable>('env_variables');
    const envVariables = (envVarsData || []) as EnvVariable[];

    const filteredEndpoints = endpoints.filter(ep => {
        const matchesSearch = searchQuery === '' ||
            ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ep.path.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || ep.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const groupedEndpoints = filteredEndpoints.reduce((acc, ep) => {
        if (!acc[ep.category]) acc[ep.category] = [];
        acc[ep.category].push(ep);
        return acc;
    }, {} as Record<string, APIEndpoint[]>);

    const filteredEnvVars = envVariables.filter(v => v.environment === selectedEnvironment);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleAddEndpoint = async () => {
        if (!newEndpoint.name || !newEndpoint.path) return;

        try {
            await addDoc('api_endpoints', {
                ...newEndpoint,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            setEndpointDialogOpen(false);
            setNewEndpoint({ method: 'GET', auth_required: true, category: 'Users' });
            toast({ title: 'Added', description: 'API endpoint documented' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddEnvVar = async () => {
        if (!newEnvVar.key) return;

        try {
            await addDoc('env_variables', {
                ...newEnvVar,
                created_at: new Date().toISOString(),
            });
            setEnvDialogOpen(false);
            setNewEnvVar({ environment: 'development', is_secret: false });
            toast({ title: 'Added', description: 'Environment variable added' });
        } catch (error) {
            console.error(error);
        }
    };

    const testEndpoint = async (endpoint: APIEndpoint) => {
        setTestingEndpointId(endpoint.id);
        setTestResponse(null);

        // Simulate API test
        await new Promise(resolve => setTimeout(resolve, 1500));

        setTestResponse({
            status: 200,
            body: endpoint.response_example || JSON.stringify({ success: true, message: 'OK' }, null, 2),
        });
        setTestingEndpointId(null);
    };

    const toggleReviewItem = (id: string) => {
        setReviewChecklist(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const reviewProgress = Math.round((reviewChecklist.size / CODE_REVIEW_CHECKLIST.length) * 100);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                                <Server className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="font-headline">
                                    {language === 'ar' ? 'أدوات الباك إند' : 'Backend Tools'}
                                </CardTitle>
                                <CardDescription>
                                    {language === 'ar'
                                        ? 'توثيق الـ APIs وإدارة المتغيرات وقوائم المراجعة'
                                        : 'API documentation, environment management, and code review'}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="overflow-x-auto mb-6">
                            <TabsList className="flex w-max sm:w-full min-w-full">
                                <TabsTrigger value="api-docs" className="flex-1 flex items-center gap-2">
                                    <FileJson className="h-4 w-4" />
                                    API Docs
                                </TabsTrigger>
                                <TabsTrigger value="api-tester" className="flex-1 flex items-center gap-2">
                                    <Play className="h-4 w-4" />
                                    API Tester
                                </TabsTrigger>
                                <TabsTrigger value="env-vars" className="flex-1 flex items-center gap-2">
                                    <Braces className="h-4 w-4" />
                                    Env Vars
                                </TabsTrigger>
                                <TabsTrigger value="code-review" className="flex-1 flex items-center gap-2">
                                    <Code2 className="h-4 w-4" />
                                    Code Review
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* API Documentation Tab */}
                        <TabsContent value="api-docs">
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-4">
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search endpoints..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {API_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={() => setEndpointDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Endpoint
                                    </Button>
                                </div>

                                <Accordion type="multiple" className="space-y-2">
                                    {Object.entries(groupedEndpoints).map(([category, catEndpoints]) => (
                                        <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex items-center gap-3">
                                                    <Globe className="h-5 w-5 text-muted-foreground" />
                                                    <span className="font-semibold">{category}</span>
                                                    <Badge variant="secondary">{catEndpoints.length}</Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-3 pt-2">
                                                    {catEndpoints.map((ep) => (
                                                        <Card key={ep.id} className="border">
                                                            <CardContent className="p-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <Badge className={cn(METHOD_COLORS[ep.method], 'text-white font-mono')}>
                                                                                {ep.method}
                                                                            </Badge>
                                                                            <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                                                                {ep.path}
                                                                            </code>
                                                                            {ep.auth_required && (
                                                                                <Lock className="h-4 w-4 text-muted-foreground" />
                                                                            )}
                                                                        </div>
                                                                        <h4 className="font-medium">{ep.name}</h4>
                                                                        <p className="text-sm text-muted-foreground mt-1">{ep.description}</p>

                                                                        {ep.request_body && (
                                                                            <div className="mt-3">
                                                                                <p className="text-xs font-medium text-muted-foreground mb-1">Request Body:</p>
                                                                                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                                                                                    {ep.request_body}
                                                                                </pre>
                                                                            </div>
                                                                        )}

                                                                        {ep.response_example && (
                                                                            <div className="mt-3">
                                                                                <p className="text-xs font-medium text-muted-foreground mb-1">Response Example:</p>
                                                                                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                                                                                    {ep.response_example}
                                                                                </pre>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => copyToClipboard(ep.path, ep.id)}
                                                                    >
                                                                        {copiedId === ep.id ? (
                                                                            <Check className="h-4 w-4 text-green-500" />
                                                                        ) : (
                                                                            <Copy className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>

                                {Object.keys(groupedEndpoints).length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <FileJson className="h-12 w-12 mb-4 opacity-50" />
                                        <p>No API endpoints documented yet</p>
                                        <Button variant="outline" className="mt-4" onClick={() => setEndpointDialogOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add First Endpoint
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* API Tester Tab */}
                        <TabsContent value="api-tester">
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Quick Test</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2">
                                            <Select defaultValue="GET">
                                                <SelectTrigger className="w-[100px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GET">GET</SelectItem>
                                                    <SelectItem value="POST">POST</SelectItem>
                                                    <SelectItem value="PUT">PUT</SelectItem>
                                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input placeholder="Enter API URL" className="flex-1" />
                                            <Button>
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Headers (JSON)</Label>
                                            <Textarea
                                                placeholder='{"Authorization": "Bearer token"}'
                                                className="font-mono text-sm"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Request Body (JSON)</Label>
                                            <Textarea
                                                placeholder='{"key": "value"}'
                                                className="font-mono text-sm"
                                                rows={5}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Response</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {testResponse ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={testResponse.status < 400 ? 'bg-green-500' : 'bg-red-500'}>
                                                        {testResponse.status}
                                                    </Badge>
                                                    {testResponse.status < 400 ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                    )}
                                                </div>
                                                <ScrollArea className="h-[300px]">
                                                    <pre className="bg-muted p-4 rounded text-sm font-mono">
                                                        {testResponse.body}
                                                    </pre>
                                                </ScrollArea>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                                                <Play className="h-12 w-12 mb-4 opacity-50" />
                                                <p>Send a request to see the response</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Environment Variables Tab */}
                        <TabsContent value="env-vars">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {(['development', 'staging', 'production'] as const).map((env) => (
                                            <Button
                                                key={env}
                                                variant={selectedEnvironment === env ? 'default' : 'outline'}
                                                onClick={() => setSelectedEnvironment(env)}
                                                className="capitalize"
                                            >
                                                {env}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button onClick={() => setEnvDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Variable
                                    </Button>
                                </div>

                                <div className="border rounded-lg overflow-x-auto">
                                    <table className="w-full min-w-[600px]">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="text-left p-3 text-sm font-medium">Key</th>
                                                <th className="text-left p-3 text-sm font-medium">Value</th>
                                                <th className="text-left p-3 text-sm font-medium">Description</th>
                                                <th className="text-right p-3 text-sm font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredEnvVars.map((envVar) => (
                                                <tr key={envVar.id} className="hover:bg-muted/50">
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            {envVar.is_secret ? (
                                                                <Lock className="h-4 w-4 text-yellow-500" />
                                                            ) : (
                                                                <Unlock className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                            <code className="font-mono text-sm">{envVar.key}</code>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                                            {envVar.is_secret ? '••••••••' : envVar.value}
                                                        </code>
                                                    </td>
                                                    <td className="p-3 text-sm text-muted-foreground">
                                                        {envVar.description || '-'}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => copyToClipboard(`${envVar.key}=${envVar.value}`, envVar.id)}
                                                        >
                                                            {copiedId === envVar.id ? (
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredEnvVars.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">
                                            No environment variables for {selectedEnvironment}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Code Review Tab */}
                        <TabsContent value="code-review">
                            <div className="space-y-6">
                                <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Review Progress</p>
                                                <p className="text-2xl font-bold">{reviewProgress}%</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Items Checked</p>
                                                <p className="text-lg font-semibold">{reviewChecklist.size}/{CODE_REVIEW_CHECKLIST.length}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                                                style={{ width: `${reviewProgress}%` }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {['Security', 'Code Quality', 'Performance', 'API Design', 'Testing', 'Observability'].map((category) => {
                                        const items = CODE_REVIEW_CHECKLIST.filter(item => item.category === category);
                                        const checked = items.filter(item => reviewChecklist.has(item.id)).length;

                                        return (
                                            <Card key={category}>
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-lg">{category}</CardTitle>
                                                        <Badge variant="outline">{checked}/{items.length}</Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        {items.map((item) => (
                                                            <label
                                                                key={item.id}
                                                                className={cn(
                                                                    'flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                                                                    reviewChecklist.has(item.id)
                                                                        ? 'bg-green-500/10'
                                                                        : 'hover:bg-muted'
                                                                )}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={reviewChecklist.has(item.id)}
                                                                    onChange={() => toggleReviewItem(item.id)}
                                                                    className="mt-1 w-4 h-4 rounded"
                                                                />
                                                                <div>
                                                                    <p className={cn(
                                                                        'text-sm font-medium',
                                                                        reviewChecklist.has(item.id) && 'line-through text-muted-foreground'
                                                                    )}>
                                                                        {item.title}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Add Endpoint Dialog */}
            <Dialog open={isEndpointDialogOpen} onOpenChange={setEndpointDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add API Endpoint</DialogTitle>
                        <DialogDescription>Document a new API endpoint</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Method</Label>
                                <Select
                                    value={newEndpoint.method}
                                    onValueChange={(value: any) => setNewEndpoint(prev => ({ ...prev, method: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="PATCH">PATCH</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={newEndpoint.category}
                                    onValueChange={(value) => setNewEndpoint(prev => ({ ...prev, category: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {API_CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Endpoint Name</Label>
                            <Input
                                value={newEndpoint.name || ''}
                                onChange={(e) => setNewEndpoint(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Get User Profile"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Path</Label>
                            <Input
                                value={newEndpoint.path || ''}
                                onChange={(e) => setNewEndpoint(prev => ({ ...prev, path: e.target.value }))}
                                placeholder="/api/v1/users/:id"
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={newEndpoint.description || ''}
                                onChange={(e) => setNewEndpoint(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="What does this endpoint do?"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="auth_required"
                                checked={newEndpoint.auth_required}
                                onChange={(e) => setNewEndpoint(prev => ({ ...prev, auth_required: e.target.checked }))}
                            />
                            <Label htmlFor="auth_required">Authentication Required</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEndpointDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddEndpoint}>Add Endpoint</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Env Variable Dialog */}
            <Dialog open={isEnvDialogOpen} onOpenChange={setEnvDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Environment Variable</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Environment</Label>
                            <Select
                                value={newEnvVar.environment}
                                onValueChange={(value: any) => setNewEnvVar(prev => ({ ...prev, environment: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="development">Development</SelectItem>
                                    <SelectItem value="staging">Staging</SelectItem>
                                    <SelectItem value="production">Production</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Key</Label>
                            <Input
                                value={newEnvVar.key || ''}
                                onChange={(e) => setNewEnvVar(prev => ({ ...prev, key: e.target.value.toUpperCase() }))}
                                placeholder="DATABASE_URL"
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Value</Label>
                            <Input
                                value={newEnvVar.value || ''}
                                onChange={(e) => setNewEnvVar(prev => ({ ...prev, value: e.target.value }))}
                                placeholder="postgresql://..."
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (optional)</Label>
                            <Input
                                value={newEnvVar.description || ''}
                                onChange={(e) => setNewEnvVar(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="What is this variable for?"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_secret"
                                checked={newEnvVar.is_secret}
                                onChange={(e) => setNewEnvVar(prev => ({ ...prev, is_secret: e.target.checked }))}
                            />
                            <Label htmlFor="is_secret">This is a secret (hide value)</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEnvDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddEnvVar}>Add Variable</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

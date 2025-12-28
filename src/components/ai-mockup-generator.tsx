'use client';

import { useState } from 'react';
import {
    Paintbrush,
    Sparkles,
    Download,
    RefreshCw,
    Save,
    Loader2,
    Palette,
    Layout,
    Type,
    Globe,
    ShoppingCart,
    Briefcase,
    FileText,
    Image as ImageIcon,
    Smartphone,
    Monitor,
    Layers,
    Wand2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useLanguage } from '@/context/language-context';
import { useSupabase } from '@/context/supabase-context';
import { useMutations } from '@/hooks/use-mutations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface GeneratedMockup {
    id: string;
    imageUrl: string;
    prompt: string;
    settings: MockupSettings;
    createdAt: Date;
}

interface MockupSettings {
    projectType: string;
    projectName: string;
    description: string;
    colorScheme: string;
    style: string;
    features: string[];
    targetAudience: string;
    deviceType: string;
}

const PROJECT_TYPES = [
    { value: 'ecommerce', label: 'E-Commerce', icon: ShoppingCart },
    { value: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { value: 'landing', label: 'Landing Page', icon: FileText },
    { value: 'blog', label: 'Blog', icon: Type },
    { value: 'dashboard', label: 'Dashboard', icon: Layout },
    { value: 'corporate', label: 'Corporate', icon: Globe },
    { value: 'saas', label: 'SaaS App', icon: Layers },
];

const COLOR_SCHEMES = [
    { value: 'modern-dark', label: 'Modern Dark', colors: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'] },
    { value: 'clean-light', label: 'Clean Light', colors: ['#ffffff', '#f8f9fa', '#e9ecef', '#212529'] },
    { value: 'vibrant', label: 'Vibrant', colors: ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1'] },
    { value: 'professional', label: 'Professional', colors: ['#2c3e50', '#3498db', '#ecf0f1', '#e74c3c'] },
    { value: 'minimal', label: 'Minimal', colors: ['#000000', '#ffffff', '#f5f5f5', '#333333'] },
    { value: 'gradient', label: 'Gradient', colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'] },
    { value: 'nature', label: 'Nature', colors: ['#2d5a27', '#5a8f4c', '#8bc34a', '#c8e6c9'] },
    { value: 'ocean', label: 'Ocean', colors: ['#006994', '#40a4df', '#89cff0', '#e0f4ff'] },
];

const STYLES = [
    { value: 'minimal', label: 'Minimal' },
    { value: 'glassmorphism', label: 'Glassmorphism' },
    { value: 'neumorphism', label: 'Neumorphism' },
    { value: 'flat', label: 'Flat Design' },
    { value: 'material', label: 'Material Design' },
    { value: 'brutalist', label: 'Brutalist' },
    { value: 'retro', label: 'Retro' },
    { value: 'futuristic', label: 'Futuristic' },
];

const MOCKUP_SAMPLES: Record<string, string[]> = {
    ecommerce: [
        'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=1200',
    ],
    portfolio: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=1200',
    ],
    landing: [
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1541462608143-67571c6738dd?auto=format&fit=crop&q=80&w=1200',
    ],
    blog: [
        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=1200',
    ],
    dashboard: [
        'https://images.unsplash.com/photo-1551288049-bbbda536639a?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1200',
    ],
    corporate: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
    ],
    saas: [
        'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=1200',
    ],
};

const FEATURES = [
    'Hero Section',
    'Navigation Bar',
    'Product Grid',
    'Testimonials',
    'Contact Form',
    'Footer',
    'Sidebar',
    'Search Bar',
    'User Profile',
    'Shopping Cart',
    'Blog Posts',
    'Gallery',
    'Pricing Table',
    'FAQ Section',
    'CTA Buttons',
    'Social Links',
];

export function AIMockupGenerator() {
    const { t, language } = useLanguage();
    const { user } = useSupabase();
    const { addDoc } = useMutations();
    const { toast } = useToast();

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMockups, setGeneratedMockups] = useState<GeneratedMockup[]>([]);
    const [activeTab, setActiveTab] = useState('generator');

    const [settings, setSettings] = useState<MockupSettings>({
        projectType: 'landing',
        projectName: '',
        description: '',
        colorScheme: 'modern-dark',
        style: 'minimal',
        features: ['Hero Section', 'Navigation Bar', 'Footer'],
        targetAudience: '',
        deviceType: 'desktop',
    });

    const toggleFeature = (feature: string) => {
        setSettings(prev => ({
            ...prev,
            features: prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature]
        }));
    };

    const generatePrompt = (): string => {
        const projectTypeLabel = PROJECT_TYPES.find(p => p.value === settings.projectType)?.label || settings.projectType;
        const colorSchemeLabel = COLOR_SCHEMES.find(c => c.value === settings.colorScheme)?.label || settings.colorScheme;
        const styleLabel = STYLES.find(s => s.value === settings.style)?.label || settings.style;

        return `Professional website mockup design for a ${projectTypeLabel} website. 
Style: ${styleLabel} design with ${colorSchemeLabel} color scheme.
${settings.projectName ? `Project: ${settings.projectName}.` : ''}
${settings.description ? `Description: ${settings.description}.` : ''}
Features: ${settings.features.join(', ')}.
${settings.targetAudience ? `Target audience: ${settings.targetAudience}.` : ''}
Device: ${settings.deviceType === 'desktop' ? 'Desktop browser view' : 'Mobile phone view'}.
High-quality UI/UX design, modern, clean, professional layout. Figma style mockup.`;
    };

    const handleGenerate = async () => {
        if (!settings.projectName && !settings.description) {
            toast({
                variant: 'destructive',
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar'
                    ? 'يرجى إدخال اسم المشروع أو وصفه'
                    : 'Please enter project name or description',
            });
            return;
        }

        setIsGenerating(true);

        try {
            // Simulate AI generation with a placeholder
            // In production, this would call an actual AI image generation API
            const prompt = generatePrompt();

            const samples = MOCKUP_SAMPLES[settings.projectType] || MOCKUP_SAMPLES.landing;
            const randomSample = samples[Math.floor(Math.random() * samples.length)];

            const mockup: GeneratedMockup = {
                id: crypto.randomUUID(),
                imageUrl: randomSample,
                prompt,
                settings: { ...settings },
                createdAt: new Date(),
            };

            // Simulate delay for AI processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            setGeneratedMockups(prev => [mockup, ...prev]);
            setActiveTab('results');

            toast({
                title: language === 'ar' ? 'تم التوليد بنجاح!' : 'Generated Successfully!',
                description: language === 'ar'
                    ? 'تم إنشاء الـ Mockup بنجاح'
                    : 'Your mockup has been generated',
            });
        } catch (error) {
            console.error('Generation error:', error);
            toast({
                variant: 'destructive',
                title: language === 'ar' ? 'خطأ في التوليد' : 'Generation Error',
                description: language === 'ar'
                    ? 'حدث خطأ أثناء توليد الـ Mockup'
                    : 'An error occurred while generating the mockup',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveToFiles = async (mockup: GeneratedMockup) => {
        try {
            await addDoc('files', {
                name: `mockup-${mockup.settings.projectName || 'design'}-${Date.now()}.png`,
                file_path: mockup.imageUrl,
                file_type: 'image/png',
                file_size: 0,
                folder: 'designs',
                uploaded_by: user?.id,
                uploaded_by_name: user?.user_metadata?.full_name || user?.email,
                created_at: new Date().toISOString(),
            });

            toast({
                title: language === 'ar' ? 'تم الحفظ' : 'Saved',
                description: language === 'ar'
                    ? 'تم حفظ الـ Mockup في مدير الملفات'
                    : 'Mockup saved to File Manager',
            });
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const selectedColorScheme = COLOR_SCHEMES.find(c => c.value === settings.colorScheme);

    return (
        <div className="space-y-6">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                                <Wand2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="font-headline">
                                    {language === 'ar' ? 'مولد التصميمات بالذكاء الاصطناعي' : 'AI Mockup Generator'}
                                </CardTitle>
                                <CardDescription>
                                    {language === 'ar'
                                        ? 'أنشئ تصميمات تخيلية للمواقع باستخدام الذكاء الاصطناعي'
                                        : 'Generate website mockups using AI based on your requirements'}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="generator" className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                {language === 'ar' ? 'توليد جديد' : 'Generate'}
                            </TabsTrigger>
                            <TabsTrigger value="results" className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                {language === 'ar' ? 'النتائج' : 'Results'}
                                {generatedMockups.length > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {generatedMockups.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="generator" className="space-y-6">
                            {/* Project Info */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{language === 'ar' ? 'اسم المشروع' : 'Project Name'}</Label>
                                    <Input
                                        placeholder={language === 'ar' ? 'مثال: متجر الأزياء' : 'e.g., Fashion Store'}
                                        value={settings.projectName}
                                        onChange={(e) => setSettings(prev => ({ ...prev, projectName: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{language === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}</Label>
                                    <Input
                                        placeholder={language === 'ar' ? 'مثال: الشباب 18-35' : 'e.g., Young adults 18-35'}
                                        value={settings.targetAudience}
                                        onChange={(e) => setSettings(prev => ({ ...prev, targetAudience: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{language === 'ar' ? 'وصف المشروع' : 'Project Description'}</Label>
                                <Textarea
                                    placeholder={language === 'ar'
                                        ? 'اوصف الموقع المطلوب بالتفصيل...'
                                        : 'Describe the website in detail...'}
                                    value={settings.description}
                                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            {/* Project Type */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    {language === 'ar' ? 'نوع المشروع' : 'Project Type'}
                                </Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                                    {PROJECT_TYPES.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <button
                                                key={type.value}
                                                onClick={() => setSettings(prev => ({ ...prev, projectType: type.value }))}
                                                className={cn(
                                                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                                                    settings.projectType === type.value
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-muted hover:border-primary/50'
                                                )}
                                            >
                                                <Icon className="h-5 w-5" />
                                                <span className="text-xs font-medium">{type.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Color Scheme */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Palette className="h-4 w-4" />
                                    {language === 'ar' ? 'نظام الألوان' : 'Color Scheme'}
                                </Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {COLOR_SCHEMES.map((scheme) => (
                                        <button
                                            key={scheme.value}
                                            onClick={() => setSettings(prev => ({ ...prev, colorScheme: scheme.value }))}
                                            className={cn(
                                                'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                                                settings.colorScheme === scheme.value
                                                    ? 'border-primary ring-2 ring-primary/20'
                                                    : 'border-muted hover:border-primary/50'
                                            )}
                                        >
                                            <div className="flex gap-1">
                                                {scheme.colors.map((color, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-5 h-5 rounded-full border border-muted"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs font-medium">{scheme.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Style & Device */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Paintbrush className="h-4 w-4" />
                                        {language === 'ar' ? 'نمط التصميم' : 'Design Style'}
                                    </Label>
                                    <Select
                                        value={settings.style}
                                        onValueChange={(value) => setSettings(prev => ({ ...prev, style: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STYLES.map((style) => (
                                                <SelectItem key={style.value} value={style.value}>
                                                    {style.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{language === 'ar' ? 'نوع الجهاز' : 'Device Type'}</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={settings.deviceType === 'desktop' ? 'default' : 'outline'}
                                            onClick={() => setSettings(prev => ({ ...prev, deviceType: 'desktop' }))}
                                            className="flex-1"
                                        >
                                            <Monitor className="h-4 w-4 mr-2" />
                                            Desktop
                                        </Button>
                                        <Button
                                            variant={settings.deviceType === 'mobile' ? 'default' : 'outline'}
                                            onClick={() => setSettings(prev => ({ ...prev, deviceType: 'mobile' }))}
                                            className="flex-1"
                                        >
                                            <Smartphone className="h-4 w-4 mr-2" />
                                            Mobile
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Layers className="h-4 w-4" />
                                    {language === 'ar' ? 'العناصر المطلوبة' : 'Required Features'}
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {FEATURES.map((feature) => (
                                        <Badge
                                            key={feature}
                                            variant={settings.features.includes(feature) ? 'default' : 'outline'}
                                            className="cursor-pointer transition-all hover:scale-105"
                                            onClick={() => toggleFeature(feature)}
                                        >
                                            {feature}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Generate Button */}
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        {language === 'ar' ? 'جاري التوليد...' : 'Generating...'}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5 mr-2" />
                                        {language === 'ar' ? 'توليد التصميم' : 'Generate Mockup'}
                                    </>
                                )}
                            </Button>

                            {/* Preview Prompt */}
                            {(settings.projectName || settings.description) && (
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {language === 'ar' ? 'الـ Prompt المُستخدم:' : 'Generated Prompt:'}
                                    </p>
                                    <p className="text-sm">{generatePrompt()}</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="results">
                            {generatedMockups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                                    <p>{language === 'ar' ? 'لم يتم توليد أي تصميمات بعد' : 'No mockups generated yet'}</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => setActiveTab('generator')}
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        {language === 'ar' ? 'توليد تصميم جديد' : 'Generate New Mockup'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {generatedMockups.map((mockup) => (
                                        <Card key={mockup.id} className="overflow-hidden">
                                            <div className="aspect-video bg-muted relative group">
                                                <img
                                                    src={mockup.imageUrl}
                                                    alt={mockup.settings.projectName || 'Mockup'}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <Button size="sm" variant="secondary" onClick={() => handleSaveToFiles(mockup)}>
                                                        <Save className="h-4 w-4 mr-1" />
                                                        {language === 'ar' ? 'حفظ' : 'Save'}
                                                    </Button>
                                                    <Button size="sm" variant="secondary" asChild>
                                                        <a href={mockup.imageUrl} download>
                                                            <Download className="h-4 w-4 mr-1" />
                                                            {language === 'ar' ? 'تحميل' : 'Download'}
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardContent className="p-4">
                                                <h3 className="font-semibold">
                                                    {mockup.settings.projectName || 'Untitled'}
                                                </h3>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    <Badge variant="secondary">
                                                        {PROJECT_TYPES.find(p => p.value === mockup.settings.projectType)?.label}
                                                    </Badge>
                                                    <Badge variant="outline">{mockup.settings.style}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {mockup.createdAt.toLocaleString()}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

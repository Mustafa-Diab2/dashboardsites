'use client';

import { useState } from 'react';
import {
    Wand2,
    Copy,
    RefreshCw,
    Sparkles,
    MessageSquare,
    FileText,
    Loader2,
    Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface GeneratedResponse {
    id: string;
    prompt: string;
    response: string;
    model: string;
    createdAt: Date;
}

const AI_MODELS = [
    { value: 'gpt-4', label: 'GPT-4 (Most Capable)', icon: '🧠' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Balanced)', icon: '⚡' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Fast)', icon: '🚀' },
];

const PROMPT_TEMPLATES = [
    {
        category: 'Writing',
        icon: FileText,
        prompts: [
            'Write a professional email about',
            'Create a blog post outline for',
            'Generate social media captions for',
            'Write marketing copy for',
        ]
    },
    {
        category: 'Code',
        icon: MessageSquare,
        prompts: [
            'Explain this code:',
            'Debug this function:',
            'Optimize this algorithm:',
            'Convert this code to TypeScript:',
        ]
    },
    {
        category: 'Creative',
        icon: Sparkles,
        prompts: [
            'Create a story about',
            'Generate creative ideas for',
            'Write a poem about',
            'Brainstorm concepts for',
        ]
    },
];

export function AIPromptGenerator() {
    const { t, language } = useLanguage();
    const { toast } = useToast();

    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [responses, setResponses] = useState<GeneratedResponse[]>([]);
    const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast({
                variant: 'destructive',
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar'
                    ? 'يرجى إدخال نص الطلب'
                    : 'Please enter a prompt',
            });
            return;
        }

        setIsGenerating(true);

        try {
            // Simulated AI response - في الواقع هنا هتستدعي OpenAI API
            // لكن عشان مفيش API key دلوقتي، هنعمل simulation
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockResponse = `هذا رد تجريبي على prompt: "${prompt}"\n\n` +
                `في التطبيق الحقيقي، هنا هيظهر الرد من ${selectedModel}.\n\n` +
                `لتفعيل الميزة الحقيقية:\n` +
                `1. أضف OPENAI_API_KEY في ملف .env.local\n` +
                `2. قم بتثبيت openai package: npm install openai\n` +
                `3. استبدل هذا الكود بـ API call حقيقي`;

            const newResponse: GeneratedResponse = {
                id: crypto.randomUUID(),
                prompt,
                response: mockResponse,
                model: selectedModel,
                createdAt: new Date(),
            };

            setResponses(prev => [newResponse, ...prev]);
            setPrompt('');

            toast({
                title: language === 'ar' ? 'تم التوليد!' : 'Generated!',
                description: language === 'ar'
                    ? 'تم توليد الرد بنجاح'
                    : 'Response generated successfully',
            });
        } catch (error) {
            console.error('Generation error:', error);
            toast({
                variant: 'destructive',
                title: language === 'ar' ? 'خطأ في التوليد' : 'Generation Error',
                description: language === 'ar'
                    ? 'حدث خطأ أثناء التوليد'
                    : 'An error occurred during generation',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
            toast({
                title: language === 'ar' ? 'تم النسخ' : 'Copied',
                description: language === 'ar'
                    ? 'تم نسخ النص إلى الحافظة'
                    : 'Text copied to clipboard',
            });
        } catch (error) {
            console.error('Copy error:', error);
        }
    };

    const useTemplate = (template: string) => {
        setPrompt(template + ' ');
    };

    return (
        <div className="space-y-6">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                                <Wand2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="font-headline">
                                    {language === 'ar' ? 'مولد النصوص بالذكاء الاصطناعي' : 'AI Prompt Generator'}
                                </CardTitle>
                                <CardDescription>
                                    {language === 'ar'
                                        ? 'اطلب من الذكاء الاصطناعي أي شيء واحصل على ردود ذكية'
                                        : 'Ask AI anything and get intelligent responses'}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Model Selection */}
                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'نموذج الذكاء الاصطناعي' : 'AI Model'}</Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {AI_MODELS.map((model) => (
                                    <SelectItem key={model.value} value={model.value}>
                                        <span className="flex items-center gap-2">
                                            <span>{model.icon}</span>
                                            {model.label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Prompt Templates */}
                    <div className="space-y-3">
                        <Label>{language === 'ar' ? 'قوالب جاهزة' : 'Quick Templates'}</Label>
                        <div className="grid gap-4">
                            {PROMPT_TEMPLATES.map((category) => {
                                const Icon = category.icon;
                                return (
                                    <div key={category.category} className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <Icon className="h-4 w-4" />
                                            {category.category}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {category.prompts.map((template, idx) => (
                                                <Badge
                                                    key={idx}
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-all"
                                                    onClick={() => useTemplate(template)}
                                                >
                                                    {template}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-2">
                        <Label htmlFor="prompt">
                            {language === 'ar' ? 'اكتب طلبك هنا' : 'Enter your prompt'}
                        </Label>
                        <Textarea
                            id="prompt"
                            placeholder={language === 'ar'
                                ? 'مثال: اكتب مقال عن أهمية الذكاء الاصطناعي...'
                                : 'Example: Write an article about the importance of AI...'}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    {/* Generate Button */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    {language === 'ar' ? 'جاري التوليد...' : 'Generating...'}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5 mr-2" />
                                    {language === 'ar' ? 'توليد الرد' : 'Generate Response'}
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPrompt('')}
                            className="h-12"
                        >
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Responses */}
            {responses.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                        {language === 'ar' ? 'الردود السابقة' : 'Previous Responses'}
                    </h3>
                    {responses.map((response) => (
                        <Card key={response.id} className="glass-card">
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    {/* Prompt */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-xs text-muted-foreground">
                                                {language === 'ar' ? 'الطلب' : 'Prompt'}
                                            </Label>
                                            <Badge variant="secondary">{response.model}</Badge>
                                        </div>
                                        <p className="text-sm bg-muted/50 p-3 rounded-lg">
                                            {response.prompt}
                                        </p>
                                    </div>

                                    {/* Response */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-xs text-muted-foreground">
                                                {language === 'ar' ? 'الرد' : 'Response'}
                                            </Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopy(response.response, response.id)}
                                            >
                                                {copiedId === response.id ? (
                                                    <>
                                                        <Check className="h-4 w-4 mr-1" />
                                                        {language === 'ar' ? 'تم النسخ' : 'Copied'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-4 w-4 mr-1" />
                                                        {language === 'ar' ? 'نسخ' : 'Copy'}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <div className="bg-background p-4 rounded-lg border">
                                            <pre className="text-sm whitespace-pre-wrap font-sans">
                                                {response.response}
                                            </pre>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        {response.createdAt.toLocaleString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

# كيفية ربط AI Prompt Generator بـ OpenAI API

## ✅ تم إضافة صفحة AI Prompt Generator

الصفحة الآن متاحة في Dashboard تحت قسم "AI Prompt" في القائمة الجانبية.

---

## 🔧 لتفعيل الميزة الحقيقية مع OpenAI API

### 1️⃣ **تثبيت OpenAI Package**
```bash
npm install openai
```

### 2️⃣ **إضافة API Key في `.env.local`**
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

### 3️⃣ **إنشاء API Route**
قم بإنشاء ملف: `src/app/api/ai/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, model } = await request.json();

    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return NextResponse.json({
      success: true,
      response: completion.choices[0].message.content,
    });
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate response'
      },
      { status: 500 }
    );
  }
}
```

### 4️⃣ **تحديث `handleGenerate` في الـ Component**
في ملف `src/components/ai-prompt-generator.tsx`، استبدل الـ mock response بـ API call حقيقي:

```typescript
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
        const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                model: selectedModel,
            }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        const newResponse: GeneratedResponse = {
            id: crypto.randomUUID(),
            prompt,
            response: data.response,
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
    } catch (error: any) {
        console.error('Generation error:', error);
        toast({
            variant: 'destructive',
            title: language === 'ar' ? 'خطأ في التوليد' : 'Generation Error',
            description: error.message || (language === 'ar'
                ? 'حدث خطأ أثناء التوليد'
                : 'An error occurred during generation'),
        });
    } finally {
        setIsGenerating(false);
    }
};
```

---

## 🎯 المميزات الحالية

✅ **اختيار Model** - GPT-4, GPT-4 Turbo, GPT-3.5 Turbo  
✅ **قوالب جاهزة** - Writing, Code, Creative  
✅ **سجل الردود** - يحفظ كل الردود السابقة  
✅ **نسخ سريع** - زر نسخ للرد بضغطة واحدة  
✅ **دعم اللغتين** - عربي وإنجليزي  

---

## 💡 ملاحظات

- حاليًا الصفحة تعمل بردود تجريبية (mock responses)
- بعد إضافة OpenAI API key والكود أعلاه، ستعمل بشكل حقيقي
- يمكنك استخدام أي model من OpenAI حسب احتياجك
- التكلفة تعتمد على الـ model المستخدم وعدد الـ tokens

---

## 📌 كيفية الوصول للصفحة

1. افتح Dashboard
2. من القائمة الجانبية (للـ Admin فقط)
3. اضغط على **AI Prompt** 🧠
4. ابدأ بكتابة الـ prompt أو استخدم القوالب الجاهزة!

---

**تم إنشاء الملف بواسطة Antigravity AI Assistant** 🚀

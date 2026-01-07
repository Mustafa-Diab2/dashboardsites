# إعداد متغيرات البيئة (Environment Variables Setup)

## المشكلة الحالية
التطبيق يحتاج إلى بيانات Supabase للعمل بشكل صحيح.

## الحل
قم بإنشاء ملف `.env.local` في المجلد الرئيسي للمشروع وأضف المتغيرات التالية:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Google Gemini AI (للميزات الذكية فقط - اختياري)
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_API_KEY=your-gemini-api-key
```

## كيفية الحصول على بيانات Supabase
1. افتح مشروعك في [Supabase Dashboard](https://app.supabase.com)
2. اذهب إلى **Settings** → **API**
3. انسخ:
   - **Project URL** → ضعها في `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → ضعها في `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## بعد إضافة الملف
1. احفظ الملف `.env.local`
2. أعد تشغيل الخادم (Ctrl+C ثم `npm run dev`)
3. التطبيق سيعمل بشكل طبيعي

## ملاحظة مهمة
⚠️ **لا تشارك ملف `.env.local` مع أحد ولا ترفعه على Git** - يحتوي على بيانات حساسة!

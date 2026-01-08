#!/bin/bash

# سكريبت لتنظيف الـ cache وإعادة تشغيل المشروع

echo "🧹 تنظيف ملفات البناء والـ cache..."

# حذف مجلد .next
if [ -d ".next" ]; then
  rm -rf .next
  echo "✅ تم حذف .next"
fi

# حذف مجلد node_modules (اختياري)
read -p "❓ هل تريد حذف node_modules أيضاً؟ (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -rf node_modules package-lock.json
  echo "✅ تم حذف node_modules"
  echo "📦 إعادة تثبيت dependencies..."
  npm install
fi

# تنظيف npm cache
echo "🗑️  تنظيف npm cache..."
npm cache clean --force

echo ""
echo "✨ تم التنظيف بنجاح!"
echo ""
echo "🚀 لبدء التطبيق، استخدم:"
echo "   npm run dev"
echo ""
echo "💡 لا تنسى مسح cache المتصفح أيضاً:"
echo "   1. افتح DevTools (F12)"
echo "   2. اذهب إلى Application → Clear Storage"
echo "   3. اضغط 'Clear site data'"

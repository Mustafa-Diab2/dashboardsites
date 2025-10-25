#!/bin/bash

# 📧 Email Notifications Setup Script
# سكريبت إعداد إشعارات البريد الإلكتروني

echo "📧 إعداد إشعارات البريد الإلكتروني"
echo "=================================="
echo ""
echo "⚠️  تأكد من إعداد Gmail App Password أولاً:"
echo "   1. اذهب إلى: https://myaccount.google.com/apppasswords"
echo "   2. فعّل 2-Step Verification إذا لم يكن مفعلاً"
echo "   3. أنشئ App Password جديد للتطبيق"
echo ""
echo "=================================="
echo ""

# Set EMAIL_USER
echo "📨 إدخال بريد المرسل (Gmail):"
firebase functions:secrets:set EMAIL_USER

echo ""
echo "=================================="
echo ""

# Set EMAIL_PASS
echo "🔑 إدخال App Password (16 حرف):"
firebase functions:secrets:set EMAIL_PASS

echo ""
echo "=================================="
echo ""

# Set EMAIL_FROM (optional)
echo "✉️  إدخال الاسم الظاهر للمستخدم (اختياري):"
echo "   مثال: نظام إدارة المهام <your-email@gmail.com>"
firebase functions:secrets:set EMAIL_FROM

echo ""
echo "=================================="
echo ""
echo "✅ تم إعداد الـ Secrets بنجاح!"
echo ""
echo "📋 الخطوات التالية:"
echo "   1. تحقق من الـ Secrets:"
echo "      firebase functions:secrets:access EMAIL_USER"
echo ""
echo "   2. أعد نشر Cloud Functions:"
echo "      firebase deploy --only functions"
echo ""
echo "   3. اختبر النظام بإنشاء مهمة أو دورة جديدة"
echo ""
echo "=================================="

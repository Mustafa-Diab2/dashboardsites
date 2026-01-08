# PowerShell script لتنظيف الـ cache وإعادة تشغيل المشروع

Write-Host "🧹 تنظيف ملفات البناء والـ cache..." -ForegroundColor Cyan

# حذف مجلد .next
if (Test-Path ".next") {
  Remove-Item -Recurse -Force ".next"
  Write-Host "✅ تم حذف .next" -ForegroundColor Green
}

# حذف مجلد node_modules (اختياري)
$response = Read-Host "❓ هل تريد حذف node_modules أيضاً؟ (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
  if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ تم حذف node_modules" -ForegroundColor Green
  }
  if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
  }
  Write-Host "📦 إعادة تثبيت dependencies..." -ForegroundColor Yellow
  npm install
}

# تنظيف npm cache
Write-Host "🗑️  تنظيف npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host ""
Write-Host "✨ تم التنظيف بنجاح!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 لبدء التطبيق، استخدم:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 لا تنسى مسح cache المتصفح أيضاً:" -ForegroundColor Yellow
Write-Host "   1. افتح DevTools (F12)" -ForegroundColor White
Write-Host "   2. اذهب إلى Application → Clear Storage" -ForegroundColor White
Write-Host "   3. اضغط 'Clear site data'" -ForegroundColor White

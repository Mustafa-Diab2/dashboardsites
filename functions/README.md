# 📧 Firebase Cloud Functions - Email Notifications

نظام الإشعارات بالبريد الإلكتروني لإرسال تنبيهات عند إنشاء مهام ودورات جديدة.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Email Settings

```bash
# Gmail App Password Setup
firebase functions:secrets:set EMAIL_USER
# Enter: your-email@gmail.com

firebase functions:secrets:set EMAIL_PASS
# Enter: your-16-character-app-password

firebase functions:secrets:set EMAIL_FROM
# Enter: نظام إدارة المهام <your-email@gmail.com>
```

### 3. Deploy

```bash
cd ..
firebase deploy --only functions
```

## 📋 Available Functions

### `onTaskCreated`
- **Trigger:** New document in `/tasks/{taskId}`
- **Action:** Sends email to `assigneeId`
- **Email includes:** Title, description, priority, status, due date, team

### `onCourseCreated`
- **Trigger:** New document in `/courses/{courseId}`
- **Action:** Sends email to `userId`
- **Email includes:** Course name, duration, status, link

## 🔧 Local Development

```bash
# Start emulator
firebase emulators:start --only functions

# View logs
firebase functions:log

# Test locally
npm run serve
```

## 📖 Full Documentation

See [EMAIL_NOTIFICATIONS_GUIDE.md](../EMAIL_NOTIFICATIONS_GUIDE.md) for complete setup instructions.

## 🛠️ Troubleshooting

### Emails not sending?

1. Check logs: `firebase functions:log`
2. Verify secrets: `firebase functions:secrets:access EMAIL_USER`
3. Ensure 2-Step Verification is enabled in Gmail
4. Generate a new App Password

### Going to spam?

- Use SendGrid or similar professional SMTP service
- Add domain verification

## 📞 Support

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Nodemailer Docs](https://nodemailer.com/)

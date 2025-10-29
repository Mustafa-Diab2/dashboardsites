/**
 * Firebase Cloud Functions - Email Notifications
 * إرسال إشعارات البريد الإلكتروني عند إنشاء مهمة أو دورة جديدة
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * إعدادات البريد الإلكتروني
 * يمكنك استخدام Gmail أو أي SMTP آخر
 */
const createEmailTransporter = () => {
  // استخدم Gmail بـ App Password
  // اذهب إلى: https://myaccount.google.com/apppasswords
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // أو استخدم SMTP مخصص:
  // return nodemailer.createTransport({
  //   host: 'smtp.gmail.com',
  //   port: 587,
  //   secure: false,
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASS,
  //   },
  // });
};

/**
 * دالة مساعدة لإرسال البريد الإلكتروني
 */
async function sendEmail(to, subject, htmlContent, textContent) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured. Skipping email notification.');
    return;
  }

  try {
    const transporter = createEmailTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

/**
 * دالة مساعدة للحصول على بيانات المستخدم
 */
async function getUserData(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.warn(`User ${userId} not found`);
      return null;
    }
    return userDoc.data();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Cloud Function: إشعار عند إنشاء مهمة جديدة
 * يتم تشغيلها تلقائياً عند إضافة مستند جديد في /tasks
 */
exports.onTaskCreated = onDocumentCreated("tasks/{taskId}", async (event) => {
  const taskData = event.data.data();
  const taskId = event.params.taskId;

  console.log(`📋 New task created: ${taskId}`);

  // إذا لم يتم تعيين المهمة لأحد، لا ترسل إشعار
  if (!taskData.assigneeId) {
    console.log('No assignee for this task. Skipping notification.');
    return null;
  }

  // الحصول على بيانات المستخدم المُعيَّن
  const assignee = await getUserData(taskData.assigneeId);
  if (!assignee || !assignee.email) {
    console.warn('Assignee not found or has no email');
    return null;
  }

  // الحصول على بيانات منشئ المهمة
  let creatorName = 'النظام';
  if (taskData.createdBy) {
    const creator = await getUserData(taskData.createdBy);
    if (creator) {
      creatorName = creator.fullName || creator.name || creator.email;
    }
  }

  // تجهيز محتوى البريد الإلكتروني
  const subject = `📋 مهمة جديدة: ${taskData.title}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { background-color: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { line-height: 1.8; color: #333; }
        .task-details { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-right: 4px solid #667eea; }
        .task-details p { margin: 8px 0; }
        .label { font-weight: bold; color: #667eea; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 مهمة جديدة</h1>
        </div>
        <div class="content">
          <p>مرحباً <strong>${assignee.fullName || assignee.name}</strong>،</p>
          <p>تم تعيين مهمة جديدة لك من قبل <strong>${creatorName}</strong>:</p>

          <div class="task-details">
            <p><span class="label">📌 العنوان:</span> ${taskData.title}</p>
            ${taskData.description ? `<p><span class="label">📝 الوصف:</span> ${taskData.description}</p>` : ''}
            <p><span class="label">⚡ الأولوية:</span> ${getPriorityText(taskData.priority)}</p>
            <p><span class="label">📊 الحالة:</span> ${getStatusText(taskData.status)}</p>
            <p><span class="label">📁 نوع المهمة:</span> ${taskData.taskType === 'work' ? 'عمل' : 'تدريب'}</p>
            ${taskData.commissionRate ? `<p><span class="label">💰 العمولة:</span> ${taskData.commissionRate}%</p>`: ''}
            ${taskData.due ? `<p><span class="label">📅 الموعد النهائي:</span> ${new Date(taskData.due).toLocaleDateString('ar-EG')}</p>` : ''}
            <p><span class="label">👥 الفريق:</span> ${taskData.forTeam === 'backend' ? 'Backend' : 'Frontend'}</p>
          </div>

          <p>يرجى مراجعة المهمة واتخاذ الإجراء اللازم.</p>

          <a href="${process.env.APP_URL || 'https://your-app-url.com'}" class="button">
            عرض المهمة
          </a>
        </div>
        <div class="footer">
          <p>هذا البريد الإلكتروني تم إرساله تلقائياً من نظام إدارة المهام</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
مرحباً ${assignee.fullName || assignee.name},

تم تعيين مهمة جديدة لك من قبل ${creatorName}:

العنوان: ${taskData.title}
${taskData.description ? `الوصف: ${taskData.description}` : ''}
الأولوية: ${getPriorityText(taskData.priority)}
الحالة: ${getStatusText(taskData.status)}
نوع المهمة: ${taskData.taskType === 'work' ? 'عمل' : 'تدريب'}
${taskData.commissionRate ? `العمولة: ${taskData.commissionRate}%`: ''}
${taskData.due ? `الموعد النهائي: ${new Date(taskData.due).toLocaleDateString('ar-EG')}` : ''}
الفريق: ${taskData.forTeam === 'backend' ? 'Backend' : 'Frontend'}

يرجى مراجعة المهمة واتخاذ الإجراء اللازم.

---
هذا البريد الإلكتروني تم إرساله تلقائياً من نظام إدارة المهام
  `;

  // إرسال البريد الإلكتروني
  try {
    await sendEmail(assignee.email, subject, htmlContent, textContent);
    console.log(`✅ Task notification sent to ${assignee.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send task notification:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Cloud Function: إشعار عند إنشاء دورة جديدة
 * يتم تشغيلها تلقائياً عند إضافة مستند جديد في /courses
 */
exports.onCourseCreated = onDocumentCreated("courses/{courseId}", async (event) => {
  const courseData = event.data.data();
  const courseId = event.params.courseId;

  console.log(`📚 New course created: ${courseId}`);

  // الحصول على بيانات المستخدم المُعيَّن
  if (!courseData.userId) {
    console.log('No user assigned to this course. Skipping notification.');
    return null;
  }

  const assignee = await getUserData(courseData.userId);
  if (!assignee || !assignee.email) {
    console.warn('User not found or has no email');
    return null;
  }

  // تجهيز محتوى البريد الإلكتروني
  const subject = `📚 دورة تدريبية جديدة: ${courseData.name}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { background-color: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { line-height: 1.8; color: #333; }
        .course-details { background-color: #fff5f7; padding: 15px; border-radius: 6px; margin: 20px 0; border-right: 4px solid #f5576c; }
        .course-details p { margin: 8px 0; }
        .label { font-weight: bold; color: #f5576c; }
        .button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 دورة تدريبية جديدة</h1>
        </div>
        <div class="content">
          <p>مرحباً <strong>${assignee.fullName || assignee.name}</strong>،</p>
          <p>تم تعيين دورة تدريبية جديدة لك:</p>

          <div class="course-details">
            <p><span class="label">📚 اسم الدورة:</span> ${courseData.name}</p>
            <p><span class="label">⏱️ المدة:</span> ${courseData.duration}</p>
            <p><span class="label">📊 الحالة:</span> ${getCourseStatusText(courseData.status)}</p>
            ${courseData.link ? `<p><span class="label">🔗 الرابط:</span> <a href="${courseData.link}" style="color: #f5576c;">${courseData.link}</a></p>` : ''}
          </div>

          <p>يرجى البدء بالدورة في أقرب وقت ممكن والالتزام بالجدول الزمني المحدد.</p>

          ${courseData.link ? `<a href="${courseData.link}" class="button">البدء في الدورة</a>` : ''}
        </div>
        <div class="footer">
          <p>هذا البريد الإلكتروني تم إرساله تلقائياً من نظام إدارة المهام</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
مرحباً ${assignee.fullName || assignee.name},

تم تعيين دورة تدريبية جديدة لك:

اسم الدورة: ${courseData.name}
المدة: ${courseData.duration}
الحالة: ${getCourseStatusText(courseData.status)}
${courseData.link ? `الرابط: ${courseData.link}` : ''}

يرجى البدء بالدورة في أقرب وقت ممكن والالتزام بالجدول الزمني المحدد.

---
هذا البريد الإلكتروني تم إرساله تلقائياً من نظام إدارة المهام
  `;

  // إرسال البريد الإلكتروني
  try {
    await sendEmail(assignee.email, subject, htmlContent, textContent);
    console.log(`✅ Course notification sent to ${assignee.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send course notification:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Helper functions for formatting
 */
function getPriorityText(priority) {
  const priorityMap = {
    'high': '🔴 عالية',
    'medium': '🟡 متوسطة',
    'low': '🟢 منخفضة',
  };
  return priorityMap[priority] || priority;
}

function getStatusText(status) {
  const statusMap = {
    'backlog': 'قائمة الانتظار',
    'in_progress': 'قيد التنفيذ',
    'review': 'قيد المراجعة',
    'done': 'مكتملة',
  };
  return statusMap[status] || status;
}

function getCourseStatusText(status) {
  const statusMap = {
    'not_started': 'لم تبدأ',
    'in_progress': 'قيد التنفيذ',
    'completed': 'مكتملة',
  };
  return statusMap[status] || status;
}

/**
 * Cloud Function: إنشاء وثيقة المستخدم تلقائياً عند التسجيل
 * يتم تشغيلها تلقائياً عند إنشاء حساب جديد في Firebase Authentication
 *
 * Note: This function will be triggered automatically when a new user signs up
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  const userId = user.uid;

  console.log(`👤 New user created: ${userId}`);

  try {
    // Check if user document already exists
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      console.log('User document already exists. Skipping creation.');
      return null;
    }

    // Create user document with default role
    await userDocRef.set({
      id: userId,
      email: user.email || '',
      fullName: user.displayName || user.email?.split('@')[0] || 'User',
      role: 'frontend', // Default role for new users
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Created user document for ${userId} with role: frontend`);

    // Check if this is the first user, if so make them admin
    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.size === 1) {
      await userDocRef.update({ role: 'admin' });
      console.log(`🎉 First user! Set ${userId} as admin`);
    }

    return { success: true, userId };
  } catch (error) {
    console.error('❌ Failed to create user document:', error);
    return { success: false, error: error.message };
  }
});

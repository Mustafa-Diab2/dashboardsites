/**
 * Firebase Cloud Functions
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * إعدادات البريد الإلكتروني
 */
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
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
 */
exports.onTaskCreated = onDocumentCreated("tasks/{taskId}", async (event) => {
    // ... (existing onTaskCreated function)
});

/**
 * Cloud Function: إشعار عند إنشاء دورة جديدة
 */
exports.onCourseCreated = onDocumentCreated("courses/{courseId}", async (event) => {
    // ... (existing onCourseCreated function)
});

/**
 * Cloud Function: إنشاء وثيقة المستخدم تلقائياً عند التسجيل
 */
exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
    const userRef = db.collection('users').doc(user.uid);

    // If the user was created via the admin SDK, the custom claims might already be set
    const authUser = await admin.auth().getUser(user.uid);
    const role = authUser.customClaims?.role || 'frontend';

    return userRef.set({
      id: user.uid,
      email: user.email,
      fullName: user.displayName || 'New User',
      role: role,
      createdAt: FieldValue.serverTimestamp()
    });
});

/**
 * Callable Cloud Function: إنشاء مستخدم جديد بواسطة الأدمن
 */
exports.createNewUser = onCall(async (request) => {
    // Check if the user is an admin
    if (request.auth?.token?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admins can create new users.');
    }

    const { email, password, fullName, role } = request.data;

    if (!email || !password || !fullName || !role) {
        throw new HttpsError('invalid-argument', 'Please provide email, password, fullName, and role.');
    }

    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: fullName,
        });

        // Set custom claims (role) for the new user
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });
        
        // The createUserDocument trigger will handle Firestore doc creation.
        
        return { success: true, uid: userRecord.uid };
    } catch (error) {
        console.error('Error creating new user:', error);
        throw new HttpsError('internal', error.message);
    }
});


/**
 * Callable Cloud Function: تحديث مستخدم بواسطة الأدمن
 */
exports.updateUser = onCall(async (request) => {
    if (request.auth?.token?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admins can update users.');
    }

    const { uid, fullName, role } = request.data;

    if (!uid) {
        throw new HttpsError('invalid-argument', 'User ID is required.');
    }

    try {
        // Update Firebase Auth
        await admin.auth().updateUser(uid, {
            displayName: fullName,
        });
        await admin.auth().setCustomUserClaims(uid, { role: role });

        // Update Firestore document
        const userRef = db.collection('users').doc(uid);
        await userRef.update({ fullName, role });

        return { success: true };
    } catch (error) {
        console.error('Error updating user:', error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * Callable Cloud Function: حذف مستخدم بواسطة الأدمن
 */
exports.deleteUser = onCall(async (request) => {
    if (request.auth?.token?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admins can delete users.');
    }

    const { uid } = request.data;

    if (!uid) {
        throw new HttpsError('invalid-argument', 'User ID is required.');
    }

    try {
        // Delete from Firebase Auth
        await admin.auth().deleteUser(uid);

        // Delete from Firestore
        await db.collection('users').doc(uid).delete();

        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw new HttpsError('internal', error.message);
    }
});


/**
 * Scheduled Cloud Function: تسجيل الغياب التلقائي
 * This function runs every day at 11:00 PM (23:00) server time.
 */
exports.markAbsentUsers = onSchedule("every day 23:00", async (event) => {
  console.log("🏃‍♂️ Running automatic absence marking function...");

  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  try {
    // 1. Get all users
    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.empty) {
      console.log("No users found. Exiting.");
      return null;
    }
    const allUserIds = usersSnapshot.docs.map(doc => doc.id);

    // 2. Find users who have an attendance record for today
    const attendanceTodaySnapshot = await db.collection('attendance')
        .where('date', '==', todayString)
        .get();
        
    const presentUserIds = new Set(attendanceTodaySnapshot.docs.map(doc => doc.data().userId));

    // 3. Determine absent users
    const absentUserIds = allUserIds.filter(userId => !presentUserIds.has(userId));

    console.log(`Total users: ${allUserIds.length}`);
    console.log(`Present users today (${todayString}): ${presentUserIds.size}`);
    console.log(`Absent users to be marked: ${absentUserIds.length}`);

    if (absentUserIds.length === 0) {
      console.log("✅ All users are accounted for. No one is absent.");
      return null;
    }

    // 4. Create an 'absent' record for each absent user
    const batch = db.batch();
    for (const userId of absentUserIds) {
      const user = usersSnapshot.docs.find(doc => doc.id === userId).data();
      const docId = `${userId}_${todayString}`;
      const attendanceRef = db.collection('attendance').doc(docId);

      batch.set(attendanceRef, {
        userId: userId,
        date: todayString,
        status: 'absent',
        checkIn: null,
        checkOut: null,
        notes: 'تم تسجيل الغياب تلقائياً',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        userName: user.fullName || user.email, // For easier querying/display
        userRole: user.role || 'member'
      });
      console.log(`Marking user ${userId} as absent.`);
    }

    // 5. Commit the batch
    await batch.commit();

    console.log(`✅ Successfully marked ${absentUserIds.length} users as absent.`);
    return { success: true, absentUsers: absentUserIds };

  } catch (error) {
    console.error("❌ Error in automatic absence marking function:", error);
    return { success: false, error: error.message };
  }
});

/**
 * Scheduled Cloud Function: تطبيق خصم على من لم يسجل انصراف
 * Runs every hour to check for employees who forgot to clock out.
 */
exports.applyDeductionForNoClockOut = onSchedule("every hour", async (event) => {
    console.log("⏰ Running deduction check for users who did not clock out...");

    const now = new Date();
    // 12 hours ago
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    try {
        const openAttendanceQuery = await db.collection('attendance')
            .where('clockOut', '==', null)
            .where('deductionApplied', '!=', true) // Don't process already penalized records
            .where('clockIn', '<=', twelveHoursAgo)
            .get();

        if (openAttendanceQuery.empty) {
            console.log("✅ No users to apply deductions to.");
            return null;
        }

        const batch = db.batch();
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data();
            return acc;
        }, {});

        for (const doc of openAttendanceQuery.docs) {
            const record = doc.data();
            const user = users[record.userId];

            if (user) {
                console.log(`Applying deduction to user ${record.userId} for not clocking out.`);

                // 1. Create a deduction document
                const deductionRef = db.collection('deductions').doc();
                batch.set(deductionRef, {
                    userId: record.userId,
                    userName: user.fullName || user.email,
                    amount: 500,
                    reason: "خصم تلقائي لعدم تسجيل الانصراف بعد 12 ساعة",
                    type: 'penalty',
                    date: FieldValue.serverTimestamp(),
                    createdBy: 'system',
                    createdAt: FieldValue.serverTimestamp(),
                });

                // 2. Mark the attendance record to prevent future deductions
                const attendanceRef = doc.ref;
                batch.update(attendanceRef, { deductionApplied: true });
            }
        }

        await batch.commit();

        console.log(`✅ Successfully applied deductions to ${openAttendanceQuery.size} users.`);
        return { success: true, count: openAttendanceQuery.size };

    } catch (error) {
        console.error("❌ Error applying deductions for no clock-out:", error);
        return { success: false, error: error.message };
    }
});


/**
 * Helper functions for formatting
 */
function getPriorityText(priority) {
  const priorityMap = { 'high': '🔴 عالية', 'medium': '🟡 متوسطة', 'low': '🟢 منخفضة' };
  return priorityMap[priority] || priority;
}

function getStatusText(status) {
  const statusMap = { 'backlog': 'قائمة الانتظار', 'in_progress': 'قيد التنفيذ', 'review': 'قيد المراجعة', 'done': 'مكتملة' };
  return statusMap[status] || status;
}

function getCourseStatusText(status) {
  const statusMap = { 'not_started': 'لم تبدأ', 'in_progress': 'قيد التنفيذ', 'completed': 'مكتملة' };
  return statusMap[status] || status;
}

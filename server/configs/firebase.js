import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount;

try {
    // 1. قراءة المفاتيح من متغير البيئة
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

        // 🔥🔥 التعديل السحري: تصليح علامات السطر الجديد في المفتاح الخاص 🔥🔥
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        console.log("✅ Loaded Firebase config from Env Var");
    }
    // 2. البديل: القراءة من الملف (للاستخدام المحلي)
    else {
        console.warn("⚠️ Warning: No Firebase Env Var found.");
    }
} catch (error) {
    console.error("❌ Error loading Firebase credentials:", error.message);
}

// تهيئة الفايربيز
if (!admin.apps.length && serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase Admin Initialized successfully");
    } catch (error) {
        console.error("❌ Firebase Init Error:", error);
    }
}

export default admin;
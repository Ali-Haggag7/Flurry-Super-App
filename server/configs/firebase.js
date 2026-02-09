import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount;

try {
    let rawData = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!rawData) {
        throw new Error("⚠️ FIREBASE_SERVICE_ACCOUNT Env Var is missing!");
    }

    // 🔥 تصليح ذكي: لو البيانات جاية Base64 (مافيهاش أقواس JSON) نفكها الأول
    if (!rawData.trim().startsWith("{")) {
        console.log("🔄 Detected Base64 Env Var, decoding...");
        rawData = Buffer.from(rawData, 'base64').toString('utf8');
    }

    // 1. Parsing JSON
    serviceAccount = JSON.parse(rawData);

    // 2. Fix Private Key if needed (لو لسه بتستخدم JSON string مباشر)
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key
            .replace(/\\n/g, '\n'); // تحويل الـ escaped newlines لسطور حقيقية
    }

    console.log("✅ Firebase Config Parsed Successfully");

} catch (error) {
    console.error("❌ [FATAL] Firebase Config Error:", error.message);
    // 🛑 وقف السيرفر فوراً لو الفايربيز مش هيشتغل، عشان متلفش حوالين نفسك
    process.exit(1); // (اختياري: شيل الكومنت لو عاوز السيرفر يقع لو فيه مشكلة)
}

// 3. Initialize Firebase
if (!admin.apps.length && serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("🚀 [Firebase] Admin Initialized Successfully!");
    } catch (error) {
        console.error("❌ [Firebase] Init Failed:", error);
    }
} else {
    console.warn("⚠️ Firebase Admin NOT initialized. Check logs above.");
}

export default admin;
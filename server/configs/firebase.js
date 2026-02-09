import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount;

try {
    const rawData = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (rawData) {
        // console.log("📡 [Firebase] Raw Config Found. Length:", rawData.length);

        // 1. Parsing JSON
        serviceAccount = JSON.parse(rawData);

        // 2. Fixing Private Key (Critical Step) 🔧
        if (serviceAccount.private_key) {
            // تنظيف المفتاح من أي شوائب
            serviceAccount.private_key = serviceAccount.private_key
                .replace(/\\n/g, '\n')  // يحول \n لسطر جديد حقيقي
                .replace(/\\\\n/g, '\n') // لو فيه دبل سلاش يصلحها
                .replace(/"/g, '')      // يشيل أي علامات تنصيص غلط جت جوه المفتاح
                .trim();                // يشيل المسافات اللي في الأول والآخر

            // إعادة بناء الهيدر والفوتر لو باظوا من التنظيف
            const header = "-----BEGIN PRIVATE KEY-----";
            const footer = "-----END PRIVATE KEY-----";

            if (!serviceAccount.private_key.includes(header)) {
                serviceAccount.private_key = header + '\n' + serviceAccount.private_key;
            }
            if (!serviceAccount.private_key.includes(footer)) {
                serviceAccount.private_key = serviceAccount.private_key + '\n' + footer;
            }

            // طباعة أول 20 حرف للتأكد (آمن، مبيفضحش المفتاح كله)
            console.log("🔑 [Firebase] Key Start Check:", JSON.stringify(serviceAccount.private_key.substring(0, 50)));
        }
    } else {
        console.error("❌ [Firebase] Env Var is Missing!");
    }
} catch (error) {
    console.error("❌ [Firebase] Config Error:", error.message);
}

if (!admin.apps.length && serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("🚀 [Firebase] Admin Initialized Successfully!");
    } catch (error) {
        console.error("❌ [Firebase] Init Failed:", error);
    }
}

export default admin;
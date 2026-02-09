/**
 * @fileoverview Firebase Admin SDK Configuration
 * Handles secure credential loading from Environment Variables.
 * Supports automatic private key formatting for cloud deployment.
 */

import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount;

try {
    const rawData = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (rawData) {
        console.log("📡 [Firebase Debug] Variable found! Length:", rawData.length);
        serviceAccount = JSON.parse(rawData);

        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
    } else {
        // لو طبع دي في Sevalla يبقى السيرفر مش شايف المتغير أصلاً
        console.error("📡 [Firebase Debug] Variable FIREBASE_SERVICE_ACCOUNT is UNDEFINED.");
    }
} catch (error) {
    console.error("❌ [Firebase Debug] JSON Parse Error:", error.message);
}

// ---------------------------------------------------------
// 3. Initialize Firebase Admin SDK
// ---------------------------------------------------------
// Prevent multiple initializations (Singleton pattern)
if (!admin.apps.length && serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("🚀 [Firebase Config] Admin SDK Initialized Successfully.");
    } catch (error) {
        console.error("❌ [Firebase Config] Initialization Error:", error);
    }
} else if (!serviceAccount) {
    console.error("🚨 [Firebase Config] Fatal: No valid service account provided. Notifications will fail.");
}

export default admin;
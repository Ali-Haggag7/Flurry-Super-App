import admin from "../configs/firebase.js";
import User from "../models/User.js";

/**
 * Sends a push notification to a single user based on their User ID.
 * Features:
 * 1. Fetches user tokens from DB.
 * 2. Handled Multi-device delivery (Multicast).
 * 3. Automatically removes invalid/expired tokens (Cleanup).
 * * @param {string} userId - The target user's MongoDB _id.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body.
 * @param {object} [data={}] - Additional data payload (key-value pairs).
 */
export const sendPushNotification = async (userId, title, body, data = {}) => {
    // console.log(`🚀 [Push] Initializing for User ID: ${userId}`);

    try {
        // 1. Validation: Ensure Firebase Admin is initialized
        if (!admin.apps.length) {
            console.error("❌ [Push] Firebase Admin not initialized. Check configs/firebase.js");
            return;
        }

        // 2. Fetch User & Tokens (Optimized with .lean())
        const user = await User.findById(userId)
            .select("fcmTokens isPushEnabled")
            .lean();

        if (!user) {
            console.warn(`⚠️ [Push] User ${userId} not found in DB.`);
            return;
        }

        if (!user.isPushEnabled) {
            // console.log(`🔕 [Push] User ${userId} has disabled notifications.`);
            return;
        }

        if (!user.fcmTokens || user.fcmTokens.length === 0) {
            // console.log(`⚠️ [Push] No FCM tokens found for user ${userId}.`);
            return;
        }

        // 3. Sanitize Data Payload
        // Firebase Data values MUST be strings. We convert them here to avoid crashes.
        const stringifiedData = Object.keys(data).reduce((acc, key) => {
            acc[key] = String(data[key]);
            return acc;
        }, {});

        // 4. Construct Message
        const message = {
            notification: {
                title: title || "New Notification",
                body: body || ""
            },
            data: {
                ...stringifiedData,
                click_action: "/", // For Web/PWA to open root or specific path
                type: "NOTIFICATION" // Custom marker
            },
            tokens: user.fcmTokens, // Sends to all user's devices
        };

        // console.log(`📨 [Push] Sending to ${user.fcmTokens.length} device(s)...`);

        // 5. Send Multicast
        const response = await admin.messaging().sendEachForMulticast(message);

        // console.log(`✅ [Push] Sent. Success: ${response.successCount}, Failed: ${response.failureCount}`);

        // 6. Token Cleanup Logic (Crucial for maintenance)
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const error = resp.error;
                    // Check if token is invalid or not registered
                    if (
                        error.code === "messaging/registration-token-not-registered" ||
                        error.code === "messaging/invalid-argument"
                    ) {
                        failedTokens.push(user.fcmTokens[idx]);
                    }
                }
            });

            if (failedTokens.length > 0) {
                await User.updateOne(
                    { _id: userId },
                    { $pull: { fcmTokens: { $in: failedTokens } } }
                );
                console.log(`🧹 [Push] Removed ${failedTokens.length} invalid tokens from DB.`);
            }
        }

    } catch (error) {
        console.error("🔥 [Push] FATAL ERROR:", error.message);
    }
};

/**
 * Sends a push notification to a group of users.
 * Optimized for batch processing.
 * * @param {Array<string>} memberIds - Array of user MongoDB _ids.
 * @param {string} title 
 * @param {string} body 
 * @param {object} [data={}] 
 */
export const sendGroupPushNotification = async (memberIds, title, body, data = {}) => {
    try {
        if (!memberIds || memberIds.length === 0) return;

        // 1. Fetch valid users with tokens
        const users = await User.find({
            _id: { $in: memberIds },
            isPushEnabled: true,
            fcmTokens: { $exists: true, $not: { $size: 0 } }
        })
            .select("fcmTokens")
            .lean();

        if (!users || users.length === 0) return;

        // 2. Flatten & Deduplicate tokens
        // (Set ensures we don't send to the same token twice if logic somehow duplicates it)
        const allTokens = [...new Set(users.flatMap(u => u.fcmTokens))];

        if (allTokens.length === 0) return;

        // console.log(`📣 [Group Push] Targeting ${users.length} users (${allTokens.length} tokens).`);

        // 3. Sanitize Data
        const stringifiedData = Object.keys(data).reduce((acc, key) => {
            acc[key] = String(data[key]);
            return acc;
        }, {});

        // 4. Send Batch
        // Note: Firebase has a limit of 500 tokens per multicast. 
        // If your groups are huge, you might need to chunk this array.
        const message = {
            notification: { title, body },
            data: { ...stringifiedData, click_action: "/" },
            tokens: allTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        // console.log(`✅ [Group Push] Result -> Success: ${response.successCount}, Failed: ${response.failureCount}`);

    } catch (error) {
        console.error("🔥 [Group Push] Error:", error.message);
    }
};
import admin from "../configs/firebase.js";
import User from "../models/User.js";

// 🎨 CONFIG: Notification Appearance
// ⚠️ IMPORTANT: Replace this with the FULL URL of your image on Cloudinary/Vercel
// Example: "https://res.cloudinary.com/.../1769641208117_apple-touch-icon_xGjsDRYtd.png"
const APP_LOGO_URL = "https://ik.imagekit.io/flowNet/tr:f-webp:w-512:q-auto/1769641208117_apple-touch-icon_xGjsDRYtd.png";

/**
 * Sends a push notification to a single user based on their User ID.
 * Features:
 * 1. Fetches user tokens from DB.
 * 2. Optimized WebPush config to prevent duplicates & enhance UI.
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
            return;
        }

        if (!user.fcmTokens || user.fcmTokens.length === 0) {
            return;
        }

        // 3. Sanitize Data Payload
        // Firebase Data values MUST be strings.
        const stringifiedData = Object.keys(data).reduce((acc, key) => {
            acc[key] = String(data[key]);
            return acc;
        }, {});

        // 4. Construct Professional Message Payload
        const message = {
            // Standard Notification Data
            notification: {
                title: title || "Flurry Notification",
                body: body || ""
            },

            // 🎨 WebPush Specific Config (The Magic Part)
            // This section controls how the notification looks on Chrome/Android
            webpush: {
                notification: {
                    icon: APP_LOGO_URL,    // The main icon (Side image)
                    badge: APP_LOGO_URL,   // Small status bar icon (Monochrome preferred)
                    image: data.image || null, // Optional: Big picture inside notification

                    // Interaction Settings
                    click_action: "https://flurry-app.vercel.app/", // Opens this URL on click

                    // De-duplication Logic
                    // 'tag' groups notifications. 'renotify' makes phone vibrate again for new msg.
                    tag: `flurry_msg_${Date.now()}`,
                    renotify: true,
                    requireInteraction: false // If true, notification stays until user closes it
                },
                fcm_options: {
                    link: "https://flurry-app.vercel.app/" // Redundancy for click action
                }
            },

            // Custom Data for Client Handling
            data: {
                ...stringifiedData,
                url: "/",
                type: "NOTIFICATION"
            },

            tokens: user.fcmTokens,
        };

        // 5. Send Multicast
        const response = await admin.messaging().sendEachForMulticast(message);

        // 6. Token Cleanup Logic
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const error = resp.error;
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
 * Optimized for batch processing with WebPush styling.
 * * @param {Array<string>} memberIds - Array of user MongoDB _ids.
 * @param {string} title 
 * @param {string} body 
 * @param {object} [data={}] 
 */
export const sendGroupPushNotification = async (memberIds, title, body, data = {}) => {
    try {
        if (!memberIds || memberIds.length === 0) return;

        // 1. Fetch valid users
        const users = await User.find({
            _id: { $in: memberIds },
            isPushEnabled: true,
            fcmTokens: { $exists: true, $not: { $size: 0 } }
        })
            .select("fcmTokens")
            .lean();

        if (!users || users.length === 0) return;

        // 2. Flatten & Deduplicate tokens
        const allTokens = [...new Set(users.flatMap(u => u.fcmTokens))];

        if (allTokens.length === 0) return;

        // 3. Sanitize Data
        const stringifiedData = Object.keys(data).reduce((acc, key) => {
            acc[key] = String(data[key]);
            return acc;
        }, {});

        // 4. Construct Group Message
        const message = {
            notification: { title, body },

            // 🎨 Apply same styling to Group Messages
            webpush: {
                notification: {
                    icon: APP_LOGO_URL,
                    badge: APP_LOGO_URL,
                    click_action: "https://flurry-app.vercel.app/",
                    tag: `flurry_group_${Date.now()}`,
                    renotify: true
                },
                fcm_options: {
                    link: "https://flurry-app.vercel.app/"
                }
            },

            data: { ...stringifiedData, click_action: "/" },
            tokens: allTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);

    } catch (error) {
        console.error("🔥 [Group Push] Error:", error.message);
    }
};
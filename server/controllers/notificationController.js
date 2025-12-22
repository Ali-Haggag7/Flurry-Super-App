import expressAsyncHandler from "express-async-handler";
import Notification from "../models/Notification.js";

/**----------------------------------------------
 * @desc Get User Notifications (With Pagination)
 * @route /api/notifications
 * @method GET
 * @access Private
--------------------------------------------------*/
export const getUserNotifications = expressAsyncHandler(async (req, res) => {
    // 1. ✅ بنستخدم الـ _id بتاع مونجو (الميدلوير جهزه)
    const userId = req.user._id;

    // (إضافة 1: Pagination) 📄
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        // 👇👇 التعديل المهم هنا 👇👇
        // غيرنا "sender" لـ "from_user" عشان الفرونت إند مستني الاسم ده
        .populate("sender", "full_name username profile_picture")
        .populate("post", "content image")
        .populate("commentId", "text")
        .lean();

    // بنعلم عليهم إنهم "اتقروا"
    const notificationIds = notifications.map(n => n._id);

    if (notificationIds.length > 0) {
        await Notification.updateMany(
            { _id: { $in: notificationIds }, read: false },
            { read: true }
        );
    }

    res.status(200).json({
        success: true,
        notifications,
        hasMore: notifications.length === limit
    });
});

/**----------------------------------------------
 * @desc Get Unread Notification Count (For the Badge 🔴)
 * @route /api/notifications/unread-count
 * @method GET
 * @access Private
--------------------------------------------------*/
export const getUnreadCount = expressAsyncHandler(async (req, res) => {
    const { userId } = req.auth();

    // كويري سريع جداً بيرجع رقم بس
    const count = await Notification.countDocuments({
        recipient: userId,
        read: false
    });

    res.status(200).json({
        success: true,
        count
    });
});

/**----------------------------------------------
 * @desc Delete A Notification
 * @route /api/notifications/:id
 * @method DELETE
 * @access Private
--------------------------------------------------*/
export const deleteNotification = expressAsyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    // (Security) تأكد إن الإشعار ده بتاعي أنا
    if (notification.recipient.toString() !== userId) {
        res.status(403);
        throw new Error("Not authorized to delete this notification");
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "Notification deleted"
    });
});

/**
 * (Internal Helper) - زي ما هي
 */
export const createNotification = async ({ recipient, sender, type, post, commentId }) => {
    try {
        if (recipient.toString() === sender.toString()) return;

        // (تحسين بسيط) - منع التكرار لكل الأنواع مش بس اللايك
        // مثلاً لو عمل فولو ورجع شال الفولو وعمل فولو تاني بسرعة
        const existing = await Notification.findOne({ recipient, sender, type, post, commentId });
        if (existing) return;

        await Notification.create({
            recipient,
            sender,
            type,
            post,
            commentId
        });
    } catch (error) {
        console.error("Notification Error:", error);
    }
};
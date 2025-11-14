import expressAsyncHandler from "express-async-handler";
import Connection from "../models/Connection.js";
import { inngest } from "../inngest/index.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**----------------------------------------------
 * @desc Send Connection Request
 * @route /api/connection/send
 * @method POST
 * @access Private
--------------------------------------------------*/
export const sendConnectionRequest = expressAsyncHandler(async (req, res) => {
    const { userId } = req.auth(); // اليوزر اللي بيبعت
    const { id: toUserId } = req.body; // اليوزر اللي هيستقبل (غيرت اسمه عشان يبقى أوضح)

    // --- (تحسين 1) ---
    // منع اليوزر يبعت طلب لنفسه
    if (userId === toUserId) {
        return res.status(400).json({ success: false, message: "You cannot send a connection request to yourself." });
    }

    // --- (تحسين 2) ---
    // تصليح لوجيك الـ Rate Limit الخطير
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. استخدمنا Connection.find (مش User.Connections)
    // 2. ضفنا شرط "من" اليوزر ده بس
    const sentRequestsCount = await Connection.countDocuments({
        from_user_id: userId,
        createdAt: { $gte: last24Hours },
    });

    if (sentRequestsCount >= 20) {
        // الرسالة دي صح، بس الكويري فوق هي اللي اتصلحت
        return res.status(429).json({ success: false, message: "You can't send more than 20 connection requests per day." });
        // ملحوظة: 429 (Too Many Requests) هو الـ status code الأنسب هنا
    }

    // --- (تحسين 3) ---
    // تصليح لوجيك البحث عن اتصال سابق
    const existingConnection = await Connection.findOne({
        $or: [
            // هل A بعت لـ B ؟
            { from_user_id: userId, to_user_id: toUserId },
            // هل B بعت لـ A ؟
            { from_user_id: toUserId, to_user_id: userId },
        ],
    });

    // لو فيه اتصال موجود فعلاً
    if (existingConnection) {
        // --- (تحسين 4) ---
        // تصليح الرسالة والـ status
        if (existingConnection.status === "accepted") {
            return res.status(400).json({ success: false, message: "You are already connected." });
        }

        // لو الطلب لسه معلق (pending) أو حتى (rejected)
        // ممكن نعتبره "pending" وخلاص عشان اليوزر ميبعتش تاني
        return res.status(200).json({ success: true, message: "Connection request is already pending." });
    }

    // --- سيناريو: مفيش أي اتصال سابق (أفضل سيناريو) ---
    // اعمل كونكشن جديد
    const newConnection = await Connection.create({
        from_user_id: userId,
        to_user_id: toUserId,
        // (يفضل) الموديل بتاعك يكون فيه "status" افتراضي قيمته "pending"
    });

    // ابعت الإيفنت لـ inngest عشان الإشعار
    await inngest.send({
        name: "app/connection-requested",
        data: { connectionId: newConnection._id },
    });

    // رجع نجاح
    return res.status(201).json({ success: true, message: "Connection request sent successfully" });
});


/**----------------------------------------------
 * @desc Get User Connections
 * @route /api/connection/get
 * @method GET
 * @access Private
--------------------------------------------------*/
export const getUserConnections = expressAsyncHandler(async (req, res) => {
    const { userId } = req.auth();

    // (تحسين 1) - هنحدد الداتا اللي محتاجينها بس من اليوزر
    // ده بيخلي الـ populate أسرع مليون مرة
    const selectOptions = 'full_name username profile_picture';

    // (تصليح 2) - هننفذ الكويري الأول (بتاع اليوزر)
    const user = await User.findById(userId)
        .populate("connections", selectOptions) // هات صحابي (بس بالداتا دي)
        .populate("followers", selectOptions)   // هات متابعيني (بس بالداتا دي)
        .populate("following", selectOptions);  // هات اللي بتابعهم (بس بالداتا دي)

    // لازم نتأكد إن اليوزر موجود أصلاً
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // (تصليح 3) - تصليح الكويري بتاع الـ pending
    // 1. find(...) -> 2. populate(...) -> 3. await (في الآخر)
    const pendingConnectionDocs = await Connection.find({
        to_user_id: userId,
        status: "pending"
    })
        .populate("from_user_id", selectOptions); // اعمل populate لليوزر اللي "بعت" الطلب

    // (تحسين 2) - الداتا اللي راجعة فوق هي "دوكيومنت الكونكشن" كله
    // إحنا عايزين لستة "اليوزرز" بس، عشان الداتا تبقى زي بقية اللستات
    const pendingConnections = pendingConnectionDocs.map(connection => connection.from_user_id);

    // (تصليح 4) - نبعت رد واحد بس (res.json) فيه كل حاجة
    res.json({
        success: true,
        connections: user.connections,
        followers: user.followers,
        following: user.following,
        pendingConnections // دي دلوقتي لستة يوزرز زي الباقيين
    });
});


/**----------------------------------------------
 * @desc Accept Connection Request
 * @route /api/connection/accept
 * @method POST
 * @access Private
--------------------------------------------------*/
export const acceptConnection = expressAsyncHandler(async (req, res) => {
    // (تصليح 1) - هنفترض إنها دالة
    const { userId } = req.auth(); // "أنا" (اللي بقبل)
    const { id: senderId } = req.body; // "هو" (اللي بعت) - غيرت اسمه عشان يبقى أوضح

    // (تصليح 2) - تصليح الكويري
    const connection = await Connection.findOne({
        from_user_id: senderId, // اللي بعت
        to_user_id: userId      // اللي استقبل (أنا)
    });

    // (تصليح 3) - التحقق من الطلب
    if (!connection) {
        return res.status(404).json({ success: false, message: "Connection request not found." });
    }

    if (connection.status === "accepted") {
        return res.status(400).json({ success: false, message: "You are already connected." });
    }

    if (connection.status !== "pending") {
        return res.status(400).json({ success: false, message: "This connection request cannot be accepted." });
    }

    // (تصليح 4) - هنا الشغل الصح (Transaction)
    // بنبدأ "سيشن" عشان نربط العمليات ببعض
    const session = await mongoose.startSession();

    try {
        // بنبدأ الترانزكشن
        session.startTransaction();

        // العملية 1: إضافة "هو" (senderId) إلى لستة "أنا" (userId)
        await User.findByIdAndUpdate(
            userId,
            { $push: { connections: senderId } }, // استخدم $push عشان تضيف في المصفوفة
            { session } // لازم نمرر السيشن
        );

        // العملية 2: إضافة "أنا" (userId) إلى لستة "هو" (senderId)
        await User.findByIdAndUpdate(
            senderId,
            { $push: { connections: userId } },
            { session } // لازم نمرر السيشن
        );

        // العملية 3: تحديث حالة طلب الكونكشن
        connection.status = "accepted";
        await connection.save({ session }); // لازم نمرر السيشن

        // لو كل اللي فوق نجح، "نفذ" التغييرات دي كلها في الداتابيز
        await session.commitTransaction();

        res.json({ success: true, message: "Connection accepted successfully" });

    } catch (error) {
        // لو أي عملية من التلاتة اللي فوق فشلت، "الغي" كله
        await session.abortTransaction();

        // ارمي الإيرور عشان الـ expressAsyncHandler يمسكه
        throw new Error(`Failed to accept connection: ${error.message}`);

    } finally {
        // في كل الأحوال (نجحت أو فشلت)، اقفل السيشن
        session.endSession();
    }
});
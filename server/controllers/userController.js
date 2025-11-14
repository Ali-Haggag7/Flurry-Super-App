import expressAsyncHandler from "express-async-handler";
import User from "../models/User.js";
import imagekit from "../configs/imagekit.js";


/**----------------------------------------------
 * @desc (دي الفانكشن اللي هتحل المشكلة)
 * @desc مزامنة اليوزر (أول مرة لوج إن)
 * @route /api/user/sync
 * @method POST
 * @access Private (محمي بتوكن)
--------------------------------------------------*/
export const syncUser = expressAsyncHandler(async (req, res) => {
    // 1. هنجيب الـ ID اللي "البواب" (protect) جهزه
    const { id: userId } = req.user;

    // 2. هندور في الداتا بيز بتاعتنا (Mongo)
    let user = await User.findById(userId);

    // 3. لو لقيناه (اليوزر ده عمل مزامنة قبل كده)
    if (user) {
        // رجع بياناته وخلاص
        return res.status(200).json({ success: true, data: user, message: "User already synced" });
    }

    // 4. لو ملقنهوش (ده أول مرة يدخل)
    // هناخد بياناته اللي الريأكت بعتهلنا
    const { email, fullName, username, profilePicture } = req.body;

    // 5. هنتأكد إن البيانات الأساسية جاية
    if (!email || !fullName || !username) {
        res.status(400); // 400 = Bad Request
        throw new Error("Missing required user information for sync");
    }

    // 6. هنخلق اليوزر الجديد في "الداتا بيز بتاعتنا"
    // (بنفس الـ _id بتاع Clerk)
    user = new User({
        _id: userId, // <-- أهم حتة
        email: email,
        full_name: fullName,
        username: username  || "Ali",
        profile_picture: profilePicture || "" // لو مفيش صورة بروفايل في Clerk
    });

    // 7. نحفظ اليوزر الجديد
    await user.save();

    // 8. نرجعه للفرونت إند (201 = Created)
    res.status(201).json({ success: true, data: user, message: "User synced successfully" });
});


/**----------------------------------------------
 * @desc Get Logged-In User's Data
 * @route /api/user/me  (ده الاسم المتعارف عليه للرابط ده)
 * @method GET
 * @access Private (محمي - لازم توكن)
--------------------------------------------------*/
export const getUserData = expressAsyncHandler(async (req, res) => {

    // 1. (!! التعديل الأهم !!)
    // إحنا هنا بنثق في "البواب" (protect)
    // ومش بننادي req.auth() تاني.
    // اليوزر ID جاهز في req.user اللي البواب سلمهولنا
    const userId = req.user.id; // <--- الكراش اتصلح هنا

    // 3. بندور على اليوزر في الداتا بيز بالـ ID
    // .select("-password") عشان نرجع بياناته من غير الباسورد
    const user = await User.findById(userId).select("-password");

    // 4. (ده التشيك المنطقي الصح)
    // بنتأكد إننا *لقينا* اليوزر في الداتا بيز
    // (ممكن يكون التوكن سليم بس اليوزر اتمسح من الداتا بيز)
    if (!user) {
        // res.status(404) معناها "Not Found"
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // 5. لو لقينا اليوزر، بنرجعه
    return res.status(200).json({ success: true, data: user });

    // 6. مش محتاجين try...catch
    // لو أي إيرور حصل (زي الداتا بيز فصلت)، 
    // expressAsyncHandler هيمسكه ويبعته للـ Error Handler بتاعك
})


/**----------------------------------------------
 * @desc Update Logged-in User's Data
 * @route /api/user/update-profile (ده اسم منطقي أكتر)
 * @method PUT
 * @access Private (محمي بتوكن، عشان req.auth)
--------------------------------------------------*/
export const updateUserData = expressAsyncHandler(async (req, res) => {

    // 1. هنجيب اليوزر من الـ req.auth() زي ما إنت عامل
    // (أو من req.user.id لو بتستخدم "البواب" اللي عملناه قبل كده)
    const { userId } = req.auth();

    // 2. (!! التعديل الأهم !!)
    // هنستخدم "let" بدل "const" عشان نقدر نغير قيمة اليوزرنيم
    let { username, bio, location, full_name } = req.body;

    // 3. هنتأكد إن اليوزرنيم مش متاخد (لو اليوزر بيغيره)
    if (username) {
        const tempUser = await User.findById(userId);
        if (tempUser.username !== username) {
            // اليوزر بيغير اسمه، نتأكد إن الاسم الجديد مش متاخد
            const userExists = await User.findOne({ username });
            if (userExists) {
                // لو متاخد، هنرجع إيرور
                res.status(400); // 400 = Bad Request
                throw new Error("Username is already taken");
                // (أحسن ما نرجعله اسمه القديم من غير ما يعرف)
            }
        }
    }

    // 4. هنجهز البيانات الجديدة (مبدئياً)
    // هنستخدم "..." (spread operator) عشان نفلتر أي حاجة فاضية
    // ده بيضيف "username" للـ object بس لو "username" مش فاضي
    const updatedData = {
        ...(username && { username }),
        ...(bio && { bio }),
        ...(location && { location }),
        ...(full_name && { full_name }),
    };

    // 5. هنتعامل مع "ملف" صورة البروفايل (لو موجود)
    if (req.files && req.files.profile && req.files.profile[0]) {
        const profile = req.files.profile[0];

        // 6. (!! التعديل الأهم !!)
        // هنقرأ من الـ "buffer" (الذاكرة) مش من "fs" (الهارد)
        const result = await imagekit.upload({
            file: profile.buffer, // <--- من الذاكرة
            fileName: profile.originalname, // <--- الاسم الأصلي للملف (صلحنا الكراش)
        });

        // 7. (!! تصليح الـ Transformation !!)
        const url = imagekit.url({
            path: result.filePath,
            transformation: [
                { format: "webp" }, // <--- دي "صيغة"
                { width: 512 },    // <--- ده "عرض"
                { quality: "auto" } // <--- دي "جودة"
            ]
        });
        updatedData.profile_picture = url; // نضيف الرابط للداتا
    }

    // 8. هنتعامل مع "ملف" صورة الكافر (لو موجود)
    if (req.files && req.files.cover && req.files.cover[0]) {
        const cover = req.files.cover[0];

        const result = await imagekit.upload({
            file: cover.buffer, // <--- من الذاكرة
            fileName: cover.originalname,
        });

        const url = imagekit.url({
            path: result.filePath,
            transformation: [
                { format: "webp" }, // <--- صيغة
                { width: 1280 },   // <--- عرض
                { quality: "auto" } // <--- جودة
            ]
        });
        updatedData.cover_photo = url; // نضيف الرابط للداتا
    }

    // 9. نحدث الداتا بيز مرة واحدة بكل البيانات
    // .select("-password") عشان منرجعش الباسورد لليوزر
    const user = await User.findByIdAndUpdate(userId, updatedData, { new: true }).select("-password");

    if (user) {
        return res.status(200).json({ success: true, data: user, message: "User updated successfully" });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});


/**----------------------------------------------
 * @desc Search For Users (ده وصف أدق)
 * @route /api/user/search
 * @method GET (ده الصح للبحث)
 * @access Private (لأنه بيعتمد على اليوزر اللي مسجل)
--------------------------------------------------*/
export const discoverUsers = expressAsyncHandler(async (req, res) => {

    // 1. (!! تصليح GET vs POST !!)
    // البحث بييجي في الرابط (query) مش في الـ (body)
    const { input } = req.query;

    // 2. (!! تصليح مشكلة input الفاضي !!)
    // لو اليوزر مبحثش عن حاجة (input فاضي)، نرجع قايمة فاضية
    // أحسن ما نرجعله كل اليوزرز في الداتا بيز
    if (!input || input.trim() === "") {
        return res.json({ success: true, users: [] });
    }

    // 3. (!! تصليح Public vs Private !!)
    // هنجيب اليوزر اللي مسجل عشان نستبعده هو واللي عاملهم بلوك
    // (ده معناه إن "البواب" بتاعنا "project" لازم يشتغل قبل الروت ده)
    const { userId } = req.user.id; // أو req.auth() زي ما إنت عامل، بس دي أنضف

    // 4. هنجيب قايمة البلوك (زي ما هي، ممتازة)
    const currentUser = await User.findById(userId).select("blockUsers");
    const blockedByMe = currentUser?.blockedUsers?.map(String) || [];

    // 5. القايمة السودة (زي ما هي، ممتازة)
    const excludedIds = [...blockedByMe, userId];

    // 6. هنعمل "تعبير البحث" (Regex) مرة واحدة بس
    const searchRegex = new RegExp(input, "i");

    // 7. (!! تحسين بسيط !!)
    // شيلنا البحث بالإيميل عشان الخصوصية
    // (مش حلو إن أي حد يقدر يدور على اليوزرز بالإيميل)
    const users = await User.find({
        $and: [
            {
                $or: [
                    { username: searchRegex },
                    { full_name: searchRegex },
                    { location: searchRegex },
                ],
            },
            {
                _id: { $nin: excludedIds }, // استبعدني أنا واللي عملتلهم بلوك
            },
        ],
    })
        .select("_id full_name username profile_picture bio location") // هنجيب بس البيانات دي
        .limit(20); // (!! إضافة مهمة !!) هنحط "حد أقصى" 20 يوزر عشان منرجعش مليون نتيجة

    // 8. نرجع اليوزرز اللي لقيناهم
    res.json({ success: true, users });
});


/**----------------------------------------------
 * @desc Follow User
 * @route /api/user/follow
 * @method POST
 * @access Private
--------------------------------------------------*/
export const followUser = expressAsyncHandler(async (req, res) => {

    // 1. هنجيب "أنا" (اللي داس فولو) و "هو" (اللي هيتعمله فولو)
    const { userId } = req.auth(); // (ده "أنا")
    const { id: userToFollowId } = req.body; // (ده "هو"، غيرت اسمه عشان يبقى أوضح)

    // 2. (!! تصليح خطأ 1: اليوزر مينفعش يتابع نفسه !!)
    if (userToFollowId === userId) {
        res.status(400); // 400 = Bad Request
        throw new Error("You cannot follow yourself");
    }

    // 3. (!! تحسين خطأ 2 و 3: هنستخدم $addToSet و Promise.all !!)
    // $addToSet: دي معناها "ضيف الـ ID ده للقايمة، بس لو هو مش موجود فيها أصلا"
    // ده بيغنينا عن الـ .includes() check اللي كان في الكود القديم
    // Promise.all: بتخلينا نعمل العمليتين في نفس الوقت (أسرع)

    const [user, toUser] = await Promise.all([  // دي بتنفذ الامرين في نفس الوقت promiseال
        // ضيف اليوزر (userToFollowId) لقايمة الـ "following" بتاعتي
        User.findByIdAndUpdate(
            userId,
            { $addToSet: { following: userToFollowId } },
            { new: true } // {new: true} عشان يرجع الداتا الجديدة بعد التحديث
        ),
        // ضيف (userId) بتاعي لقايمة الـ "followers" بتاعته
        User.findByIdAndUpdate(
            userToFollowId,
            { $addToSet: { followers: userId } },
            { new: true }
        )
    ]);

    // 4. نتأكد إن اليوزرز موجودين (لو حد بعت ID غلط)
    if (!user || !toUser) {
        res.status(404);
        throw new Error("User not found");
    }

    // 5. نرجع رسالة نجاح
    // (ملحوظة: لو اليوزر كان عامل فولو أصلاً، الكود ده $addToSet هيشتغل ومش هيعمل حاجة
    // فممكن ترجع رسالة "Already following" لو عايز، بس دي تفصيلة)
    res.json({ success: true, message: "Now You Are Following This User" });
});


/**----------------------------------------------
 * @desc Unfollow User
 * @route /api/user/unfollow
 * @method POST
 * @access Private
--------------------------------------------------*/
export const unfollowUser = expressAsyncHandler(async (req, res) => {

    // 1. هنجيب "أنا" (اللي داس unfollow) و "هو" (اللي هيتعمله unfollow)
    const { userId } = req.auth(); // (ده "أنا")
    const { id: userToUnfollowId } = req.body; // (ده "هو"، غيرت اسمه عشان يبقى أوضح)

    // 2. (!! تصليح خطأ 1: اليوزر مينفعش يلغي متابعة نفسه !!)
    if (userToUnfollowId === userId) {
        res.status(400); // 400 = Bad Request
        throw new Error("You cannot unfollow yourself");
    }

    // 3. (!! تحسين خطأ 2 و 3: هنستخدم $pull و Promise.all !!)
    // $pull: دي معناها "روح للقايمة دي وشيل منها القيمة دي"
    // Promise.all: بتخلينا نعمل العمليتين في نفس الوقت (أسرع وآمن)

    const [user, toUser] = await Promise.all([
        // شيل (userToUnfollowId) من قايمة الـ "following" بتاعتي
        User.findByIdAndUpdate(
            userId,
            { $pull: { following: userToUnfollowId } },
            { new: true } // {new: true} عشان يرجع الداتا الجديدة بعد التحديث
        ),
        // شيل (userId) بتاعي من قايمة الـ "followers" بتاعته
        User.findByIdAndUpdate(
            userToUnfollowId,
            { $pull: { followers: userId } },
            { new: true }
        )
    ]);

    // 4. نتأكد إن اليوزرز موجودين (لو حد بعت ID غلط)
    // (ده نفس التشيك بتاع المرة اللي فاتت، ومكانه صح)
    if (!user || !toUser) {
        res.status(404);
        throw new Error("User not found");
    }

    // 5. نرجع رسالة نجاح
    res.json({ success: true, message: "You Are No Longer Following This User" });
});
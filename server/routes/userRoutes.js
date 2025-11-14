import express from "express";

// 1. "البواب" بتاعنا (بيحمي الروابط)
// (اتأكد إن الاسم `protect` صح زي ما إنت كاتبه)
import { protect } from "../middlewares/auth.js";

// 2. "مستلم الصور" (بيستلم الصور من اليوزر)
// (اتأكد إن المسار `../configs/multer.js` صح)
import upload from "../configs/multer.js";

// 3. "المديرين" (الفانكشنز اللي هتشتغل)
// (هنضيف كل الفانكشنز اللي عملناها قبل كده)
import {
    getUserData,
    updateUserData,
    discoverUsers,
    followUser,
    unfollowUser,
    syncUser
} from "../controllers/userController.js";

// 4. بننشئ الراوتر بتاعنا
const userRouter = express.Router();


// ============= (الروابط بتاعتنا) =============

// 2. (!! ده الروت الجديد الأهم !!)
// @desc مزامنة اليوزر (خلقه في الداتا بيز لو مش موجود)
// @route /api/user/sync
// @method POST
// @access Private
userRouter.post("/sync", protect, syncUser);

// 1. رابط عشان أجيب بياناتي (بتاعك سليم)
// GET /api/user/me
userRouter.get("/me", protect, getUserData);

// 2. رابط عشان أعدل بياناتي (ده اللي كان ناقص)
// (هنستخدم "PUT" عشان ده "تعديل")
// PUT /api/user/update-profile
userRouter.put(
    "/update-profile",
    protect, // (أولاً) البواب يتأكد إني مسجل

    // (ثانياً) مستلم الصور يستلم الملفات دي (profile و cover)
    // (ده هيقرأ الصور ويحطها في req.files)
    upload.fields([
        { name: "profile", maxCount: 1 },
        { name: "cover", maxCount: 1 }
    ]),

    updateUserData // (ثالثاً) المدير يشتغل ويعدل الداتا
);

// 3. رابط البحث عن اليوزرز (اللي عملناه)
// (GET ومعتمد على req.query)
// GET /api/user/search?input=ali
userRouter.get("/search", protect, discoverUsers);

// 4. رابط الفولو
// (POST عشان بننشئ "علاقة" جديدة)
// POST /api/user/follow
userRouter.post("/follow", protect, followUser);

// 5. رابط إلغاء الفولو
// (POST أو PUT أو حتى DELETE ينفعوا، خلينا POST)
// POST /api/user/unfollow
userRouter.post("/unfollow", protect, unfollowUser);


// 6. بنصدّر الراوتر عشان server.js يستخدمه
export default userRouter;
import express from "express";

// 1. استيراد البوابين (الصارم والمتساهل)
// 👇👇 استوردنا verifyToken هنا 👇👇
import { protect, verifyToken } from "../middlewares/auth.js";

import upload from "../configs/multer.js";

import {
    getUserData,
    updateUserData,
    discoverUsers,
    followUser,
    unfollowUser,
    syncUser
} from "../controllers/userController.js";

const userRouter = express.Router();


// ============= (الروابط بتاعتنا) =============

// 2. (!! التعديل هنا !!)
// استخدمنا verifyToken بدل protect
// عشان يسمح لليوزر الجديد يدخل ويتسجل في الداتابيز
// POST /api/user/sync
userRouter.post("/sync", verifyToken, syncUser);  // 👈👈 التغيير هنا

// باقي الراوتات زي ما هي (تستخدم protect الصارم)
// GET /api/user/me
userRouter.get("/me", protect, getUserData);

// PUT /api/user/update-profile
userRouter.put(
    "/update-profile",
    protect,
    upload.fields([
        { name: "profile", maxCount: 1 },
        { name: "cover", maxCount: 1 }
    ]),
    updateUserData
);

// GET /api/user/search
userRouter.get("/search", protect, discoverUsers);

// POST /api/user/follow
userRouter.post("/follow", protect, followUser);

// POST /api/user/unfollow
userRouter.post("/unfollow", protect, unfollowUser);

export default userRouter;
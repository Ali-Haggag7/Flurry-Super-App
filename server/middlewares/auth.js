import expressAsyncHandler from "express-async-handler";
import User from "../models/User.js";

// 1. (البواب الصارم) 👮‍♂️
// ده بيستخدم لباقي الموقع (لازم تكون مسجل وعندك داتا في المونجو)
export const protect = expressAsyncHandler(async (req, res, next) => {
    const { userId } = req.auth();

    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized, no token")
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
        res.status(401);
        throw new Error("User not found in database (Sync Error)");
    }

    req.user = user;
    next();
});

// 2. (البواب المتساهل) 🎫
// ده هنستخدمه للـ Sync بس (يتأكد إنك جاي من Clerk، بس مش شرط تكون في الداتابيز لسه)
export const verifyToken = expressAsyncHandler(async (req, res, next) => {
    // 1. هات الـ Clerk ID
    const { userId } = req.auth();

    // 2. لو مفيش ID يبقى أنت مش مسجل أصلاً في Clerk
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized, no Clerk token");
    }

    // 3. عدي يا بطل (مش هندور في الداتابيز، الكنترولر هو اللي هيتصرف)
    next();
});
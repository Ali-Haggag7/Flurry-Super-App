// ده ملف middlewares/auth.js (أو protect.js)

// 1. هنجيب express-async-handler عشان الكود يبقى أنضف
import expressAsyncHandler from "express-async-handler";

/**----------------------------------------------
 * @desc "البواب" اللي بيتأكد من التوكن
 * @route (بيشتغل قبل أي راوت محمي)
 * @method Middleware
 * @access Private
--------------------------------------------------*/
export const protect = expressAsyncHandler(async (req, res, next) => {

    // 1. هنتأكد من اليوزر (زي ما الكود القديم كان بيعمل)
    const { userId } = await req.auth();

    // 2. لو مفيش يوزر (التوكن بايظ أو منتهي)
    if (!userId) {
        res.status(401); // 401 = Unauthorized
        throw new Error("Unauthorized, token failed");
    }

    // 3. (!! التعديل الأهم !!)
    // لو اليوزر سليم، هنحط الـ ID بتاعه في الـ "request" 
    // عشان "المدير" (الكنترولر) اللي جاي بعده يستخدمه
    req.user = {
        id: userId
    };

    // 4. نفتح الباب ونعدي الطلب للـ "controller"
    next();

    // (مش محتاجين try...catch عشان expressAsyncHandler)
});
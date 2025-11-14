// (!! التعديل 1: dotenv.config() لازم تكون أول حاجة !!)
import dotenv from "dotenv";
dotenv.config();

// --- باقي الاستدعاءات ---
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import userRoutes from "./routes/userRoutes.js";
import connectionRouter from "./routes/connectionRoutes.js";

// إنشاء السيرفر
const app = express();

// --- Middlewares (الترتيب هنا مهم) ---

// 1. CORS: عشان نسمح للمواقع الخارجية (الفرونت إند) تكلمنا
app.use(cors({ origin: "*" })); // ممكن تخليه * أو تحط رابط الفرونت إند

// 2. JSON Parser: عشان السيرفر يفهم req.body
app.use(express.json());

// 3. (!! التعديل 2: Clerk Middleware مع استثناء !!)
// ده "البواب" بتاعنا. هيشتغل على "كل" الروابط اللي جاية
app.use(clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,

    // (!! الأهم !!)
    // لازم نقوله "يتجاهل" الروت بتاع Inngest
    // لإن ده سيرفر بيكلم سيرفر (Webhook) ومعهوش توكن يوزر
    skipRoutes: ["/api/inngest", "/"] // تجاهل Inngest والروت العام
}));


// --- Routes (الروابط) ---

// 4. رابط Inngest (سليم)
app.use("/api/inngest", serve({ client: inngest, functions }));

// 5. (سليم، وبقى محمي بـ Clerk أوتوماتيك)
app.use("/api/user", userRoutes);
app.use("/api/connection", connectionRouter);

// 6. رابط تجريبي عام (سليم)
app.get("/", (req, res) => {
    res.send("Server is running");
});

// 7. (إضافة) ماسك أخطاء عام (Global Error Handler)
// لو أي "async handler" رمى إيرور، ده هيمسكه
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong!'
    });
});


// --- تشغيل السيرفر ---
const port = process.env.PORT || 4000;

// (!! التعديل 3: أفضل ممارسة - نشغل السيرفر بعد الاتصال بالداتا بيز !!)
const startServer = async () => {
    try {
        // 1. اتصل بالداتا بيز الأول
        await connectDB();

        // 2. لو الاتصال نجح، شغل السيرفر
        app.listen(port, () => {
            console.log(`Server is running on port : ${port}`);
        });
    } catch (error) {
        // لو الاتصال بالداتا بيز فشل، اطبع الإيرور ومتشغلش السيرفر
        console.log("Failed to connect to DB, server is not starting.");
        console.log(error);
        process.exit(1);
    }
};

// نبدأ عملية التشغيل
startServer();
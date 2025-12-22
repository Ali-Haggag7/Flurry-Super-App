import express from 'express';
import { protect } from '../middlewares/auth.js';
import upload from '../configs/multer.js';
import {
    sendMessage,
    getChatMessages,
    getRecentMessages,
    sseController
} from '../controllers/messageController.js';

const messageRouter = express.Router();

// ==================================================
// 1. الـ Real-time (SSE Stream) 📡
// ==================================================

// فتح خط الاتصال المباشر
// (غيرنا المسار لـ /stream/:userId عشان يبقى أوضح ومنظم)
messageRouter.get("/stream/:userId", sseController);


// ==================================================
// 2. الروابط الثابتة (Static Routes) - لازم في الأول ⚠️
// ==================================================

// جلب قائمة المحادثات (آخر الرسايل)
// (تصليح 1: خليناها GET لأننا بنجيب داتا مش بنبعت داتا)
messageRouter.get('/recent', protect, getRecentMessages);

// إرسال رسالة جديدة
// (تصليح 2: protect الأول "أمان"، وبعدين upload "أداء")
messageRouter.post('/send', protect, upload.single('image'), sendMessage);


// ==================================================
// 3. الروابط المتغيرة (Dynamic Routes)
// ==================================================

// جلب رسايل الشات بيني وبين شخص معين
// (تصليح 3: ضفنا :withUserId عشان الكنترولر يعرف احنا عايزين رسايل مين)
messageRouter.get('/chat/:withUserId', protect, getChatMessages);


// 4. التصدير
export default messageRouter;
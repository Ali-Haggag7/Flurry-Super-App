import express from 'express';
import { protect } from '../middlewares/auth.js';
import upload from '../configs/multer.js';
import {
    addCommentToPost,
    addPost,
    deletePost,      // (جديد)
    updatePost,      // (جديد)
    getPostById,
    getPostsFeed,
    getUserById,
    likeUnlikePost,
    deleteComment,   // (جديد)
    toggleCommentLike // (جديد)
} from '../controllers/postController.js';

const postRouter = express.Router();

// ==================================================
// 1. الروابط الثابتة (Static Routes) - لازم في الأول ⚠️
// ==================================================

// إضافة بوست جديد (صور + كلام)
postRouter.post('/add', protect, upload.array('images', 5), addPost);

// جلب الـ Feed (الصفحة الرئيسية)
postRouter.get('/feed', protect, getPostsFeed);


// ==================================================
// 2. روابط التفاعل (Interactions)
// ==================================================

// لايك / ديسلايك للبوست
// 1. غيرنا .post لـ .put عشان تطابق الفرونت إند
// 2. غيرنا :postId لـ :id عشان تطابق الكنترولر
postRouter.put("/like/:id", protect, likeUnlikePost);

// إضافة كومنت
postRouter.post("/comment/:postId", protect, addCommentToPost);

// مسح كومنت
// (الرابط ده بيحتاج ID الكومنت نفسه)
postRouter.delete("/comment/:commentId", protect, deleteComment);

// لايك للكومنت
postRouter.post("/comment/like/:commentId", protect, toggleCommentLike);


// ==================================================
// 3. روابط اليوزر والبوستات (Dynamic Routes)
// ==================================================

// بروفايل يوزر معين وبوستاته
// (صلحنا الاسم لـ :userId عشان يطابق الكنترولر)
postRouter.get("/user/:userId", protect, getUserById); // خليناها protect للأمان، لو عايزها public شيل الـ protect

// --- عمليات البوست الواحد (CRUD) ---

// جلب بوست واحد (للتفاصيل)
postRouter.get("/:id", protect, getPostById);

// تعديل بوست
postRouter.put("/:id", protect, updatePost);

// مسح بوست
postRouter.delete("/:id", protect, deletePost);


// 4. التصدير
export default postRouter;
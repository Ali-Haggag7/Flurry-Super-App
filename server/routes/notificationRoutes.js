import express from 'express';
import { protect } from '../middlewares/auth.js';
import {
    getUserNotifications,
    getUnreadCount,      // (جديد)
    deleteNotification   // (جديد)
} from '../controllers/notificationController.js';

const notificationRouter = express.Router();

// 1. جلب العداد (عشان يتحط فوق الجرس في الـ Navbar)
// (لازم ييجي قبل الـ /:id عشان ميتفهمش غلط)
notificationRouter.get('/unread-count', protect, getUnreadCount);

// 2. جلب الإشعارات (القائمة)
notificationRouter.get('/', protect, getUserNotifications);

// 3. مسح إشعار
notificationRouter.delete('/:id', protect, deleteNotification);

export default notificationRouter;
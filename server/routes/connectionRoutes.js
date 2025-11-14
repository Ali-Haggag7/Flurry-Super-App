// ===========================================
// ملف: /routes/connectionRoutes.js
// ===========================================

import express from "express";

// 1. "البواب" بتاعنا (بيحمي الروابط)
// (هنجيب نفس البواب بتاع اليوزر)
import { protect } from "../middlewares/auth.js";

// 2. "المديرين" (الفانكشنز اللي هتشتغل)
// (هنجيب المديرين الجداد بتوع الكونكشن)
import {
    sendConnectionRequest,
    getUserConnections,
    acceptConnection
} from "../controllers/connectionController.js";

// 3. بننشئ الراوتر بتاعنا
const connectionRouter = express.Router();


// ============= (الروابط بتاعتنا) =============

// 1. رابط عشان "أبعت" طلب صداقة
// @desc Send Connection Request
// @route /api/connection/send
// @method POST
// @access Private
connectionRouter.post("/send", protect, sendConnectionRequest);

// 2. رابط عشان "أجيب" كل علاقاتي (مين صحابي، مين باعتلي، الخ)
// @desc Get User Connections
// @route /api/connection/get
// @method GET
// @access Private
connectionRouter.get("/get", protect, getUserConnections);

// 3. رابط عشان "أقبل" طلب صداقة
// @desc Accept Connection Request
// @route /api/connection/accept
// @method POST
// @access Private
connectionRouter.post("/accept", protect, acceptConnection);


// 4. بنصدّر الراوتر عشان server.js يستخدمه
export default connectionRouter;
import axios from "axios";

// 1. بنحدد رابط السيرفر الأساسي
// (في Vite بنجيب المتغيرات بـ import.meta.env)
// لو إنت شغال لوكال، الرابط هيكون http://localhost:4000/api
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// 2. بنكريت "نسخة" خاصة بينا من أكسيوس
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    // withCredentials: true // (فعل دي لو بتستخدم cookies، بس مع Clerk والتوكن مش ضروري أوي دلوقتي)
});

// 3. بنعمل "تصدير" للنسخة دي عشان نستخدمها في باقي الملفات
export default axiosInstance;
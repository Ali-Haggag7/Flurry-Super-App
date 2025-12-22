import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";  // thunk: ده "المندوب" اللي بياخد الموتوسيكل ويروح للسيرفر يجيب الداتا ويرجع. 
import axiosInstance from "../api/axios"; // السنترال اللي عملناه

// 1. الحالة الافتراضية لالتلاجة المبدئية
const initialState = {
    currentUser: null, // لسه مفيش زباين (يوزر)
    status: "idle",  // المندوب قاعد مبيعملش حاجة (idle)
    error: null,  // مفيش مشاكل لحد دلوقتي
};

// =========================================================
// 2. المندوبين (Thunks) - العمليات اللي بتكلم السيرفر
// =========================================================

// أ) مندوب المزامنة (بيكلم /api/user/sync)
export const syncUser = createAsyncThunk(
    "user/syncUser",
    async ({ userData, token }, { rejectWithValue }) => {
        try {
            // بنبعت الداتا والتوكن في الهيدر
            const response = await axiosInstance.post("/user/sync", userData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data.user; // دي الداتا اللي هتروح للمخزن
        } catch (error) {
            console.log(error);
            return rejectWithValue(error.response?.data?.message || "Sync failed");
        }
    }
);

// ب) مندوب جلب البيانات (بيكلم /api/user/me)
export const fetchUser = createAsyncThunk(
    "user/fetchUser",  // اسم المشوار (عشان المدير يعرف هو فين)
    async (token, { rejectWithValue }) => {
        try {
            // 1. المندوب ركب الموتوسيكل وراح السيرفر
            const response = await axiosInstance.get("/user/me", {
                headers: { Authorization: `Bearer ${token}` },  // مهم عشان السيرفر يعرف اليوزر مين
            });
            // 2. رجع بالبضاعة (البيانات)
            return response.data; // (ممكن تكون data.user حسب رد الباك إند)
        } catch (error) {
            // 3. الموتوسيكل عطل أو السيرفر قفل (رجع بمشكلة)
            return rejectWithValue(error.response?.data?.message || "Fetch failed");
        }
    }
);

// ج) مندوب التعديل (بيكلم /api/user/update-profile)
export const updateUser = createAsyncThunk(
    "user/updateUser",
    async ({ formData, token }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put("/user/update-profile", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data" // مهم عشان الصور
                },
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

// =========================================================
// 3. قسم اليوزر (Slice) - أمين المخزن
// =========================================================

// ده بقى "قلب" المطعم. ده المكان اللي بنعرف فيه الشيف هيتصرف إزاي مع كل حاجة بتحصل
const userSlice = createSlice({
    name: "user",  // اسم القسم (قسم اللحوم مثلاً)
    initialState,  // شكل التلاجة وهي فاضية
    reducers: {
        // (reducers العادية): دي الأوامر المباشرة اللي مش محتاجة خروج بره المطعم
        logout: (state) => {
            state.currentUser = null;  // الشيف رمى الداتا في الزبالة (نضف التلاجة)
            state.status = "idle";  // المندوب قاعد مبيعملش حاجة (idle)
            state.error = null;  // مفيش مشاكل
        },
    },
    // (extraReducers): دي التعليمات الخاصة بالمندوبين (Thunks)
    // الشيف بيقول: "لما المندوب فلان يرجع، أعمل إيه؟"
    extraReducers: (builder) => {
        builder
            // ----------------------------------------------------
            // الحالة الأولى: المندوب لسه خارج (Pending)
            // ----------------------------------------------------
            .addCase(syncUser.pending, (state) => {
                state.status = "loading";  // علق يافطة "جاري التحميل"
            })
            // ----------------------------------------------------
            // الحالة الثانية: المندوب رجع بالسلامة ومعاه البضاعة (Fulfilled)
            // ----------------------------------------------------
            .addCase(syncUser.fulfilled, (state, action) => {
                state.status = "succeeded";  // شيل اليافطة، العملية نجحت
                // (action.payload) دي الشنطة اللي المندوب راجع بيها
                state.currentUser = action.payload; // حط البضاعة جوه التلاجة
            })
            // ----------------------------------------------------
            // الحالة الثالثة: المندوب رجع يعيط (Rejected)
            // ----------------------------------------------------
            .addCase(syncUser.rejected, (state, action) => {
                state.status = "failed";  // شيل اليافطة، العملية فشلت
                state.error = action.payload;  // سجل سبب الفشل في الدفتر
            })

            // --- حالة Fetch User ---
            .addCase(fetchUser.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.currentUser = action.payload;
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })

            // --- حالة Update User ---
            .addCase(updateUser.pending, (state) => {
                state.status = "loading";
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.currentUser = action.payload; // البيانات الجديدة
            });
    },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
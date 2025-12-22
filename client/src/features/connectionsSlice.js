import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../api/axios";
import toast from "react-hot-toast";

// 1. التلاجة (Initial State) 🧊
const initialState = {
    connections: [],        // قايمة الأصدقاء الفعليين
    pendingRequests: [],    // الطلبات اللي جيالي (عشان أقبل أو أرفض)
    sentRequests: [],       // الطلبات اللي أنا بعتها (عشان أعمل Cancel لو حبيت)
    followers: [],          // الناس اللي متابعاني
    following: [],          // الناس اللي أنا متابعهم

    status: "idle",         // حالة التحميل العامة
    error: null,
};

// =========================================================
// 2. المندوبين (Thunks) 🛵
// =========================================================

// أ) مندوب جلب الأصدقاء والطلبات (Get My Network)
export const fetchMyConnections = createAsyncThunk(
    "connection/fetchMyConnections",
    async (token, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/connection", {
                headers: { Authorization: `Bearer ${token}` },
            });
            // بنرجع الداتا كلها (اصدقاء + طلبات)
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to load connections");
        }
    }
);

// ب) مندوب إرسال طلب صداقة (Send Request)
export const sendConnectionRequest = createAsyncThunk(
    "connection/sendRequest",
    async ({ targetUserId, token }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/connection/request/${targetUserId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Connection request sent!");
            return targetUserId; // بنرجع الـ ID عشان نحدث الواجهة
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request");
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

// ج) مندوب قبول الصداقة (Accept Request)
export const acceptConnectionRequest = createAsyncThunk(
    "connection/acceptRequest",
    async ({ requestId, token }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/connection/accept/${requestId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("You are now connected!");
            return requestId; // بنرجع رقم الطلب عشان نشيله من قايمة الانتظار
        } catch (error) {
            toast.error("Failed to accept request");
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

// د) مندوب البلوك (Block User)
export const blockUser = createAsyncThunk(
    "connection/blockUser",
    async ({ targetUserId, token }, { rejectWithValue }) => {
        try {
            await axiosInstance.post(`/connection/block/${targetUserId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("User blocked.");
            return targetUserId;
        } catch (error) {
            toast.error("Failed to block user");
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

// =========================================================
// 3. الشيف (Slice) 👨‍🍳
// =========================================================

const connectionSlice = createSlice({
    name: "connection",
    initialState,
    reducers: {
        // لو حبيت تفضي القوائم يدوياً (مثلاً عند الـ Logout)
        clearConnections: (state) => {
            state.connections = [];
            state.pendingRequests = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // --- Fetch Connections (لما نفتح صفحة Network) ---
            .addCase(fetchMyConnections.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchMyConnections.fulfilled, (state, action) => {
                state.status = "succeeded";
                // بنفترض إن الباك إند بيرجع { connections: [], requests: [] }
                // لو الباك إند بيرجعهم مفصولين، نظبط دول
                state.connections = action.payload.connections || [];
                state.pendingRequests = action.payload.requests || [];
                state.followers = action.payload.followers || [];
                state.following = action.payload.following || [];
            })
            .addCase(fetchMyConnections.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })

            // --- Send Request (لما ابعت طلب) ---
            .addCase(sendConnectionRequest.fulfilled, (state, action) => {
                // (Optimistic UI) ممكن نضيفه لقائمة sentRequests لو عايزين نعرضها
                state.sentRequests.push(action.payload);
            })

            // --- Accept Request (لما أقبل طلب) ---
            .addCase(acceptConnectionRequest.fulfilled, (state, action) => {
                // 1. شيل الطلب من قايمة الانتظار
                const requestId = action.payload;
                state.pendingRequests = state.pendingRequests.filter(req => req._id !== requestId);

                // 2. (اختياري) ممكن نضيفه لقايمة connections فوراً لو معانا بيانات اليوزر كاملة
                // بس الأسهل نعمل refetch للكونكشنز
            })

            // --- Block User (لما أعمل بلوك) ---
            .addCase(blockUser.fulfilled, (state, action) => {
                const blockedId = action.payload;
                // شيله من أصدقائي فوراً (عشان يختفي من قدامي)
                state.connections = state.connections.filter(c => c._id !== blockedId);
                state.following = state.following.filter(f => f._id !== blockedId);
                state.followers = state.followers.filter(f => f._id !== blockedId);
                // وكمان من الطلبات لو كان جالي طلب منه
                state.pendingRequests = state.pendingRequests.filter(req => req._id !== blockedId);
            });
    },
});

export const { clearConnections } = connectionSlice.actions;
export default connectionSlice.reducer;
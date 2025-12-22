import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../api/axios";
import toast from "react-hot-toast";

// 1. التلاجة (Initial State)
const initialState = {
    conversations: [],      // قايمة الناس اللي كلمتهم (Sidebar)
    activeChatMessages: [], // رسايل الشات اللي مفتوح قدامي دلوقتي
    status: "idle",         // حالة التحميل
    error: null,
};

// =========================================================
// 2. المندوبين (Thunks) 🛵
// =========================================================

// أ) مندوب جلب القائمة (بيكلم /api/message/recent)
export const fetchConversations = createAsyncThunk(
    "messages/fetchConversations",
    async (token, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/message/recent", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data.data; // (حسب الرد بتاع الباك إند: { success: true, data: [...] })
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to load chats");
        }
    }
);

// ب) مندوب جلب رسايل شات معين (بيكلم /api/message/chat/:id)
export const fetchChatMessages = createAsyncThunk(
    "messages/fetchChatMessages",
    async ({ withUserId, token }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/message/chat/${withUserId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data.data; // الرسايل
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to load messages");
        }
    }
);

// ج) مندوب إرسال رسالة (بيكلم /api/message/send)
export const sendMessage = createAsyncThunk(
    "messages/sendMessage",
    async ({ formData, token }, { rejectWithValue }) => {
        try {
            // formData عشان ممكن نبعت صورة
            const response = await axiosInstance.post("/message/send", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                },
            });
            return response.data.data; // الرسالة الجديدة اللي اتبعتت
        } catch (error) {
            toast.error("Failed to send message");
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

// =========================================================
// 3. الشيف (Slice) 👨‍🍳
// =========================================================

const messagesSlice = createSlice({
    name: "messages",
    initialState,
    reducers: {
        // (مهم جداً 🔥) أمر مباشر للشيف: "خد الرسالة دي حطها في الشات حالاً"
        // ده هنستخدمه لما يجيلنا إشعار SSE إن فيه رسالة وصلت
        addRealtimeMessage: (state, action) => {
            const newMessage = action.payload;
            // بنضيفها بس لو الشات المفتوح هو نفس الشات اللي جت منه الرسالة
            // (أو بنضيفها في كل الأحوال والفرونت يفلتر، بس الأفضل نضيفها هنا)
            state.activeChatMessages.push(newMessage);

            // وممكن كمان نحدث آخر رسالة في الـ conversations (تحدي للمحترفين 😉)
        },
        // تنظيف الشات لما أخرج منه
        clearActiveChat: (state) => {
            state.activeChatMessages = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // --- Fetch Conversations (القائمة) ---
            .addCase(fetchConversations.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.conversations = action.payload;
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })

            // --- Fetch Chat Messages (الرسايل) ---
            .addCase(fetchChatMessages.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchChatMessages.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.activeChatMessages = action.payload;
            })

            // --- Send Message (الإرسال) ---
            .addCase(sendMessage.fulfilled, (state, action) => {
                // لما الرسالة تتبعت بنجاح، ضيفها للشات قدامي فوراً
                state.activeChatMessages.push(action.payload);
            });
    },
});

export const { addRealtimeMessage, clearActiveChat } = messagesSlice.actions;
export default messagesSlice.reducer;
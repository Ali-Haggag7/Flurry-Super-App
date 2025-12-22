import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: { // مين اللي هيستلم الإشعار (صاحب البوست)
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true // (مهم للأداء)
    },
    sender: { // مين اللي عمل الفعل (اللي داس لايك)
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: { // نوع الإشعار
        type: String,
        enum: ["like", "comment", "reply", "follow"],
        required: true
    },
    post: { // البوست اللي حصل عليه الفعل (اختياري، لإن الـ follow ملوش بوست)
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    commentId: { // لو الإشعار يخص كومنت معين
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    read: { // هل اليوزر شاف الإشعار؟
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
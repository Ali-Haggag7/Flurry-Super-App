import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    // (تصليح 1 - أهم حاجة)
    sender_id: {
        type: mongoose.Schema.Types.ObjectId, // <--- ده التصليح
        ref: "User",
        required: true,
        index: true // (تصليح 2) - فهرس عشان السرعة
    },
    receiver_id: {
        type: mongoose.Schema.Types.ObjectId, // <--- ده التصليح
        ref: "User",
        required: true,
        index: true // (تصليح 2) - فهرس عشان السرعة
    },
    text: {
        type: String,
        trim: true
    },
    message_type: {
        type: String,
        enum: ["text", "image"],
        required: true // (تحسين) هنخليه مطلوب
    },
    media_url: {
        type: String
    },
    seen: {
        type: Boolean,
        default: false,
        index: true // (تحسين) فهرس عشان نسرع "عد" الرسايل اللي متقرتش
    }
}, {
    timestamps: true
});

// (تصليح 3 - التحقق المنطقي)
// هنتأكد إن الرسالة مش فاضية، وإن النوع ماشي مع المحتوى
messageSchema.pre("validate", function (next) {
    // لو النوع "text"
    if (this.message_type === "text") {
        // "و" مفيش كلام مكتوب (بعد الـ trim)
        if (!this.text || this.text.trim().length === 0) {
            next(new Error("Text message cannot be empty."));
        } else {
            // (تحسين) نتأكد إن مفيش صورة مبعوتة بالغلط
            this.media_url = undefined;
            next();
        }
    }
    // لو النوع "image"
    else if (this.message_type === "image") {
        // "و" مفيش لينك صورة
        if (!this.media_url) {
            next(new Error("Image message must have a media_url."));
        } else {
            // (تحسين) نتأكد إن مفيش كلام مكتوب بالغلط
            this.text = undefined;
            next();
        }
    }
    // لو النوع مش مظبوط
    else {
        next(new Error("Invalid message_type."));
    }
});


const Message = mongoose.model("Message", messageSchema);

export default Message;
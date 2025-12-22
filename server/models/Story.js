import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    // 1. صاحب الاستوري (أساسي)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true // عشان نجيب استوريهات يوزر معين بسرعة
    },

    // 2. المحتوى (للاستوري النصية أو وصف للصورة)
    content: {
        type: String,
        trim: true,
        default: ""
    },

    // 3. رابط الميديا (صورة أو فيديو)
    image: {
        type: String,
        default: ""
    },

    // 4. (إضافة) نوع الاستوري
    // عشان الفرونت إند يعرف يعرضها إزاي (يشغل فيديو ولا يعرض صورة)
    type: {
        type: String,
        enum: ["text", "image", "video"], // القيم المسموحة فقط
        default: "text",
        required: true
    },

    // 5. (إضافة) لون الخلفية
    // مهمة جداً للاستوري الـ "text" عشان شكلها ميبقاش أبيض سادة
    background_color: {
        type: String,
        default: "#000000" // أسود افتراضي
    },

    // 6. (الحركة الصايعة 🔥: TTL Index)
    // ده "تأمين" إضافي جنب Inngest.
    // بنقول لمونجو: "لو عدى 24 ساعة (86400 ثانية) على الـ createdAt، امسحي الدوكيومنت دي أوتوماتيك"
    // ده بيضمن إن الاستوري هتتمسح 100% حتى لو كود الـ Inngest مفهمش.
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // 24 hours * 60 min * 60 sec
    }

}, {
    timestamps: true // بيضيف updatedAt كمان
});


// ========================================================
// 🛡️ التحقق الذكي (Smart Validation)
// ========================================================

storySchema.pre("validate", function (next) {
    // لو النوع text: لازم يكون فيه content
    if (this.type === "text") {
        if (!this.content || this.content.trim().length === 0) {
            return next(new Error("Text story must have content."));
        }
    }

    // لو النوع image أو video: لازم يكون فيه image url
    if (this.type === "image" || this.type === "video") {
        if (!this.image || this.image.trim().length === 0) {
            return next(new Error("Image/Video story must have a media file."));
        }
    }

    next();
});

const Story = mongoose.model("Story", storySchema);

export default Story;
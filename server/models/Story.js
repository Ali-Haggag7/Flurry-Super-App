import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    // (تصليح 1 - أهم حاجة)
    // خلينا النوع ObjectId عشان الـ "ref" (Populate) يشتغل
    user: {
        type: mongoose.Schema.Types.ObjectId, // <--- ده التصليح
        ref: "User",
        required: true,
        index: true // (تحسين) بنضيف "فهرس" عشان نسرع البحث عن استوريهات يوزر معين
    },
    content: {
        type: String,
        trim: true // (تحسين) بيشيل المسافات الفاضية من أول وآخر الكلام
    },
    image: {
        type: String, // ده الـ URL بتاع الصورة اللي اترفعت
    },
}, {
    timestamps: true, // ده هيضيف (createdAt و updatedAt) أوتوماتيك
    // (تصليح 4) - شيلنا minimized
});

// (تصليح 3 - التحقق المنطقي)
// بنضيف "Validator" عشان نمنع الاستوري الفاضية
storySchema.pre("validate", function (next) {
    // بنتشيك: هل اليوزر "مدخلش" صورة "و" "مدخلش" كلام؟
    if (!this.image && !this.content) {
        // لو آه، ارمي "إيرور"
        next(new Error("Story cannot be empty. Must have either image or content."));
    } else {
        // لو لأ (يعني فيه صورة أو كلام)، عدي
        next();
    }
});


const Story = mongoose.model("Story", storySchema);

export default Story;
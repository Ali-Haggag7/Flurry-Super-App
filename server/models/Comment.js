import mongoose from "mongoose";

// 1. سكيما فرعية للردود (Sub-Schema for Replies)
// عملناها سكيما لوحدها عشان الكود يبقى نضيف، بس هي هتتخزن جوه الكومنت
const replySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true }); // _id: true مهم عشان كل رد يبقى ليه ID خاص بيه نقدر نمسحه بيه


// 2. السكيما الأساسية للكومنت
const commentSchema = new mongoose.Schema({
    // --- العلاقات ---
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
        index: true // (مهم جداً) عشان نقدر نجيب كل كومنتات بوست معين بسرعة
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // --- المحتوى ---
    text: {
        type: String,
        required: true,
        trim: true // بيشيل المسافات الزيادة
    },

    // --- التفاعل ---
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    // --- الردود (Embedded) ---
    // هنا بنستخدم السكيما الفرعية اللي عملناها فوق
    replies: [replySchema]

}, {
    timestamps: true // بيضيف createdAt (تاريخ الكومنت) و updatedAt
});

// ========================================================
// 🧠 المنطقة الذكية (Indexes & Validation)
// ========================================================

// 1. الفهرس (Performance Index) 🔥
// لما نعوز نجيب كومنتات بوست معين، غالباً بنعوزها "مترتبة بالوقت"
// الفهرس ده بيخلي المونجو تجيب الكومنتات دي في "لحظة"
commentSchema.index({ post: 1, createdAt: -1 });

// 2. التحقق (Validation) 🛡️
// نتأكد إن الكومنت مش فاضي
commentSchema.pre("validate", function (next) {
    if (this.text && this.text.trim().length === 0) {
        next(new Error("Comment text cannot be empty."));
    } else {
        next();
    }
});

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
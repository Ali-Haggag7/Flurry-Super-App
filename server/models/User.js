import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true, // عشان ميتكررش
        index: true   // عشان البحث بيه يبقى صاروخ
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    full_name: {
        type: String,
        trim: true,
        required: true,
    },
    username: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    bio: {
        type: String,
        default: "Hey there! I'm using flowNet!"
    },
    location: {
        type: String,
        default: ""
    },
    profile_picture: {
        type: String,
        default: ""
    },
    cover_photo: {
        type: String,
        default: ""
    },

    // (!! التحسين الأول: استخدمنا ref عشان نربط الكولكشن بنفسه !!)
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User" // ده بيشاور على الموديل اللي اسمه "User"
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User" // ده بيشاور على الموديل اللي اسمه "User"
        }
    ],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    // (!! التحسين التاني: شيلنا الباسورد لإن Clerk هو المسئول عنه !!)
    // password: { ... }  <-- اتشال

}, {
    timestamps: true,  // هيضيف createdAt و updatedAt
});

const User = mongoose.model("User", userSchema);  // إنشاء الموديل

export default User; // <-- بنعمل "تصدير افتراضي"
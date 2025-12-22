import React from "react";
const UserAvatar = ({ user, className }) => {
    // لو مفيش يوزر أصلاً، نرجع صورة فاضية أو null
    if (!user) return null;

    // 1. رابط الصورة الأساسية
    const profilePic = user.profile_picture;

    // 2. رابط الصورة البديلة (UI Avatars)
    // بنستخدم encodeURIComponent عشان لو الاسم فيه مسافات او رموز يتعالج صح
    const defaultPic = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username || "User")}&background=random&color=fff&bold=true`;

    return (
        <img
            src={profilePic || defaultPic} // السحر هنا: لو مفيش بروفايل، خد الديفولت
            alt={user.username || "User"}
            className={`object-cover rounded-full ${className}`} // بنسمح بتغيير المقاسات من بره
        />
    );
};

export default UserAvatar;
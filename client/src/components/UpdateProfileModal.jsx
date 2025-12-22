import toast from "react-hot-toast";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { updateUser } from "../features/userSlice.js";

const UpdateProfileModal = ({ setShowEdit }) => {
    // أول جزء في الكومبوننت ده هو "غرفة التحكم". 
    const dispatch = useDispatch();  // (المندوب): ده اللي هنستخدمه عشان نبعت الأكشن (التعديل) للـ Store.
    const { getToken } = useAuth();  // (الأمن): عشان نجيب التوكن ونبعته مع الريكويست، عشان السيرفر يعرف إننا أصحاب الحساب بجد.
    // (العين السحرية): دي بتبص جوه "التلاجة" (Redux Store) وتجيب بيانات اليوزر الحالية
    const user = useSelector((state) => state.user.currentUser);  // ليه؟ عشان لما أفتح المودال، ألاقي الخانات مليانة بياناتي القديمة، مش فاضية.

    if (!user) return null;

    //2. 🧊 الحالة المؤقتة (editForm) 
    // ليه عملنا State محلي؟

    //لأننا مش عايزين نغير في الـ Redux Store علطول وإحنا بنكتب. إحنا بنغير في "مسودة" (Draft)، ولما ندوس Save، نبعت المسودة دي للسيرفر.

    //ليه الصور null؟

    //لأننا لسه مختارناش ملف جديد. لو اليوزر مغيرش الصورة، مش هنبعت حاجة.
    const [editForm, setEditForm] = useState({
        username: user.username,  // مالينا الخانات بالقديم
        full_name: user.full_name,
        bio: user.bio,
        location: user.location,
        profile_picture: null,  // بنخليها null عشان لو المستخدم ما غيرهاش، ما نبعتش صورة جديدة.
        cover_photo: null,
    });

    //3. ⚙️ المحرك الرئيسي handleSaveProfile (أهم حتة 🔥) 
    const handleSaveProfile = async (e) => {
        // 1. 🛑 أهم سطر: ده اللي بيمنع المتصفح يعمل ريفرش
        e.preventDefault();

        // بنجهز الداتا
        const userData = new FormData();  // بنستخدم FormData عشان نقدر نبعت ملفات (الصور)
        if (editForm.username) userData.append("username", editForm.username);
        if (editForm.full_name) userData.append("full_name", editForm.full_name);
        if (editForm.bio) userData.append("bio", editForm.bio);
        if (editForm.location) userData.append("location", editForm.location);
        if (editForm.profile_picture) userData.append("profile", editForm.profile_picture);
        if (editForm.cover_photo) userData.append("cover", editForm.cover_photo);

        try {
            const token = await getToken();

            // 2. بنعمل العملية وبنغلفها بـ Toast عشان الشكل الحلو
            // dispatch(updateUser...) ده المندوب اللي بيحدث الريدكس
            const actionPromise = dispatch(updateUser({ formData: userData, token })).unwrap();

            await toast.promise(actionPromise, {
                loading: 'Updating profile...',
                success: 'Profile updated successfully! 🔥',
                error: 'Could not update profile ❌',
            });

            // 3. نقفل المودال بعد النجاح
            setShowEdit(false);

            // (ملاحظة: مش بنعمل window.location.reload() هنا خالص)

        } catch (error) {
            console.error("Failed to update:", error); // نعرض أول 100 حرف من رسالة الخطأ
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md"> {/* overlay */}
            <div className="flex items-start sm:items-center justify-center min-h-screen py-8 px-4">  {/* container */}
                <div className="w-full max-w-2xl mx-auto relative bg-linear-to-br from-gray-900/85
                            via-purple-900/85 to-black/85 border border-purple-500/20 rounded-3xl p-6 
                            sm:p-8 shadow-[0_0_40px_rgba(168,85,247,0.6)] max-h-[85vh] overflow-y-auto">  {/* modal */}

                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r 
            from-purple-400 to-pink-500 mb-6 text-center tracking-wide"> Edit Profile</h1>

                    <form className="space-y-6"
                        onSubmit={handleSaveProfile}> {/* form  */}

                        {/* Profile Picture */}
                        <div className="flex flex-col items-center">
                            <label htmlFor="profile_picture" className="group cursor-pointer relative">  {/* profile picture label */}
                                <input hidden type="file" accept="image/*" id="profile_picture"
                                    onChange={(e) => setEditForm({ ...editForm, profile_picture: e.target.files[0] })} />  {/* hidden file input */}

                                <img src={editForm.profile_picture
                                    ? URL.createObjectURL(editForm.profile_picture)
                                    : user.profile_picture || "default.png"}
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto object-cover border-4 border-purple-500
                                    shadow-[0_0_30px_rgba(168,85,247,0.75)]" />  {/* profile picture */}

                                <div className="absolute inset-0 hidden group-hover:flex items-center justify-center 
                                    rounded-full bg-black/40">
                                    <Pencil className="w-6 h-6 text-white" />  {/* edit icon */}
                                </div>
                            </label>
                            <span></span>
                        </div>

                        {/* Cover Photo */}
                        <div className="flex flex-col items-center gap-3">  {/* cover photo container */}
                            <label htmlFor="cover_photo" className="w-full cursor-pointer group relative">  {/* cover photo label */}
                                <input hidden type="file" accept="image/*" id="cover_photo"
                                    onChange={(e) => setEditForm({ ...editForm, cover_photo: e.target.files[0] })} />  {/* hidden file input */}

                                <img src={editForm.cover_photo
                                    ? URL.createObjectURL(editForm.cover_photo)
                                    : user.cover_photo || "default.png"}
                                    className="w-full h-36 sm:h-40 rounded-xl object-cover border border-purple-400/25 shadow-lg" />  {/* cover photo */}

                                <div className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded-xl bg-black/40">  {/* edit icon */}
                                    <Pencil className="w-6 h-6 text-white" />
                                </div>
                            </label>

                            <span className="text-gray-400 text-sm">Change Cover Photo</span>
                        </div>

                        {/* Inputs */}  {/* name, username, bio, email */}
                        {[
                            { label: "Full Name", type: "text", name: "full_name", value: editForm.full_name || user.full_name },
                            { label: "Username", type: "text", name: "username", value: editForm.username || user.username },
                            { label: "Location", type: "text", name: "location", value: editForm.location || user.location },
                        ].map((input) => (
                            <div key={input.name}>
                                <label htmlFor={input.name} className="block text-sm font-medium text-purple-300 mb-1">
                                    {input.value ? input.label : `${input.label} (Optional)`}
                                </label>
                                <input type={input.type} className="w-full px-4 py-3 rounded-xl bg-white/5 border 
                                    border-white/10 text-white placeholder-gray-500 focus:outline-none 
                                    focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition"
                                    placeholder={`Enter your ${input.label.toLowerCase()}`}
                                    onChange={(e) => setEditForm({ ...editForm, [input.name]: e.target.value })}
                                    value={editForm[input.name]} />
                            </div>
                        ))}

                        {/* bio */}
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-purple-300 mb-1">
                                Bio
                            </label>
                            <textarea rows="3" className="w-full px-4 py-3 rounded-xl bg-white/5 border 
                                border-white/10 text-white placeholder-gray-500 focus:outline-none 
                                focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition"
                                placeholder="What's your vibe? Let the world know..."
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                value={editForm.bio} />
                        </div>

                        {/* Save / Cancel */}
                        <div className="flex justify-end space-x-3 pt-6 pb-6">
                            <button type="button"
                                className="px-5 py-2 rounded-xl border border-gray-500 text-gray-300 hover:bg-white/10 transition cursor-pointer"
                                onClick={() => setShowEdit(false)}>Cancel</button>
                            <button type="submit"
                                className="px-6 py-2 rounded-xl bg-linear-to-r from-purple-500 to-pink-600
                                cursor-pointer text-white font-semibold shadow-[0_0_25px_rgba(236,72,153,0.7)] hover:scale-105 transition">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdateProfileModal
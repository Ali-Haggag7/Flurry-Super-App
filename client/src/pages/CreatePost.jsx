import { useState, useEffect } from "react";
import { Image, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import UserAvatar from "../components/UserDefaultAvatar"; // استدعاء الكومبوننت الموحد

const CreatePost = () => {
    // 1. تعريف الـ State
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]); // مصفوفة لتخزين ملفات الصور
    const [loading, setLoading] = useState(false); // عشان نعرف اليوزر إننا بنحمل

    // 2. Hooks المساعدة
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.user); // تأكد إن المسار state.user حسب الـ store بتاعك
    const { getToken } = useAuth();

    // 🔄 تنظيف الذاكرة: (اختياري بس احترافي)
    // لما اليوزر يختار صور، المتصفح بيعمل روابط مؤقتة، لازم ننضفها لما الصور تتغير أو المكون يتمسح
    useEffect(() => {
        return () => {
            images.forEach(file => URL.revokeObjectURL(file.preview));
        };
    }, [images]);


    /**------------------------------------------------------------------
     * 🧠 The Brain: handleSubmit Logic Explained
     * دي الفانكشن المسؤولة عن تجميع البيانات وإرسالها للسيرفر
     * ------------------------------------------------------------------*/
    const handleSubmit = async () => {

        // 1. Validation (التحقق): ممنوع نشر بوست فاضي (لا نص ولا صور)
        if (content.trim() === "" && images.length === 0) {
            toast.error("Please add content or images to your post");
            return;
        }

        // 2. Start Loading: بنشغل اللودينج وبنطلع رسالة انتظار
        setLoading(true);
        const loadingToast = toast.loading("Publishing your post...");

        try {
            // 3. Determine Post Type: بنحدد نوع البوست بناءً على المحتوى
            // لو فيه صور ونص -> text_with_image
            // لو صور بس -> image
            // غير كده -> text
            const postType = images.length && content.trim() !== "" ? "text_with_image" :
                images.length ? "image" : "text";

            // 4. Create FormData (الظرف السحري):
            // بما إننا بنرفع ملفات (صور)، مينفعش نبعت JSON عادي.
            // لازم نستخدم كائن اسمه FormData، ده عامل زي "ظرف" بنحط فيه الملفات والنصوص.
            const formData = new FormData();

            formData.append("content", content);   // حطينا النص في الظرف
            formData.append("post_type", postType); // حطينا نوع البوست

            // بنلف على الصور ونحطها واحدة واحدة في الظرف تحت اسم 'images'
            // (لازم الاسم 'images' يطابق اللي مكتوب في Multer في الباك إند)
            images.forEach((image) => {
                formData.append("images", image);
            });

            // 5. API Call (إرسال الظرف للسيرفر):
            const token = await getToken(); // بنجيب التوكن عشان الأمان
            const { data } = await api.post("/post/add", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    // ملحوظة: الـ Browser ذكي كفاية إنه يحط Content-Type: multipart/form-data لوحده لما يشوف FormData
                },
            });

            // 6. Success Handling (لو نجحنا):
            if (data.success) {
                toast.success("Post published successfully!", { id: loadingToast }); // بنحدث التوست القديم لنجاح
                navigate("/"); // بنرجع للصفحة الرئيسية
            } else {
                toast.error(data.message, { id: loadingToast });
            }

        } catch (error) {
            // 7. Error Handling (لو فشلنا):
            console.error("Post Creation Error:", error);
            toast.error(error.response?.data?.message || "Failed to create post", { id: loadingToast });
        } finally {
            // 8. Cleanup: بنوقف اللودينج سواء نجحنا أو فشلنا
            setLoading(false);
        }
    }

    // دالة مساعدة لحذف صورة مختارة قبل النشر
    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-[#0b0f3b] via-[#1a1f4d] to-[#3c1f7f] text-white pt-10 pb-20">
            <div className="max-w-4xl mx-auto p-4">

                {/* Header Section */}
                <div className="mb-10 text-center space-y-2">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-500 animate-pulse">
                        🔮 Create Post
                    </h1>
                    <p className="text-gray-300 text-lg">Share your vibes with the world!</p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(131,58,180,0.3)] 
                p-6 md:p-8 border border-purple-500/20 relative overflow-hidden">

                    {/* Decorative Gradient Blob */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                    {/* User Info */}
                    <div className="flex items-center gap-4 mb-6">
                        {/* استخدمنا الكومبوننت الموحد هنا */}
                        <UserAvatar user={user} className="w-14 h-14 border-2 border-purple-500 shadow-lg" />

                        <div>
                            <h2 className="font-bold text-xl text-white">{user?.full_name || "User"}</h2>
                            <p className="text-purple-300 text-sm">@{user?.username || "username"}</p>
                        </div>
                    </div>

                    {/* Text Input Area */}
                    <div className="relative">
                        <textarea
                            className="w-full min-h-[150px] bg-black/20 text-gray-100 p-4 rounded-2xl 
                            border border-purple-500/30 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                            placeholder-gray-400/70 text-lg resize-none transition-all duration-300 custom-scrollbar"
                            placeholder="What's on your mind?"
                            onChange={(e) => setContent(e.target.value)}
                            value={content}
                            disabled={loading}
                        />
                    </div>

                    {/* Image Previews Grid */}
                    {images.length > 0 && (
                        <div className="flex flex-wrap gap-4 mt-6 animate-fade-in">
                            {images.map((image, index) => (
                                <div key={index} className="relative group w-28 h-28 md:w-32 md:h-32">
                                    <img
                                        src={URL.createObjectURL(image)} // بنعمل رابط مؤقت للصورة عشان نعرضها
                                        alt="preview"
                                        className="w-full h-full object-cover rounded-xl border border-purple-500/40 shadow-md group-hover:scale-105 transition duration-300"
                                    />
                                    {/* Delete Button (Overlay) */}
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="absolute inset-0 bg-black/50 rounded-xl hidden group-hover:flex items-center justify-center transition backdrop-blur-sm cursor-pointer"
                                    >
                                        <X className="w-8 h-8 text-white drop-shadow-md hover:text-red-400 transition" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action Bar (Footer) */}
                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/10">

                        {/* Image Upload Button */}
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer select-none
                            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500/20 text-purple-300 hover:text-white'}`}>
                            <Image className="w-6 h-6" />
                            <span className="font-medium">Add Media</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                hidden
                                disabled={loading}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setImages(prev => [...prev, ...Array.from(e.target.files)]);
                                    }
                                }}
                            />
                        </label>

                        {/* Publish Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading || (content.trim() === "" && images.length === 0)}
                            className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 
                            text-white font-bold py-2.5 px-8 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] 
                            hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] active:scale-95 transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                        >
                            {loading ? "Publishing..." : "Post ✨"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreatePost;
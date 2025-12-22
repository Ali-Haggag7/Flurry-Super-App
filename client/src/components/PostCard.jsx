import { useState } from "react";
import { BadgeCheck, Heart, MessageCircle, Share2 } from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import api from "../api/axios";
import UserAvatar from "./UserDefaultAvatar"; // استدعاء الكومبوننت الموحد

const PostCard = ({ post }) => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { currentUser } = useSelector((state) => state.user);

    // 👇 التعديل: ضفنا image_urls كأول وأهم اختيار
    const postImages = post.image_urls || post.images || (post.image ? [post.image] : []);

    // حالة اللايك
    const [likes, setLikes] = useState(post.likes || []);
    const isLiked = currentUser && likes.includes(currentUser._id);

    // تحويل الهاشتاج
    const postWithHashtags = post.content?.replace(/#(\w+)/g, '<span class="text-indigo-400 font-medium">#$1</span>');

    const handleLike = async (e) => {
        e.stopPropagation();
        if (!currentUser) return toast.error("Please login first");

        try {
            if (isLiked) {
                setLikes(prev => prev.filter(id => id !== currentUser._id));
            } else {
                setLikes(prev => [...prev, currentUser._id]);
            }
            const token = await getToken();
            await api.put(`/post/like/${post._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            if (isLiked) setLikes(prev => [...prev, currentUser._id]);
            else setLikes(prev => prev.filter(id => id !== currentUser._id));
            console.log(error);
        }
    }

    return (
        <div className="bg-[#182034] text-white rounded-xl shadow-md p-4 space-y-3 w-full max-w-2xl mb-4 border border-gray-800">
            {/* User Info */}
            <div className="flex items-center justify-between">
                <div onClick={(e) => { e.stopPropagation(); post.user && navigate("/profile/" + post.user._id); }} className="flex items-center gap-3 cursor-pointer group">
                    <UserAvatar user={post.user} className="w-10 h-10 rounded-full border border-gray-700 group-hover:border-purple-500 transition" />
                    <div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-gray-100 group-hover:text-purple-400 transition">{post.user?.full_name || "User"}</span>
                            {/* علامة التوثيق (ممكن تربطها بشرط isVerified لو عندك) */}
                            <BadgeCheck className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-gray-500 text-xs">@{post.user?.username || "username"} · {moment(post.createdAt).fromNow()}</div>
                    </div>
                </div>
            </div>

            {/* Post Content & Images */}
            <div onClick={() => navigate(`/post/${post._id}`)} className="cursor-pointer">

                {/* Text Content */}
                {post.content && (
                    <div className="text-gray-200 text-sm whitespace-pre-line leading-relaxed mb-3 px-1" dangerouslySetInnerHTML={{ __html: postWithHashtags }}></div>
                )}

                {/* 👇👇👇 التعديل الاحترافي لعرض الصور 👇👇👇 */}
                {postImages.length > 0 && (
                    <div className="rounded-2xl overflow-hidden border border-gray-800/50 mt-2">

                        {/* 1. لو صورة واحدة */}
                        {postImages.length === 1 && (
                            <div className="h-full w-full">
                                <img src={postImages[0]} alt="post" className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.01] transition duration-300" />
                            </div>
                        )}

                        {/* 2. لو صورتين (جنب بعض) */}
                        {postImages.length === 2 && (
                            <div className="grid grid-cols-2 gap-1 h-72">
                                {postImages.map((img, i) => (
                                    <img key={i} src={img} className="w-full h-full object-cover hover:brightness-110 transition" />
                                ))}
                            </div>
                        )}

                        {/* 3. لو 3 صور (واحدة كبيرة واتنين فوق بعض) */}
                        {postImages.length === 3 && (
                            <div className="grid grid-cols-2 gap-1 h-[400px]">

                                {/* العمود الشمال: الصورة الكبيرة */}
                                <div className="relative overflow-hidden group cursor-pointer">
                                    <img
                                        src={postImages[0]}
                                        className="absolute w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                                    />
                                </div>

                                {/* العمود اليمين: الصورتين فوق بعض */}
                                <div className="flex flex-col gap-1 h-full">
                                    {/* الصورة اللي فوق (تاخد المساحة المتاحة) */}
                                    <div className="flex-1 relative overflow-hidden group cursor-pointer">
                                        <img
                                            src={postImages[1]}
                                            className="absolute w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                                        />
                                    </div>
                                    {/* الصورة اللي تحت (تاخد باقي المساحة) */}
                                    <div className="flex-1 relative overflow-hidden group cursor-pointer">
                                        <img
                                            src={postImages[2]}
                                            className="absolute w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. لو 4 صور (مربع 2x2) */}
                        {postImages.length === 4 && (
                            <div className="grid grid-cols-2 gap-1 h-80">
                                {postImages.map((img, i) => (
                                    <img key={i} src={img} className="w-full h-40 object-cover hover:brightness-110 transition" />
                                ))}
                            </div>
                        )}

                        {/* 5. لو 5 صور أو أكتر (ستايل فيسبوك: 2 فوق و 3 تحت) */}
                        {postImages.length > 4 && (
                            <div className="rounded-2xl overflow-hidden border border-gray-800/50 mt-3 shadow-sm">

                                {/* 1. صورة واحدة (بنحافظ على أبعادها الطبيعية لحد معين) */}
                                {postImages.length === 1 && (
                                    <div className="w-full">
                                        <img
                                            src={postImages[0]}
                                            alt="post"
                                            className="w-full h-auto max-h-[550px] object-contain bg-black/50"
                                        // استخدمنا object-contain مع خلفية سوداء عشان لو الصورة طويلة أو عريضة أوي تبان كاملة
                                        // أو ممكن ترجعها object-cover وتخليها max-h-[500px] لو عايزها تملأ المكان
                                        />
                                    </div>
                                )}

                                {/* 2. صورتين (جنب بعض - زودنا الطول لـ h-80 عشان يبانوا أحسن) */}
                                {postImages.length === 2 && (
                                    <div className="grid grid-cols-2 gap-1 h-80">
                                        {postImages.map((img, i) => (
                                            <img key={i} src={img} className="w-full h-full object-cover object-center hover:scale-105 transition duration-500 cursor-pointer" />
                                        ))}
                                    </div>
                                )}

                                {/* 3. ثلاث صور (واحدة كبيرة شمال، واتنين يمين) */}
                                {postImages.length === 3 && (
                                    <div className="grid grid-cols-3 gap-1 h-[400px]"> {/* زودنا الطول لـ 400px */}
                                        {/* الصورة الكبيرة واخدة تلتين المساحة */}
                                        <div className="col-span-2 h-full overflow-hidden relative group">
                                            <img src={postImages[0]} className="absolute w-full h-full object-cover object-center group-hover:scale-105 transition duration-500 cursor-pointer" />
                                        </div>
                                        {/* العمود اللي على اليمين فيه صورتين فوق بعض */}
                                        <div className="col-span-1 flex flex-col gap-1 h-full">
                                            <div className="h-1/2 overflow-hidden relative group">
                                                <img src={postImages[1]} className="absolute w-full h-full object-cover object-center group-hover:scale-105 transition duration-500 cursor-pointer" />
                                            </div>
                                            <div className="h-1/2 overflow-hidden relative group">
                                                <img src={postImages[2]} className="absolute w-full h-full object-cover object-center group-hover:scale-105 transition duration-500 cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 4. أربع صور (مربع 2x2 - زودنا الطول لـ 400px) */}
                                {postImages.length === 4 && (
                                    <div className="grid grid-cols-2 gap-1 h-[400px]">
                                        {postImages.map((img, i) => (
                                            <div key={i} className="overflow-hidden relative group">
                                                <img src={img} className="absolute w-full h-full object-cover object-center group-hover:scale-105 transition duration-500 cursor-pointer" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 5. خمس صور أو أكثر (الشكل الاحترافي: 2x2 والأخيرة عليها العدد) */}
                                {postImages.length >= 5 && (
                                    <div className="grid grid-cols-2 gap-1 h-[500px]">

                                        {/* الصورة 1: فوق شمال */}
                                        <div className="relative overflow-hidden group cursor-pointer">
                                            <img
                                                src={postImages[0]}
                                                className="absolute w-full h-full object-cover object-top hover:scale-105 transition duration-500"
                                            />
                                        </div>

                                        {/* الصورة 2: فوق يمين */}
                                        <div className="relative overflow-hidden group cursor-pointer">
                                            <img
                                                src={postImages[1]}
                                                className="absolute w-full h-full object-cover object-top hover:scale-105 transition duration-500"
                                            />
                                        </div>

                                        {/* الصورة 3: تحت شمال */}
                                        <div className="relative overflow-hidden group cursor-pointer">
                                            <img
                                                src={postImages[2]}
                                                className="absolute w-full h-full object-cover object-top hover:scale-105 transition duration-500"
                                            />
                                        </div>

                                        {/* الصورة 4: تحت يمين (وعليها الـ Overlay) */}
                                        <div className="relative overflow-hidden group cursor-pointer">
                                            <img
                                                src={postImages[3]}
                                                className="absolute w-full h-full object-cover object-top hover:scale-105 transition duration-500"
                                            />

                                            {/* الـ Overlay بيحسب الباقي (العدد الكلي - 3 صور المعروضين بوضوح) */}
                                            {/* لاحظ: احنا عرضنا 0,1,2 بوضوح، ورقم 3 عليها ماسك، يبقى الباقي هو الطول - 4 */}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/40 transition backdrop-blur-[2px]">
                                                <span className="text-white text-4xl font-bold tracking-widest">
                                                    +{postImages.length - 4}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                    </div>
                )}

            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-3 border-t border-gray-800/50 mt-2">
                <button className={`flex items-center gap-2 text-sm transition group ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`} onClick={handleLike}>
                    <Heart className={`w-5 h-5 transition-transform group-active:scale-125 ${isLiked ? "fill-current" : ""}`} />
                    <span>{likes.length || 0}</span>
                </button>
                <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition group" onClick={() => navigate(`/post/${post._id}`)}>
                    <MessageCircle className="w-5 h-5 group-hover:stroke-[2.5px]" />
                    <span>{post.comments?.length || 0}</span>
                </button>
                <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition group">
                    <Share2 className="w-5 h-5 group-hover:stroke-[2.5px]" />
                </button>
            </div>
        </div>
    );
};

export default PostCard;
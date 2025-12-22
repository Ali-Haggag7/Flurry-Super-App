import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";



// Components & Utils
import PostCard from "../components/PostCard";
import UpdateProfileModal from "../components/UpdateProfileModal";
import Loading from "../components/Loading";
import api from "../api/axios"; // السنترال بتاعنا

// Icons (للتجميل)
import { Grid, Image, Edit2, UserPlus, UserCheck, ShieldBan, ShieldCheck } from "lucide-react";
import UserAvatar from "../components/UserDefaultAvatar.jsx";

const Profile = () => {
    const { profileId } = useParams(); // الـ ID من الرابط (لو موجود)
    const { currentUser } = useSelector((state) => state.user); // أنا
    const { getToken } = useAuth();

    // Local State (للبيانات اللي بتخص الصفحة دي بس)
    const [profileUser, setProfileUser] = useState(null); // صاحب البروفايل
    const [posts, setPosts] = useState([]); // بوستاته
    const [activeTab, setActiveTab] = useState("posts");
    const [showEdit, setShowEdit] = useState(false);
    const [loading, setLoading] = useState(true);

    // 1. تحديد الهوية: هل ده بروفايلي؟
    // لو مفيش profileId في الرابط، أو الـ profileId هو هو الـ ID بتاعي
    const isMyProfile = !profileId || (currentUser && profileId === currentUser._id);

    // 2. جلب البيانات (The Data Fetcher) 🏗️
    const fetchProfileData = async () => {
        try {
            const token = await getToken();

            // 1. حساب الـ Target ID
            const targetId = profileId || (currentUser ? currentUser._id : null);

            // 👮‍♂️ الحارس: لو مفيش ID، وقف فوراً ومتعملش Loading حتى
            if (!targetId) {
                console.log("⏳ Waiting for user ID...");
                return;
            }

            setLoading(true); // شغل اللودينج هنا بس لما نتأكد إن معانا ID

            console.log("🚀 Fetching profile for:", targetId);

            const { data } = await api.get(`/post/user/${targetId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setProfileUser(data.user);
                setPosts(data.posts);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            // toast.error("Failed to load profile."); // (ممكن تشيل التوست عشان ميزعجش اليوزر لو خطأ بسيط)
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // شغل الفانكشن لو:
        // 1. فيه profileId في الرابط (يعني بزور حد)
        // 2. أو.. أنا موجود بالفعل (currentUser loaded) ومعنديش profileId (يعني بزور نفسي)
        if (profileId || currentUser) {
            fetchProfileData();
        }
    }, [profileId, currentUser?._id]); // (هتشتغل تاني أول ما currentUser يوصل بالسلامة)

    // ========================================================
    // 2️⃣ الـ Effect الجديد: (وظيفته يحدث الشاشة فوراً بعد التعديل)
    // ========================================================
    useEffect(() => {
        // لو أنا فاتح بروفايلي، والـ Redux اتغير (بسبب التعديل)
        // حدث الـ Local State فوراً بالبيانات الجديدة
        if (isMyProfile && currentUser) {
            setProfileUser(currentUser);
        }
    }, [currentUser, isMyProfile]);


    // 3. التفاعلات (Actions) 🎮

    // أ) الفولو / أنفولو
    const handleFollowToggle = async () => {
        try {
            const token = await getToken();
            // بنستخدم الراوتات اللي عملناها في connectionRoutes (أو user حسب ما استقريت)
            // لو هنمشي بنظام connection request:
            const { data } = await api.post(`/connection/request/${profileUser._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // أو لو نظام فولو مباشر:
            // const endpoint = isFollowing ? "/user/unfollow" : "/user/follow";

            if (data.success) {
                toast.success(data.message);
                // تحديث سريع للواجهة (Optimistic UI update ممكن يتعمل هنا)
                fetchProfileData(); // أو نحمل البيانات تاني للأمان
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Action failed");
        }
    };

    // ب) البلوك / أنبلوك
    const handleBlockToggle = async () => {
        if (!confirm("Are you sure?")) return; // تأكيد للأمان
        try {
            const token = await getToken();
            const endpoint = `/connection/${profileUser?.isBlocked ? "unblock" : "block"}/${profileUser._id}`;

            const { data } = await api.post(endpoint, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                fetchProfileData(); // تحديث الصفحة
            }
        } catch (error) {
            toast.error("Failed to update block status");
        }
    };


    // 1. لو لسه بيحمل بجد -> اعرض السبينر
    if (loading) return <Loading />;

    // 2. لو خلص تحميل، ولسه مفيش يوزر (يعني الـ API فشل) -> اعرض رسالة خطأ
    if (!profileUser) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-white">
            <h2 className="text-2xl font-bold text-red-500">User not found 😕</h2>
            <p className="text-gray-400">Make sure the URL is correct or try again later.</p>
        </div>
    );

    // لو معمول له بلوك، نخفي البوستات
    const isBlocked = profileUser.isBlocked; // (حسب ما الباك إند بيرجعها)

    return (
        <div className="min-h-screen bg-[#0f172a] text-white pb-20">
            {/* --- Cover & Header --- */}
            <div className="relative ">

                {/* 1. Cover Image Container */}
                <div className="h-48 md:h-80 w-full relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" /> {/* طبقة تظليل عشان الكلام يبان */}
                    {profileUser.cover_photo ? (
                        <img
                            src={profileUser.cover_photo}
                            alt="cover"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-purple-900 to-indigo-900" />
                    )}
                </div>

                {/* 2. Profile Info Container (Z-Index عالي عشان يطلع فوق) */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-20 -mt-16 md:-mt-24 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">

                    {/* Profile Picture */}
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-44 md:h-44 rounded-full p-1 bg-black shadow-2xl">
                            {/* 👇👇👇 سطر واحد بس بيقوم بالواجب 👇👇👇 */}
                            <UserAvatar
                                user={profileUser}
                                className="w-full h-full border-4 border-gray-800 bg-gray-800"
                            />
                        </div>
                        {isMyProfile && (
                            <button
                                onClick={() => setShowEdit(true)}
                                className="absolute bottom-2 right-2 p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition shadow-lg border-2 border-black cursor-pointer"
                                title="Edit Profile"
                            >
                                <Edit2 size={18} />
                            </button>
                        )}
                    </div>

                    {/* Name & Stats */}
                    <div className="flex-1 text-center md:text-left mb-2 md:mb-6">
                        <h1 className="text-2xl md:text-4xl font-bold text-white tracking-wide">{profileUser.full_name}</h1>
                        <p className="text-gray-400 font-medium">@{profileUser.username}</p>

                        {/* Bio */}
                        <p className="mt-3 text-gray-300 max-w-md mx-auto md:mx-0 leading-relaxed text-sm md:text-base">
                            {profileUser.bio || "✨ No bio yet..."}
                        </p>

                        {/* Stats */}
                        <div className="flex justify-center md:justify-start gap-6 mt-4 text-sm md:text-base">
                            <div className="flex flex-col items-center md:items-start cursor-pointer hover:opacity-80">
                                <span className="text-white font-bold text-lg">{profileUser.followers?.length || 0}</span>
                                <span className="text-gray-500 text-xs uppercase tracking-wider">Followers</span>
                            </div>
                            <div className="flex flex-col items-center md:items-start cursor-pointer hover:opacity-80">
                                <span className="text-white font-bold text-lg">{profileUser.following?.length || 0}</span>
                                <span className="text-gray-500 text-xs uppercase tracking-wider">Following</span>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-white font-bold text-lg">{posts.length}</span>
                                <span className="text-gray-500 text-xs uppercase tracking-wider">Posts</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mb-6 md:mb-8 flex gap-3">
                        {isMyProfile ? (
                            <button
                                onClick={() => setShowEdit(true)}
                                className="px-6 py-2.5 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition shadow-lg active:scale-95"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleFollowToggle}
                                    className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-lg active:scale-95 ${profileUser.isFollowed
                                        ? "bg-transparent border-2 border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-500"
                                        : "bg-purple-600 hover:bg-purple-700 text-white"
                                        }`}
                                >
                                    {profileUser.isFollowed ? "Unfollow" : "Follow"}
                                </button>

                                <button
                                    onClick={handleBlockToggle}
                                    className="p-3 bg-gray-800/50 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl border border-gray-700 transition"
                                    title="Block User"
                                >
                                    {profileUser.isBlocked ? <ShieldCheck size={20} /> : <ShieldBan size={20} />}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Content Tabs --- */}
            {!isBlocked && (
                <div className="max-w-4xl mx-auto mt-8 px-4">
                    <div className="flex border-b border-gray-800 mb-6 sticky top-0 bg-black/80 backdrop-blur-md z-30 pt-2">
                        <button
                            onClick={() => setActiveTab("posts")}
                            className={`flex-1 pb-4 text-center font-medium transition relative ${activeTab === "posts" ? "text-purple-400" : "text-gray-500 hover:text-gray-300"}`}
                        >
                            <span className="flex justify-center items-center gap-2"><Grid size={18} /> Posts</span>
                            {activeTab === "posts" && <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 rounded-t-full shadow-[0_-2px_10px_rgba(168,85,247,0.5)]" />}
                        </button>
                        <button
                            onClick={() => setActiveTab("media")}
                            className={`flex-1 pb-4 text-center font-medium transition relative ${activeTab === "media" ? "text-purple-400" : "text-gray-500 hover:text-gray-300"}`}
                        >
                            <span className="flex justify-center items-center gap-2"><Image size={18} /> Media</span>
                            {activeTab === "media" && <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 rounded-t-full shadow-[0_-2px_10px_rgba(168,85,247,0.5)]" />}
                        </button>
                    </div>

                    {/* Posts Grid/List */}
                    <div className="min-h-[300px]">
                        {activeTab === "posts" ? (
                            posts.length > 0 ? (
                                <div className="space-y-6 flex flex-col items-center">
                                    {posts.map(post => <PostCard key={post._id} post={post} />)}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="bg-gray-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Grid size={40} className="text-gray-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-400">No Posts Yet</h3>
                                    <p className="text-gray-600 mt-2">When you share photos and videos, they'll appear here.</p>
                                </div>
                            )
                        ) : (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {posts
                                    .filter(p => p.image_urls?.length > 0)
                                    .flatMap(p => p.image_urls)
                                    .map((url, i) => (
                                        <div key={i} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition group relative">
                                            <img src={url} alt="media" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                                        </div>
                                    ))
                                }
                                {/* رسالة لو مفيش ميديا */}
                                {posts.filter(p => p.image_urls?.length > 0).length === 0 && (
                                    <div className="col-span-3 text-center py-20 text-gray-500">No photos or videos yet.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && <UpdateProfileModal setShowEdit={setShowEdit} />}
        </div>
    );
};

export default Profile;
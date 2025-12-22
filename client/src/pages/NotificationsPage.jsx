import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Image as ImageIcon, Bell, UserX } from "lucide-react";
import moment from "moment";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";

// Tabs Configuration
const TABS = [
    { key: "all", icon: Bell, label: "All" },
    { key: "like", icon: Heart, label: "Likes" },
    { key: "comment", icon: MessageCircle, label: "Comments" },
    { key: "media", icon: ImageIcon, label: "Mentions" }, // غيرنا الاسم لـ ImageIcon عشان التعارض
];

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState("all");
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();

    // 1. Fetch Logic
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const { data } = await api.get("/notifications", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                // تنظيف البيانات (Data Sanitization)
                // بنضمن إن مفيش حقل يجي فاضي يضرب الموقع
                const safeNotifications = data.notifications.map((n) => ({
                    ...n,
                    type: n.type?.trim().toLowerCase() || "system", // default fallback
                    sender: n.sender || {
                        full_name: "Unknown User",
                        profile_picture: "/avatar-placeholder.png"
                    },
                    // بنحاول نستخدم الـ ID الجاي، لو مفيش بنعمل واحد مؤقت عشان الـ key
                    _id: n._id || crypto.randomUUID(),
                }));
                setNotifications(safeNotifications);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            console.error("Error fetching notifications:", error);
            // toast.error("Failed to load notifications"); // اختياري عشان ميزعجش اليوزر
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchNotifications();
    }, []);

    // 2. Filter Logic
    const filteredNotifications = activeTab === "all"
        ? notifications
        : notifications.filter((n) => n.type === activeTab);

    return (
        // 1. حل مشكلة الهيدر: زودنا sm:ml-[80px] عشان نبعد عن السايد بار (ممكن تخليها 20 حسب حجم السايد بار عندك)
        <div className="min-h-screen bg-linear-to-b from-[#0b0f3b] via-[#1a1f4d] to-[#3c1f7f] text-white p-4 pb-20 sm:ml-20">

            {/* Header */}
            {/* ظبطنا الـ Padding والـ Align عشان يبقى مريح للعين */}
            <div className="sticky top-4 z-30 backdrop-blur-xl bg-[#0b0f3b]/80 border border-white/10 p-4 mb-8 rounded-2xl flex items-center gap-4 shadow-2xl">
                <div className="p-2.5 bg-linear-to-br from-purple-600/30 to-blue-600/30 rounded-xl border border-white/10">
                    <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-wide">Notifications</h1>
                    <p className="text-xs text-gray-400">You have {notifications.length} unread notifications</p>
                </div>
            </div>

            {/* Tabs Bar */}
            {/* 3. حل مشكلة الشادو المقصوص: زودنا p-2 للكونتينر عشان الشادو ياخد راحته */}
            <div className="flex justify-start sm:justify-center gap-2 mb-8 overflow-x-auto p-2 scrollbar-hide">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative px-6 py-2.5 rounded-xl flex items-center gap-2 transition-colors duration-300 z-0
                            ${isActive ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                        >
                            {/* 2. حل مشكلة البوردر الأبيض:
                                بدل ما نعمل بوردر، عملنا خلفية كاملة بتتحرك ورا الكلام (layoutId="activeTabBackground")
                                وخلينا الـ z-index بتاعها -1 عشان الكلام يظهر فوقها
                            */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabBackground"
                                    className="absolute inset-0 bg-linear-to-r from-purple-600 to-indigo-600 rounded-xl shadow-md shadow-purple-500/25 -z-10"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}

                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-current'}`} />
                            <span className="text-sm font-semibold whitespace-nowrap">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Notifications List */}
            <div className="max-w-3xl mx-auto space-y-3">
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                    ))
                ) : filteredNotifications.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                        {filteredNotifications.map((n) => (
                            <motion.div
                                key={n._id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="group relative flex items-start gap-4 p-4 rounded-2xl bg-[#1e2542]/40 
                                border border-white/5 hover:border-purple-500/30 hover:bg-[#1e2542]/60 transition-all cursor-pointer hover:shadow-lg hover:shadow-purple-500/10"
                            >
                                {/* Left: User Avatar */}
                                <div className="relative shrink-0">
                                    <img
                                        src={n.sender.profile_picture}
                                        alt="user"
                                        className="w-12 h-12 rounded-full object-cover border-2 border-transparent group-hover:border-purple-400 transition-colors"
                                    />
                                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#1a1f4d] border border-white/10 shadow-sm">
                                        {n.type === 'like' && <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />}
                                        {n.type === 'comment' && <MessageCircle className="w-3 h-3 text-blue-400 fill-blue-400" />}
                                        {n.type === 'media' && <ImageIcon className="w-3 h-3 text-green-400" />}
                                    </div>
                                </div>

                                {/* Center: Text Content */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <p className="text-sm text-gray-200 leading-relaxed">
                                        <span className="font-bold text-white hover:underline decoration-purple-500 cursor-pointer">
                                            {n.sender.full_name}
                                        </span>
                                        <span className="text-gray-400 mx-1">
                                            {n.type === "like" && "liked your post"}
                                            {n.type === "comment" && "commented: "}
                                            {n.type === "media" && "mentioned you in a post"}
                                        </span>
                                    </p>

                                    {n.type === "comment" && n.commentText && (
                                        <p className="mt-1 text-sm text-white/90 italic">"{n.commentText}"</p>
                                    )}

                                    <p className="text-[11px] text-gray-500 mt-2 font-medium flex items-center gap-1">
                                        {moment(n.createdAt).fromNow()}
                                    </p>
                                </div>

                                {/* Right: Post Thumbnail */}
                                {n.post?.image && (
                                    <div className="shrink-0 group/img">
                                        <img src={n.post.image} alt="post" className="w-12 h-12 rounded-lg object-cover opacity-80 group-hover/img:opacity-100 transition border border-white/10" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-60">
                        <div className="bg-white/5 p-4 rounded-full mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium">No notifications yet</p>
                        <p className="text-sm">When you get notifications, they'll show up here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
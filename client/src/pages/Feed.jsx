import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@clerk/clerk-react"
import toast from "react-hot-toast"
import { Bell } from "lucide-react"

// Components & Assets
import Loading from "../components/Loading"
import StoriesBar from "../components/StoriesBar"
import RecentMessages from "../components/ResentMessages" // تأكد إن الاسم صح (Recent مش Resent)
import PostCard from "../components/PostCard"
import logo from "../assets/logo.png"
import api from "../api/axios" // تأكد من المسار حسب ملفاتك

const Feed = () => {
    const [feeds, setFeeds] = useState([])
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()
    const { getToken } = useAuth()

    const fetchFeeds = async () => {
        try {
            setLoading(true)
            const token = await getToken()

            const { data } = await api.get("/post/feed", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (data.success) {
                setFeeds(data.posts)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || "Failed to load feed")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFeeds()
    }, [])

    return !loading ? (
        // 1. الإطار الخارجي: واخد الشاشة كلها وممنوع السكرول فيه نهائي (عشان الخط البنفسجي يختفي)
        <div className="h-screen w-screen overflow-hidden bg-linear-to-br from-[#0b0f3b] via-[#1a1f4d] to-[#3c1f7f] text-white relative">

            {/*---------- Header Bar ----------*/}
            {/* الهيدر ثابت فوق ومحمي بطبقة z-index عالية */}
            <div className="absolute top-0 left-0 w-full z-50 flex justify-center pt-2 pb-2 backdrop-blur-md bg-[#0b0f3b]/30">
                <div className="w-[95%] md:w-[90%] max-w-7xl flex justify-between items-center p-2 rounded-3xl">
                    <img src={logo} alt="logo" className="h-10 mr-3 hidden sm:block animate-pulse" />

                    <div className="flex-1 mx-4 max-w-md">
                        <input
                            type="text"
                            placeholder="Search here..."
                            className="w-full bg-white/5 border rounded-3xl border-purple-500/30 text-white p-3 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all duration-200"
                        />
                    </div>

                    <div onClick={() => navigate('/notifications')} className="relative cursor-pointer p-3 rounded-full bg-linear-to-br from-purple-600 to-pink-500 shadow-[0_0_20px_rgba(255,0,255,0.5)] hover:scale-110 transition-transform duration-200">
                        <Bell className="w-6 h-6 text-white animate-pulse" />
                        <span className="absolute top-0 right-0 bg-red-500 w-3.5 h-3.5 rounded-full" />
                    </div>
                </div>
            </div>


            {/*---------- Scrollable Content Area ----------*/}
            {/* 2. منطقة المحتوى: دي بس اللي بتعمل سكرول راسي، ومقفولة افقياً */}
            <div className="h-full w-full overflow-y-auto overflow-x-hidden pt-24 pb-10 custom-scrollbar">

                {/* 3. الوعاء المرن: بيوسط العناصر وبيظبط المسافات */}
                {/* 👇 التعديل هنا: زودنا gap-28 عشان نبعد الرسائل يمين خالص */}
                <div className="w-full max-w-[1450px] mx-auto flex justify-center items-start gap-6 xl:gap-28 px-4">

                    {/* Left Side: Stories & Posts */}
                    {/* خد flex-1 عشان ياخد المساحة المتاحة بس ميزيدش عن حده */}
                    <div className="w-full max-w-2xl flex-1 space-y-6">
                        <StoriesBar />

                        <div className="space-y-6 pb-10">
                            {feeds.length > 0 ? (
                                feeds.map((post) => (
                                    <div key={post._id}>
                                        <PostCard post={post} />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-400">No posts yet</div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Messages */}
                    {/* ثابتة في مكانها لما تعمل سكرول */}
                    <div className="hidden xl:block w-80 shrink-0 sticky top-4 left-[calc(100%-400px)]">
                        <RecentMessages />
                    </div>

                </div>
            </div>

            {/* Aesthetic Overlay (خلفية جمالية) */}
            <div className="pointer-events-none fixed inset-0 bg-linear-to-br from-purple-600/20 via-pink-500/10 to-indigo-400/10 mix-blend-overlay animate-pulse-slow"></div>

        </div>
    ) : (
        <Loading />
    )
}

export default Feed
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { createPortal } from "react-dom" // 👈 1. استيراد البوابة السحرية
import StoryWindow from "./StoryWindow"
import StoryPlayer from "./StoryPlayer"
import StoryRing from "./StoryRing"
import { useAuth } from "@clerk/clerk-react"
import api from "../api/axios"
import toast from "react-hot-toast"

const StoriesBar = () => {
    const [stories, setStories] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [viewStory, setViewStory] = useState(null)
    const { getToken } = useAuth()


    const fetchStories = async () => {
        try {
            const token = await getToken()
            const { data } = await api.get("/story/feed", {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                setStories(data.stories)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message)
        }
    }

    useEffect(() => {
        fetchStories()
    }, [])

    return (
        <>
            {/* 2. تعديل الـ CSS للكونتينر:
                شيلنا fixed bottom عشان ده مكانه جوه الـ Feed فوق البوستات.
                وخليناه w-full عادي.
            */}
            <div className="w-full bg-[#0f172a]/40 backdrop-blur-md border-b border-purple-500/20 py-4 rounded-2xl mb-4">

                {/* Stories Scroll Area */}
                <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar px-4 pb-2">

                    {/* Create Story Button */}
                    <motion.div
                        onClick={() => setShowModal(true)}
                        className="shrink-0 flex flex-col items-center cursor-pointer gap-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="relative w-16 h-16 rounded-full p-0.5 bg-linear-to-tr from-purple-500 to-pink-500">
                            <div className="w-full h-full rounded-full bg-[#1e1e2e] flex items-center justify-center border-2 border-[#0f172a]">
                                <Plus className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-0.5 border-2 border-[#0f172a]">
                                <Plus className="w-3 h-3 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-300 font-medium">Create</p>
                    </motion.div>

                    {/* Friends Stories */}
                    {stories?.map((story, index) => (
                        <motion.div
                            key={index}
                            className="shrink-0 flex flex-col items-center cursor-pointer gap-1"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewStory(story)}
                        >
                            {/* 👇👇 استبدلنا البوردر القديم بالكومبوننت الجديد 👇👇 */}
                            <StoryRing count={story.stories.length}>
                                <img
                                    src={story.user.profile_picture || "/avatar-placeholder.png"}
                                    className="w-full h-full object-cover"
                                    alt="story"
                                />
                            </StoryRing>
                            <p className="text-xs text-gray-300 font-medium truncate w-16 text-center">
                                {story.user.username || "User"}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* 👇👇👇 السحر هنا (Portals) 👇👇👇 
                    بننقل المودال ده يترسم في الـ body مباشرة عشان يخرج بره حدود الـ Feed
                */}


                {showModal && createPortal(
                    <StoryWindow setShowModal={setShowModal} fetchStories={fetchStories} />,
                    document.body // المكان اللي هنرمي فيه المودال
                )}

                {viewStory && createPortal(
                    <motion.div className="fixed inset-0 z-9999 flex items-center justify-center bg-black"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <StoryPlayer viewStory={viewStory} setViewStory={setViewStory} />
                    </motion.div>,
                    document.body
                )}

            </div>
        </>
    )
}

export default StoriesBar
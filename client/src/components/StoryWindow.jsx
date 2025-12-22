import { useAuth } from "@clerk/clerk-react"
import { ArrowLeft, Sparkle, Type, Image as ImageIcon, X } from "lucide-react" // أيقونات أدق
import { useState } from "react"
import toast from "react-hot-toast"
import api from "../api/axios" // تأكد من المسار

const StoryWindow = ({ setShowModal, fetchStories }) => {
    const bgColors = ["#4f46e5", "#7c3aed", "#db2777", "#e11d48", "#ca8a04", "#0d9488", "#27272a", "#1e3a8a", "#065f46"]

    const [mode, setMode] = useState("text") // 'text' or 'media'
    const [background, setBackground] = useState(bgColors[0])
    const [media, setMedia] = useState(null)
    const [text, setText] = useState("")
    const [previewUrl, setPreviewUrl] = useState(null)
    const [loading, setLoading] = useState(false)
    const { getToken } = useAuth()

    // 👇 نقلنا الدالة دي جوه عشان تقدر تشوف الـ State
    const handleMediaUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. لو فيديو، نتأكد من مدته
        if (file.type.startsWith("video/")) {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = function () {
                window.URL.revokeObjectURL(video.src);

                // 👇 هنا الشرط: لو أكبر من 60 ثانية
                if (video.duration > 60) {
                    toast.error("Video cannot be longer than 60 seconds!");
                    return; // نكنسل العملية
                }

                // لو تمام، كمل عادي
                setMedia(file);
                setPreviewUrl(URL.createObjectURL(file));
                setMode("media");
            }

            video.src = URL.createObjectURL(file);
        } else {
            // لو صورة، كمل عادي
            setMedia(file);
            setPreviewUrl(URL.createObjectURL(file));
            setMode("media");
        }
    }

    // 👇 لوجيك الرفع للسيرفر (زي البوست بالظبط)
    const handleCreateStory = async () => {
        if (mode === "text" && !text.trim()) return toast.error("Please write something!")
        if (mode === "media" && !media) return toast.error("Please select an image or video!")

        try {
            setLoading(true)
            const token = await getToken()
            const formData = new FormData()

            // بنحدد نوع الستوري ونبعت الداتا المناسبة
            if (mode === "text") {
                formData.append("type", "text")
                formData.append("content", text)
                formData.append("backgroundColor", background)
            } else {
                const fileType = media.type.startsWith("image/") ? "image" : "video";
                formData.append("type", fileType)
                formData.append("media", media)  // تأكد إن الاسم 'media' زي المولتير
                if (text) formData.append("content", text) // لو فيه كابشن
            }

            const { data } = await api.post("/story/add", formData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (data.success) {
                toast.success("Story posted successfully!")
                fetchStories(); // 👈👈 شغلناها هنا! (بقول للأب: روح هات الداتا الجديدة حالاً)
                setShowModal(false) // نقفل الشباك
            }

        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || "Failed to post story")
        } finally {
            setLoading(false)
        }
    }

    return (
        // 👇 1. التعديل هنا: غيرنا items-end لـ items-center وزودنا z-index عشان يغطي الهيدر
        <div className="fixed inset-0 z-100 w-full min-h-screen bg-black/90 backdrop-blur-sm text-white 
        flex items-center justify-center p-4">

            <div className="w-full max-w-lg bg-[#18181b] border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl scale-100 animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="border-b border-white/10 p-4 flex items-center justify-between bg-white/5">
                    <button className="p-2 rounded-full hover:bg-white/10 transition" onClick={() => setShowModal(false)}>
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-md font-semibold tracking-wide">New Story</h2>
                    <div className="w-9"></div> {/* Spacer to center the title */}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-4">
                    <div className="relative rounded-2xl h-[450px] w-full flex items-center justify-center overflow-hidden shadow-inner"
                        style={{ backgroundColor: mode === 'text' ? background : '#000' }}>

                        {/* Text Mode */}
                        {mode === "text" && (
                            <textarea
                                className="w-full h-full bg-transparent text-white p-6 resize-none outline-none text-center text-2xl font-bold placeholder-white/50 flex items-center justify-center"
                                placeholder="Start typing..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                maxLength={300}
                            />
                        )}

                        {/* Media Mode */}
                        {mode === "media" && previewUrl && (
                            <div className="relative w-full h-full">
                                {media?.type.startsWith("image/") ? (
                                    <img src={previewUrl} alt="Story" className="w-full h-full object-contain bg-black" />
                                ) : (
                                    <video src={previewUrl} controls className="w-full h-full object-contain bg-black" />
                                )}
                                {/* زرار لإلغاء الصورة */}
                                <button
                                    onClick={() => { setMedia(null); setPreviewUrl(null); setMode("text"); }}
                                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-red-500/80 transition">
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls Footer */}
                <div className="p-4 bg-white/5 space-y-4">

                    {/* Color Picker (Only visible in Text Mode) */}
                    {mode === "text" && (
                        <div className="flex justify-center gap-3 animate-fade-in">
                            {bgColors.map((color, index) => (
                                <button key={index}
                                    className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${background === color ? 'border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setBackground(color)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Mode Toggle */}
                    <div className="flex gap-3 bg-black/20 p-1 rounded-xl">
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition font-medium text-sm
                            ${mode === "text" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                            onClick={() => setMode("text")}
                        >
                            <Type className="w-4 h-4" /> Text
                        </button>

                        <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition font-medium text-sm cursor-pointer
                            ${mode === "media" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                            <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
                            <ImageIcon className="w-4 h-4" /> Media
                        </label>
                    </div>

                    {/* Post Button */}
                    <button
                        onClick={handleCreateStory}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 
                        hover:opacity-90 active:scale-[0.98] transition text-white font-bold flex items-center justify-center gap-2
                        disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                    >
                        {loading ? "Posting..." : <><Sparkle className="w-5 h-5" /> Share Story</>}
                    </button>
                </div>

            </div>
        </div>
    )
}

export default StoryWindow
import { useState, useEffect, useRef } from "react"
import { BadgeCheck, X, ChevronRight, ChevronLeft } from "lucide-react"

const StoryPlayer = ({ viewStory, setViewStory }) => {

    // بنبدأ من أول ستوري (رقم 0)
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    // 👇 2. مرجع عشان نمسك الفيديو ونتكلم معاه مباشرة
    const videoRef = useRef(null);

    // دي الستوري اللي عليها الدور تتعرض دلوقتي
    const activeStory = viewStory?.stories[currentIndex];

    // دالة إغلاق المشغل
    const handleClose = () => {
        setViewStory(null)
    }

    // دالة التنقل للستوري اللي بعدها
    const handleNext = () => {
        if (currentIndex < viewStory.stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0); // تصفير العداد
        } else {
            handleClose(); // لو خلصنا كل الستوريهات، اقفل المشغل
        }
    }

    // دالة الرجوع للستوري اللي قبلها
    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    }

    // 👇 دالة جديدة: بتحسب تقدم الفيديو لحظة بلحظة
    const handleVideoProgress = (e) => {
        const { duration, currentTime } = e.target;
        if (duration > 0) {
            setProgress((currentTime / duration) * 100);
        }
    }

    // دالة لعرض المحتوى بناءً على نوع الستوري
    const renderContent = () => {
        if (!activeStory) return null;

        // توحيد مسميات الرابط
        const fileUrl = activeStory.image || activeStory.mediaUrl || activeStory.url;

        // تحديد نوع الميديا
        const isVideo = activeStory.type === 'video' || activeStory.mediaType === 'video';

        if (isVideo) {
            return (
                <video
                    ref={videoRef}
                    src={fileUrl}
                    onEnded={handleNext}
                    autoPlay
                    playsInline
                    // 👇 ربطنا حركة الفيديو بشريط التقدم هنا
                    // 👇 التعديل في الستايل: شيلنا max-h وخليناه ياخد العرض والطول المناسب
                    className="w-full h-full object-contain bg-black"
                />
            );
        }

        if (activeStory.type === "text") {
            return (
                <div className="w-full h-full flex items-center justify-center p-8"
                    style={{ backgroundColor: activeStory.background || activeStory.background_color }}>
                    <p className="text-white text-3xl font-bold text-center whitespace-pre-wrap leading-relaxed">
                        {activeStory.content || activeStory.textContent}
                    </p>
                </div>
            )
        }

        // Image case
        return (
            <img
                src={fileUrl}
                alt="Story"
                className="w-full h-full object-contain bg-black"
            />
        );
    }

    // 👇👇👇 4. اللوجيك الجديد للنعومة (Smoothness Magic) 👇👇👇
    useEffect(() => {
        let animationFrameId;
        let startTime = Date.now(); // عشان نحسب الوقت بدقة للصور
        const isVideo = activeStory?.type === 'video' || activeStory?.mediaType === 'video';

        const loop = () => {
            if (isVideo) {
                // لو فيديو: هات الوقت من الفيديو مباشرة
                if (videoRef.current && videoRef.current.duration) {
                    const percentage = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                    setProgress(percentage);
                }
            } else {
                // لو صورة/نص: احسب الوقت يدوياً (5 ثواني)
                const elapsed = Date.now() - startTime;
                const duration = 5000;
                const percentage = (elapsed / duration) * 100;

                setProgress(percentage);

                if (elapsed >= duration) {
                    handleNext();
                    return; // نوقف اللوب عشان ميكملش بعد ما نقلب
                }
            }

            // شغل اللوب تاني في الفريم الجاي
            animationFrameId = requestAnimationFrame(loop);
        };

        // تصفير الشريط وبدء اللوب
        setProgress(0);
        animationFrameId = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animationFrameId); // تنظيف لما الستوري تتغير
    }, [currentIndex, activeStory]);

    // لو مفيش ستوري نشوفها، ما نعرضش حاجة
    if (!activeStory) return null;

    return (
        <div className="fixed inset-0 z-9999 w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden">

            {/* Background blur layer (شكل جمالي ورا المحتوى) */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-0"
                style={{ backgroundColor: activeStory.background }}>
            </div>

            {/* Content Container (ده اللي شايل الفيديو) */}
            <div className="relative w-full h-full md:max-w-md md:h-[90vh] md:rounded-2xl overflow-hidden z-10 bg-black shadow-2xl">

                {/* Progress Bars */}
                <div className="absolute top-4 left-0 w-full z-50 px-3 flex gap-1.5">
                    {viewStory.stories.map((_, idx) => (
                        <div key={idx} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                // 👇 5. شيلنا transition classes عشان الجافاسكريبت هو اللي بيحركها بنعومة 60fps
                                className="h-full bg-white"
                                style={{ width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' }}
                            ></div>
                        </div>
                    ))}
                </div>

                {/* Header Info */}
                <div className="absolute top-8 left-4 flex items-center gap-3 z-50 drop-shadow-md">
                    <img src={viewStory.user?.profile_picture} className="w-9 h-9 rounded-full border border-white/50" />
                    <div className="flex flex-col text-white">
                        <div className="flex items-center gap-1 font-semibold text-sm">
                            {viewStory.user?.full_name}
                            <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span className="text-white/70 text-[10px]">
                            {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Close Button */}
                <button onClick={handleClose} className="absolute top-8 right-4 z-50 p-2 bg-black/10 rounded-full hover:bg-black/30 transition backdrop-blur-sm">
                    <X className="w-6 h-6 text-white" />
                </button>

                {/* Navigation Zones */}
                <div className="absolute inset-0 flex z-40">
                    <div className="w-1/3 h-full" onClick={handlePrev}></div>
                    <div className="w-1/3 h-full"></div>
                    <div className="w-1/3 h-full" onClick={handleNext}></div>
                </div>

                {/* The Content Itself */}
                {renderContent()}

            </div>
        </div>
    )
}

export default StoryPlayer
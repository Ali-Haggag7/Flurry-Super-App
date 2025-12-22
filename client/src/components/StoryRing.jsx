const StoryRing = ({ count = 1, children }) => {
    // 1. تظبيط المقاسات بدقة
    const size = 70;           // حجم المربع الكلي
    const strokeWidth = 3;     // سمك الخط الملون
    const center = size / 2;   // نقطة المنتصف (35)

    // نصف القطر لازم يكون: (نص الحجم) - (نص سمك الخط) - (هامش صغير)
    // 35 - 1.5 - 2 = 31.5
    const radius = (size / 2) - (strokeWidth / 2) - 2;

    const circumference = 2 * Math.PI * radius; // المحيط

    // 2. حساب الفراغات (Gaps)
    // كل ما القصص تزيد، الفراغ يصغر شوية عشان الشكل ميبوظش
    // لو قصة واحدة مفيش فراغ (0)، لو أكتر بنخلي الفراغ 4 بكسل
    const gap = count > 1 ? 4 : 0;

    // طول الشرطة الملونة الواحدة
    const dash = (circumference / count) - gap;

    return (
        <div className="relative w-[70px] h-[70px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300">

            {/* SVG Ring */}
            <svg
                width={size}
                height={size}
                className="absolute top-0 left-0 -rotate-90 z-10" // نلفها عشان تبدأ من فوق
            >
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" /> {/* purple */}
                        <stop offset="100%" stopColor="#ec4899" /> {/* pink */}
                    </linearGradient>
                </defs>

                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="url(#gradient)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeLinecap="round" // الأطراف تكون مدورة
                    // السحر كله هنا 👇
                    // القيمة الأولى: طول اللون
                    // القيمة الثانية: طول الفراغ
                    strokeDasharray={`${dash} ${gap}`}
                />
            </svg>

            {/* الصورة */}
            {/* صغرناها سيكة (62px) عشان نسيب مسافة بيضاء بينها وبين الرينج */}
            <div className="w-[62px] h-[62px] rounded-full overflow-hidden border-2 border-[#0f172a] p-0.5 z-0">
                <div className="w-full h-full rounded-full overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default StoryRing;
// 1. بنستدعي مكتبة "nodemailer" اللي هي "ساعي البريد"
import nodemailer from "nodemailer";

// 2. بنجهز "ساعي البريد" (Transporter)
// ده الأوبجكت اللي شايل بيانات السيرفر اللي هنبعت منه
// إحنا بنجهزه مرة واحدة بس هنا
const transporter = nodemailer.createTransport({
    // ده سيرفر "MailerSend" اللي إنت مشترك فيه
    host: "smtp.mailersend.net",
    // ده البورت الآمن للاتصال (Standard)
    port: 587,
    // دي بيانات الدخول (اليوزر والباسورد) اللي بنجيبها من ملف .env
    auth: {
        user: process.env.SMTP_USER, // اليوزر نيم بتاعك في MailerSend
        pass: process.env.SMTP_PASS, // الباسورد بتاعك
    },
});

/**
 * 3. دي الفانكشن "المساعدة" اللي هنستخدمها في أي مكان في المشروع
 * @param {object} options - أوبجكت فيه بيانات الإيميل
 * @param {string} options.to - الإيميل اللي هنبعت "له"
 * @param {string} options.subject - عنوان الرسالة
 * @param {string} options.body - محتوى الرسالة (HTML)
 */
const sendEmail = async ({ to, subject, body }) => {
    // بنستخدم (try...catch) عشان لو حصل أي مشكلة في الإرسال
    // (زي الباسورد غلط أو السيرفر واقع) الأبليكيشن ميكراش
    try {
        // 4. ده الأمر الفعلي بالإرسال (مستني الرد عشان كده await)
        const response = await transporter.sendMail({
            // الإيميل اللي الرسالة طالعة "منه" (لازم يكون متسجل في MailerSend)
            from: process.env.SENDER_EMAIL,

            // الإيميل اللي هتبعت "له" (ده اللي جاي كبارامتر)
            to: to,

            // عنوان الرسالة
            subject: subject,

            // محتوى الرسالة (وبنقوله إنه HTML عشان يقبل لينكات وتنسيق)
            html: body
        });

        // (اختياري) نطبع في الكونسول إن الدنيا تمام
        console.log("Email sent successfully:", response.messageId);

        // بنرجع الرد للي نده علينا (ده دليل النجاح)
        return response;

    } catch (error) {
        // لو حصل أي مشكلة
        console.error("Error sending email:", error);

        // بنرجع null عشان الكنترولر اللي بينده يعرف إن الإرسال فشل
        return null;
    }
}

// 5. بنعمل "تصدير" للفانكشن دي عشان باقي الملفات تشوفها وتستخدمها
export default sendEmail;
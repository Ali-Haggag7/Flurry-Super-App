/*
* التعديل: شيلنا علامة "@" من اسم الباكيدج.
* الغلط كان: import ImageKit from '@imagekit';
* الصح هو:   import ImageKit from 'imagekit';
*/
import ImageKit from 'imagekit';

var imagekit = new ImageKit({
    // عشان السيرفر يقدر يثبت هويته لـ ImageKit ويقوله "أنا تبعك، اسمحلي أرفع صور".
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export default imagekit
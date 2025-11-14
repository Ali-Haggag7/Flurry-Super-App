import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Connections from './pages/Connections'
import Profile from './pages/Profile'
import CreatePost from './pages/CreatePost'
import Search from './pages/Search'
import Settings from './pages/Settings'
import PostDetails from './pages/PostDetails'
import NotificationsPage from './pages/NotificationsPage'
import Layout from './pages/Layout'
import Feed from './pages/Feed'
// (!! التحسين: هنجيب isLoaded عشان نحل مشكلة الرعشة !!)
import { useUser, useAuth } from '@clerk/clerk-react'
import Login from './pages/Login'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import Loading from './components/Loading.jsx'

// (!! التحسين 1: عملنا كومبوننت "البواب" !!)
const ProtectedRoute = () => {
  // بنجيب اليوزر، والأهم: بنعرف هو خلص تحميل ولا لأ
  const { user, isLoaded } = useUser();

  // 1. لو Clerk لسه بيحمل بيانات اليوزر، اعرض "تحميل..."
  // (ده بيمنع "الرعشة" اللي بتحصل في الأول)
  if (!isLoaded) {
    return <Loading />; // أو أي "سبينر" تحميل
  }

  // 2. لو خلص تحميل ومفيش يوزر، اطرده لصفحة اللوجن
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. لو خلص تحميل واليوزر موجود، افتحله الباب
  // <Outlet /> دي معناها "كمل للراوت اللي بعدي" (اللي هو Layout)
  return <Outlet />;
};

const App = () => {

  const { user, isLoaded } = useUser(); // 4. ضيف isLoaded
  const { getToken } = useAuth();

  // (!! ده التعديل الأهم لحل مشكلة "User not found" !!)
  useEffect(() => {
    // 5. نتأكد إن "اليوزر" و "التوكن" جاهزين
    if (isLoaded && user) {

      // 6. هنعرف الفانكشن اللي هتعمل المزامنة
      const syncWithDb = async () => {
        try {
          // 7. هنجيب التوكن
          const token = await getToken();

          // 8. هنبعت للباك إند "طلب مزامنة"
          // (ده الرابط اللي لسه عاملينه)
          const res = await fetch('http://localhost:4000/api/user/sync', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            // 9. (الأهم) هنبعت بيانات اليوزر عشان الباك إند يخلقه
            body: JSON.stringify({
              email: user.emailAddresses[0].emailAddress,
              username: user.username  || "",
              fullName: user.fullName,
              bio: user.bio,
              location: user.location,
              profile: user.profile_picture,
              cover: user.cover_photo
            })
          });

          const data = await res.json();
          if (data.success) {
            console.log("User Synced Successfully!", data.data);
            console.log(token);
          } else {
            console.error("Sync failed:", data.message);
          }

        } catch (error) {
          console.error("Error syncing user:", error);
        }
      };

      // 10. ننادي الفانكشن دي
      syncWithDb();
    }
    // 11. الـ useEffect ده هيشتغل كل ما (isLoaded) أو (user) يتغيروا
  }, [isLoaded, user, getToken]);

  return (
    <>
      <Toaster />

      {/* (!! التحسين 2: الخريطة بقت أنضف بكتير !!) */}
      <Routes>

        {/* === الراوت العام (أي حد يدخله) === */}
        <Route path="/login" element={<Login />} />

        {/* === الروابط المحمية (لازم "البواب" يوافق الأول) === */}
        <Route element={<ProtectedRoute />}>
          {/* لو "البواب" وافق، هيشغل الـ Layout
            والـ Layout جواه <Outlet /> هيعرض واحد من دول:
          */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Feed />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="messages/:id" element={<Chat />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/post/:id" element={<PostDetails />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* (اختياري) ممكن تضيف راوت "صفحة 404" هنا */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}

      </Routes>
    </>
  );
};

export default App;
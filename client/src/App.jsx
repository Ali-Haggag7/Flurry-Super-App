import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'

// Components & Pages
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
import Login from './pages/Login'
import Loading from './components/Loading.jsx'
import AuthWrapper from './components/AuthWrapper' // 👈 استيراد الرابر الجديد

// (البواب الأول - بتاع Clerk)
const ProtectedRoute = () => {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const App = () => {
  // شيلنا كل الـ useEffect والـ Dispatch من هنا
  // App بقى خفيف ونضيف 🧹

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* 1. التأكد إن اليوزر مسجل دخول في Clerk */}
        <Route element={<ProtectedRoute />}>

          {/* 2. التأكد إن اليوزر متزامن مع الداتابيز (AuthWrapper) */}
          {/* الـ AuthWrapper جواه <Outlet /> فمش محتاجين نحط جواه chilren هنا بالشكل القديم */}
          <Route element={<AuthWrapper />}>

            {/* 3. عرض التصميم والصفحات */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Feed />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="messages/:id" element={<Chat />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile/:profileId?" element={<Profile />} />
              <Route path="/create-post" element={<CreatePost />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/post/:id" element={<PostDetails />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

          </Route>
        </Route>

        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </>
  );
};

export default App;
import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import { syncUser } from "../features/userSlice"; // تأكد من المسار
import Loading from "./Loading";
import { Outlet } from "react-router-dom";

const AuthWrapper = () => {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const dispatch = useDispatch();

    // بنجيب حالة اليوزر من الريدكس عشان نتأكد إنه وصل
    // (افترضت إن عندك state.user.currentUser أو loading)
    const { currentUser, status } = useSelector((state) => state.user);

    const [isSynced, setIsSynced] = useState(false);

    useEffect(() => {
        const runSync = async () => {
            if (isLoaded && user && !isSynced) {
                try {
                    const token = await getToken();
                    const userData = {
                        id: user.id,
                        email: user.emailAddresses[0].emailAddress,
                        username: user.username,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        imageUrl: user.imageUrl,
                    };

                    // نبعت البيانات للريدكس (وهو هيبعتها للباك إند)
                    await dispatch(syncUser({ userData, token })).unwrap();

                    setIsSynced(true); // تمام، تم المزامنة
                } catch (error) {
                    console.error("Sync failed inside wrapper:", error);
                    // حتى لو فشل، ممكن نعديه عشان ميعطلش الدنيا، أو نعرض إيرور
                    setIsSynced(true);
                }
            }
        };

        runSync();
    }, [isLoaded, user, getToken, dispatch, isSynced]);

    // طول ما هو بيحمل أو لسه معملش Sync، اعرض اللودينج
    if (!isLoaded || !user || !isSynced) {
        return <Loading />;
    }

    // أول ما يخلص، اعرض المحتوى اللي جواه (Layout والصفحات)
    return <Outlet />;
};

export default AuthWrapper;
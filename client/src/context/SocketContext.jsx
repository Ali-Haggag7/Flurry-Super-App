/**
 * @fileoverview Socket Context Provider
 * Updated to use dynamic VITE_API_URL environment variable.
 */

import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocketContext must be used within a SocketContextProvider");
    }
    return context;
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const { currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        let newSocket = null;

        if (currentUser && currentUser._id) {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

            // (e.g., https://...devtunnels.ms/api -> https://...devtunnels.ms)
            const socketUrl = apiUrl.replace("/api", "");

            newSocket = io(socketUrl, {
                query: {
                    userId: currentUser._id,
                },
                withCredentials: true
            });

            setSocket(newSocket);

            newSocket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            return () => {
                newSocket.close();
                setSocket(null);
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [currentUser?._id]);

    // --- Notification & Sound Logic  ---
    useEffect(() => {
        if (!socket) return;
        const handleIncomingNotification = (newMessage) => {
            if (!currentUser) return;
            const senderId = newMessage.sender._id || newMessage.sender;
            const isMuted = currentUser.mutedUsers?.includes(senderId);
            const isBlocked = currentUser.blockedUsers?.includes(senderId);
            const isMe = senderId === currentUser._id;

            if (!isMuted && !isBlocked && !isMe) {
                try {
                    const sound = new Audio("/notification.mp3");
                    sound.play().catch((err) => console.warn("Audio prevented:", err));
                } catch (error) { console.error("Sound error:", error); }
            }
        };
        socket.on("receiveMessage", handleIncomingNotification);
        return () => { socket.off("receiveMessage", handleIncomingNotification); };
    }, [socket, currentUser]);

    // --- Privacy Filtering  ---
    const visibleOnlineUsers = useMemo(() => {
        if (!currentUser) return [];
        let filtered = onlineUsers;
        const safeBlockedList = (currentUser.blockedUsers || []).map((u) => (u._id ? u._id : u));
        if (safeBlockedList.length > 0) {
            filtered = filtered.filter((id) => !safeBlockedList.includes(id));
        }
        return filtered;
    }, [onlineUsers, currentUser?.blockedUsers]);

    const contextValue = useMemo(() => ({
        socket,
        onlineUsers: visibleOnlineUsers,
    }), [socket, visibleOnlineUsers]);

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};
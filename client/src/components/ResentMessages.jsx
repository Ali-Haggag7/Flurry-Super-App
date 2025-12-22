import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import moment from "moment";
import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import api from "../api/axios";
import UserAvatar from "./UserDefaultAvatar";

const RecentMessages = () => {

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();

    const fetchConversations = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get("/message/recent", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.log("Chat Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    return (
        <motion.div
            className="w-full flex flex-col text-sm 
            bg-linear-to-b from-[#1a1f4d]/90 via-[#0f172a]/80 to-[#0b0f3b]/95 
            backdrop-blur-xl rounded-3xl shadow-[0_0_25px_rgba(131,58,180,0.3)] 
            border border-purple-500/20 overflow-hidden max-h-[80vh]"

            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >

            {/* Header (English) */}
            <h3 className="font-bold text-white px-5 py-4 border-b border-purple-500/30 bg-purple-900/20 backdrop-blur-md flex justify-between items-center">
                <span>Messages</span>
                <span className="text-xs bg-purple-600 px-2 py-0.5 rounded-full text-white">{conversations?.length || 0}</span>
            </h3>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {!loading && conversations?.length > 0 ? (
                    conversations.map((chat, index) => (
                        <Link
                            to={`/messages/${chat.otherUser?._id}`}
                            key={index}
                            className="flex items-center gap-3 px-3 py-3 hover:bg-white/5 
                            rounded-2xl transition-all duration-200 group border border-transparent hover:border-purple-500/30"
                        >
                            <div className="relative">
                                <UserAvatar
                                    user={chat.otherUser}
                                    className="w-10 h-10 rounded-full border border-purple-500/50 shadow-sm"
                                />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0f172a] rounded-full"></span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <p className="font-semibold text-gray-200 truncate text-sm group-hover:text-purple-300 transition-colors">
                                        {chat.otherUser?.full_name || "User"}
                                    </p>
                                    <span className="text-[10px] text-gray-500">
                                        {moment(chat.lastMessage?.createdAt).fromNow(true)}
                                    </span>
                                </div>

                                <p className="text-gray-400 text-xs truncate max-w-[140px]">
                                    {chat.lastMessage?.text || "Sent a media file 📷"}
                                </p>
                            </div>
                        </Link>
                    ))
                ) : (
                    // Empty State (English)
                    <div className="text-center py-8 text-gray-500 text-xs">
                        <p className="font-semibold text-sm">No recent conversations</p>
                        <p className="mt-2 text-[12px] opacity-70">Start a new conversation now!</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default RecentMessages;
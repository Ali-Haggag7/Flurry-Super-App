/**
 * @fileoverview Socket.io Server Configuration
 * Handles real-time connections, personalized presence, and blocking logic.
 * @version 1.3.0 (Privacy Enhanced)
 */

import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";

// ==========================================
// --- Server & Socket Initialization ---
// ==========================================

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:4173",
            "https://flurry-app.vercel.app",
            "https://flurry-fobctrqrq-ali-haggags-projects.vercel.app",
            /\.vercel\.app$/
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
});

app.set("io", io);

// ==========================================
// --- State Management ---
// ==========================================

export const userSocketMap = {}; // { userId: socketId }
const hiddenUsers = new Set();

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

/**
 * 🔥 Core Function: Emit Personalized Online Lists
 * This replaces the old simple emit to handle Block Logic.
 */
const emitOnlineUsers = async () => {
    try {
        const onlineIds = Object.keys(userSocketMap);

        // 1. Fetch Blocking Info for ALL online users in one query (Optimization)
        // بنجيب مين مبلك مين لكل الناس الفاتحة دلوقتي عشان منعملش كويري جوا اللوب
        const onlineUsersData = await User.find({ _id: { $in: onlineIds } })
            .select('_id blockedUsers hideOnlineStatus');

        // 2. Create a fast Lookup Map
        const privacyMap = new Map();
        onlineUsersData.forEach(u => {
            privacyMap.set(u._id.toString(), {
                blockedUsers: new Set(u.blockedUsers.map(id => id.toString())),
                hideOnlineStatus: u.hideOnlineStatus
            });
        });

        // 3. Iterate over all connected sockets to send personalized lists
        const sockets = await io.fetchSockets();

        for (const socket of sockets) {
            const recipientId = socket.handshake.query.userId;

            if (!recipientId) continue;

            // Filter the list specifically for THIS recipient
            const personalizedList = onlineIds.filter(targetId => {
                if (targetId === recipientId) return true; // Always see self

                const targetData = privacyMap.get(targetId);

                // Safety check if data is missing
                if (!targetData) return false;

                // Rule 1: If Target enabled "Ghost Mode" -> Hidden
                if (targetData.hideOnlineStatus || hiddenUsers.has(targetId)) return false;

                // Rule 2: If Target has BLOCKED Recipient -> Hidden (وده طلبك)
                if (targetData.blockedUsers.has(recipientId)) return false;

                // Rule 3 (Optional): If Recipient blocked Target -> Hidden (Usually standard behavior)
                // ممكن تجيب داتا المستلم وتعملها هنا لو حابب، بس حالياً ركزنا على القاعدة 2

                return true;
            });

            // Send the custom list to this specific user only
            io.to(socket.id).emit("getOnlineUsers", personalizedList);
        }

    } catch (error) {
        console.error("Error emitting online users:", error);
    }
};

// ==========================================
// --- Connection Handler ---
// ==========================================

io.on("connection", async (socket) => {
    console.log(`🔌 User Connected: ${socket.id}`);
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;

        // --- Check Privacy Settings from DB on Connect ---
        try {
            const user = await User.findById(userId).select("hideOnlineStatus blockedUsers");
            if (user?.hideOnlineStatus) {
                hiddenUsers.add(userId);
            }
        } catch (error) {
            console.error(`Error fetching user data:`, error);
        }

        // --- Message Delivery Logic ---
        const markAsDelivered = async () => {
            try {
                await Message.updateMany(
                    { receiver: userId, delivered: false },
                    { $set: { delivered: true } }
                );
                const senders = await Message.distinct("sender", { receiver: userId });
                senders.forEach((senderId) => {
                    const senderSocketId = userSocketMap[senderId.toString()];
                    if (senderSocketId) {
                        io.to(senderSocketId).emit("messagesDelivered", { toUserId: userId });
                    }
                });
            } catch (err) {
                console.error(err);
            }
        };
        markAsDelivered();
    }

    // 🔥 Broadcast Status (Using the new personalized function)
    await emitOnlineUsers();

    // ==========================================
    // --- Event Listeners ---
    // ==========================================

    socket.on("messageReceivedConfirm", ({ messageId, senderId, receiverId }) => {
        const senderSocket = userSocketMap[senderId];
        if (senderSocket) {
            io.to(senderSocket).emit("messageDelivered", { messageId, toUserId: receiverId });
        }
    });

    socket.on("joinGroup", (groupId) => {
        socket.join(groupId);
    });

    socket.on("typingGroup", ({ groupId, username, image }) => {
        socket.to(groupId).emit("typingGroup", { username, image });
    });

    socket.on("stop typingGroup", (groupId) => {
        socket.to(groupId).emit("stop typingGroup");
    });

    socket.on("toggleOnlineStatus", async ({ isHidden }) => {
        if (isHidden) {
            hiddenUsers.add(userId);
        } else {
            hiddenUsers.delete(userId);
        }
        // Refresh lists for everyone immediately
        await emitOnlineUsers();
    });

    socket.on("typing", (receiverId) => {
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) io.to(receiverSocketId).emit("typing");
    });

    socket.on("stop typing", (receiverId) => {
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) io.to(receiverSocketId).emit("stop typing");
    });

    // Handle Disconnect
    socket.on("disconnect", async () => {
        console.log(`❌ User Disconnected: ${socket.id}`);
        if (userId) {
            try {
                await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
            } catch (error) {
                console.error(error);
            }
            delete userSocketMap[userId];
            hiddenUsers.delete(userId);

            // Broadcast new list
            await emitOnlineUsers();
        }
    });
});

export { app, io, server };
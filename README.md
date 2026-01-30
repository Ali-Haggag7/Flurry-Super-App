# 🌪️ Flurry - Real-time Social Media Platform

> **Flurry** is a fully functional, mobile-first social media application built with the MERN stack. It bridges the gap between traditional social feeds and instant messaging, offering a seamless, app-like experience on the web.

[![Flurry Demo Watch Video](image.png)](https://www.linkedin.com/in/ali-haggag7)
*(Click the image above to watch the demo video)*

## 🚀 Live Demo
[Click here to visit Flurry](https://flurry-app.vercel.app/)

---

## ✨ Key Features

### 1️⃣ Advanced Social Feed
- **Full Interactions:** Create, edit, delete, save, and share posts.
- **Threaded Comments:** Infinite nested replies with independent like counters.
- **Auto-Moderation:** Smart system that "soft bans" posts after receiving 5+ reports.
- **Visual Integration:** User stories appear as a status ring around profile pictures in the feed.

### 2️⃣ Real-time Chat (Socket.io)
- **Instant Messaging:** Zero-latency chat with live typing indicators.
- **Message States:** Detailed status (Pending 🕒 -> Sent ✔️ -> Delivered ✔️✔️ -> Read ✅).
- **Rich Media:** Send images, videos, voice notes, and external links.
- **Group Management:** Full admin controls (remove members) and system event messages.

### 3️⃣ Interactive Stories
- **Rich Content:** Support for images, videos, and text with backgrounds.
- **Smart Views:** Segmented status rings indicate viewed/unviewed stories.
- **Direct Replies:** Reply to stories directly into the chat with a quoted reference.

### 4️⃣ Privacy & Security
- **Hard Block System:** Complete isolation between blocked users.
- **Private Accounts:** Content is hidden from non-followers.
- **Active Status Control:** Option to hide "Online" presence.
- **Secure Auth:** Powered by **Clerk** for session management.

### 5️⃣ Performance & Architecture
- **Optimized Rendering:** Utilizing `React.memo` and `useCallback` to prevent unnecessary re-renders.
- **Lazy Loading:** Heavy components (like Emoji Picker) load only when needed.
- **Optimistic UI:** Instant feedback on likes/comments before server response.
- **Rate Limiting:** Backend protection against spam and DDoS attacks.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Framer Motion, Lucide React |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | MongoDB, Mongoose |
| **Auth** | Clerk |
| **Media** | ImageKit CDN |

---

## 💻 Running Locally

1. **Clone the repository**
   ```bash
   git clone [https://github.com/Ali-Haggag7/flurry-app.git](https://github.com/Ali-Haggag7/flurry-app.git)
   cd flurry-app

2. **Install Dependencies**

# Install server dependencies
    cd server
    npm install

# Return to root then install client dependencies
    cd ../client
    npm install

3. **Environment Variables Create a .env file in both client and server directories and add your keys (Clerk, MongoDB, ImageKit).**

4. **Run the App**

# Run Backend (Open new terminal)
cd server
npm start

# Run Frontend (Open separate terminal)
cd client
npm run dev

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE). 
Created by **Ali Haggag**. © 2026 All rights reserved.
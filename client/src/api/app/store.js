import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../../features/userSlice.js"; // (هات القسم اللي عملناه)
import messagesReducer from "../../features/messagesSlice.js"; // (هات قسم الرسايل كمان)
import connectionReducer from "../../features/connectionsSlice.js"; // (هات قسم الكونكشنز كمان)

// هنا بنعمل المخزن (Store) اللي هو "المطعم" كله

export const store = configureStore({
    reducer: {
        user: userReducer,
        messages: messagesReducer,
        connections: connectionReducer, // (هات قسم الكونكشنز كمان)
    },
});

export default store;
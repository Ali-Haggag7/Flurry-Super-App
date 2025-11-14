import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema({
    sender: {
        ref: "User",
        type: String,
        required: true
    },
    receiver: {
        ref: "User",
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, {
    timestamps: true
});

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection;
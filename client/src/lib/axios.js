/**
 * @file axiosInstance.ts
 * Smart Configuration:
 * - Development: Uses localhost
 * - Production/Preview: Uses relative path "/api" to talk to its own backend
 */

import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development"
    ? "http://localhost:4000/api"
    : "/api";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

export default axiosInstance;
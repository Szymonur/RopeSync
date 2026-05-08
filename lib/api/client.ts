import axios from "axios";
import * as authStorage from "../utils/authStorage";

const API_URL = "http://192.168.18.2:8443";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor dodający token Authorization do każdego zapytania
api.interceptors.request.use(
    async (config) => {
        const token = await authStorage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export default api;

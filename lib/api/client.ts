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
        const token = await authStorage.getAccessToken();
        console.log("token in api.interceptors.request:", token);

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Interceptor reagujący na błędy (np. wygasły token)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (
            error.response &&
            (error.response.status === 401 || error.response.status === 403)
        ) {
            await authStorage.removeAccessToken(); // TODO - jakoś lepiej zarządzić wygasłymi kluczami, co z offline first?
            // To nie zaktualizuje stanu w AuthContext automatycznie,
            // ale spowoduje, że kolejne przeładowanie aplikacji przekieruje do logowania.
        }
        return Promise.reject(error);
    },
);

export default api;

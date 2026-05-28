import axios from "axios";
import * as authStorage from "../utils/authStorage";
import { API_URL } from "./baseUrl";

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
        const originalRequest = error.config;

        if (
            error.response &&
            (error.response.status === 401 || error.response.status === 403) &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;
            try {
                const refreshToken = await authStorage.getRefreshToken();
                if (!refreshToken) return;

                const response = await fetch(`${API_URL}/refresh`, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        refreshToken: refreshToken,
                    }),
                });

                if (response.status === 200) {
                    const json = await response.json();
                    await authStorage.saveAccessToken(json.accessToken);

                    originalRequest.headers.Authorization = `Bearer ${json.accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error(
                    "Error during refresh access token",
                    refreshError,
                );
            }
        }
        return Promise.reject(error);
    },
);

export default api;

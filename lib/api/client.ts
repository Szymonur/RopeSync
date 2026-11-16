import axios from "axios";
import * as authStorage from "../utils/authStorage";
import { API_URL } from "./baseUrl";

const REQUEST_TIMEOUT_MS = 15000;

const api = axios.create({
    baseURL: API_URL,
    timeout: REQUEST_TIMEOUT_MS,
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

// Wywoływane, gdy serwer definitywnie odrzuci refresh token (sesja wygasła).
// AuthContext rejestruje tu wylogowanie, żeby aplikacja nie działała dalej "po cichu" bez sesji.
let onAuthFailure: (() => void) | null = null;

export const setAuthFailureHandler = (handler: (() => void) | null) => {
    onAuthFailure = handler;
};

// Jedno wspólne odświeżanie tokenu dla wszystkich równoległych zapytań (single-flight)
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = await authStorage.getRefreshToken();
    if (!refreshToken) {
        return null;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            refreshToken: refreshToken,
        }),
    });

    if (response.status === 401 || response.status === 403) {
        // Refresh token nieważny lub wygasł - błąd sieci tu nie trafia (fetch rzuca wyjątek)
        onAuthFailure?.();
        return null;
    }
    if (response.status !== 200) {
        return null;
    }

    const json = await response.json();
    if (!json?.accessToken) {
        return null;
    }
    await authStorage.saveAccessToken(json.accessToken);
    return json.accessToken as string;
};

// Interceptor reagujący na błędy (np. wygasły token)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) {
            return Promise.reject(error);
        }
        const isAuthEndpoint = originalRequest.url?.includes('/login') || originalRequest.url?.includes('/register');

        if (
            error.response &&
            (error.response.status === 401 || error.response.status === 403) &&
            !originalRequest._retry &&
            !isAuthEndpoint
        ) {
            originalRequest._retry = true;
            try {
                if (!refreshPromise) {
                    refreshPromise = refreshAccessToken().finally(() => {
                        refreshPromise = null;
                    });
                }
                const newAccessToken = await refreshPromise;

                if (newAccessToken) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error(
                    "Error during refresh access token",
                    refreshError,
                );
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    },
);

export default api;

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
            try {
                const refreshToken = await authStorage.getRefreshToken();
                const response = await fetch(
                    "http://192.168.18.2:8443/refresh",
                    {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            refreshToken: refreshToken,
                        }),
                    },
                );
                if (response.status === 200) {
                    console.log("SUCCESFULY REFRESHED ACCES ROCTEN");

                    const json = await response.json();
                    await authStorage.saveRefreshToken(json.accessToken);
                }
            } catch (error) {
                console.error("Error durig refresh acces tocken", error);
            }
        }
        return Promise.reject(error);
    },
);

export default api;

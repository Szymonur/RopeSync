const DEFAULT_API_URL = "http://localhost:8443";

export const API_URL =
    process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;

import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "jwt_access_token";
const REFRESH_TOKEN_KEY = "jwt_refresh_token";

// ACCESS TOKEN

export const saveAccessToken = async (token: string): Promise<void> => {
    try {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (error) {
        console.error("Błąd podczas zapisywania Access Tokenu", error);
    }
};

export const getAccessToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
        console.error("Błąd podczas pobierania Access Tokenu", error);
        return null;
    }
};

export const removeAccessToken = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
        console.error("Błąd podczas usuwania Access Tokenu", error);
    }
};

// REFRESH TOKEN

export const saveRefreshToken = async (token: string): Promise<void> => {
    try {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
        console.error("Błąd podczas zapisywania Refresh Tokenu", error);
    }
};

export const getRefreshToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.error("Błąd podczas pobierania Refresh Tokenu", error);
        return null;
    }
};

export const removeRefreshToken = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.error("Błąd podczas usuwania Refresh Tokenu", error);
    }
};

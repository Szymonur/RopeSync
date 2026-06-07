import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "jwt_access_token";
const REFRESH_TOKEN_KEY = "jwt_refresh_token";
const CURRENT_USER_ID = "current_user_id";

// --- FUNKCJE POMOCNICZE ---

const saveItem = async (key: string, value: string, errorMessage: string): Promise<void> => {
    try {
        if (Platform.OS === "web") {
            localStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    } catch (error) {
        console.error(errorMessage, error);
    }
};

const getItem = async (key: string, errorMessage: string): Promise<string | null> => {
    try {
        if (Platform.OS === "web") {
            return localStorage.getItem(key);
        } else {
            return await SecureStore.getItemAsync(key);
        }
    } catch (error) {
        console.error(errorMessage, error);
        return null;
    }
};

const removeItem = async (key: string, errorMessage: string): Promise<void> => {
    try {
        if (Platform.OS === "web") {
            localStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    } catch (error) {
        console.error(errorMessage, error);
    }
};

// --- ACCESS TOKEN ---

export const saveAccessToken = async (token: string): Promise<void> => {
    await saveItem(ACCESS_TOKEN_KEY, token, "Błąd podczas zapisywania Access Tokenu");
};

export const getAccessToken = async (): Promise<string | null> => {
    return await getItem(ACCESS_TOKEN_KEY, "Błąd podczas pobierania Access Tokenu");
};

export const removeAccessToken = async (): Promise<void> => {
    await removeItem(ACCESS_TOKEN_KEY, "Błąd podczas usuwania Access Tokenu");
};

// --- REFRESH TOKEN ---

export const saveRefreshToken = async (token: string): Promise<void> => {
    await saveItem(REFRESH_TOKEN_KEY, token, "Błąd podczas zapisywania Refresh Tokenu");
};

export const getRefreshToken = async (): Promise<string | null> => {
    return await getItem(REFRESH_TOKEN_KEY, "Błąd podczas pobierania Refresh Tokenu");
};

export const removeRefreshToken = async (): Promise<void> => {
    await removeItem(REFRESH_TOKEN_KEY, "Błąd podczas usuwania Refresh Tokenu");
};

// --- CURRENT USER ID ---

export const saveCurrentUserId = async (userId: string): Promise<void> => {
    await saveItem(CURRENT_USER_ID, String(userId), "Błąd podczas zapisywania akutlaniego id uzytkownika");
};

export const getCurrentUserId = async (): Promise<string | null> => {
    return await getItem(CURRENT_USER_ID, "Błąd podczas pobierania akutlaniego id uzytkownika");
};

export const removeCurrentUserId = async (): Promise<void> => {
    await removeItem(CURRENT_USER_ID, "Błąd podczas usuwania akutlaniego id uzytkownika");
};
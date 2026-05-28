import React, {
    createContext,
    useState,
    useEffect,
    ReactNode,
    useContext,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as authStorage from "../lib/utils/authStorage";
import { UserService } from "../services/api/UserService";

// 1. Definiujemy kształt danych w naszym kontekście
interface AuthContextData {
    accessToken: string | null;
    refreshToken: string | null;
    currentUserId: string | null;
    isLoading: boolean;
    login: (
        accessToken: string,
        refreshToken: string,
        userId: string,
    ) => Promise<void>;
    logout: () => Promise<void>;
}

// 2. Inicjujemy kontekst (domyślnie undefined)
export const AuthContext = createContext<AuthContextData | undefined>(
    undefined,
);

// 3. Custom Hook dla super-bezpiecznego typowania w komponentach
export const useAuth = (): AuthContextData => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth musi być użyty wewnątrz AuthProvider");
    }
    return context;
};

// 4. Typy dla propsów Providera
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                const accessToken = await authStorage.getAccessToken();
                const refreshToken = await authStorage.getRefreshToken();
                const currentUserId = await authStorage.getCurrentUserId();

                if (accessToken) {
                    setAccessToken(accessToken);
                }
                if (refreshToken) {
                    setRefreshToken(refreshToken);
                }
                if (currentUserId) {
                    setCurrentUserId(currentUserId);
                }
            } catch (e) {
                console.error("Błąd inicjalizacji tokena:", e);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    const login = async (
        accesToken: string,
        refreshToken: string,
        userId: string,
    ) => {
        queryClient.clear();
        await authStorage.saveAccessToken(accesToken);
        await authStorage.saveRefreshToken(refreshToken);
        await authStorage.saveCurrentUserId(userId);
        setAccessToken(accesToken);
        setRefreshToken(refreshToken);
        setCurrentUserId(userId);
    };

    const logout = async () => {
        await authStorage.removeAccessToken();
        await authStorage.removeRefreshToken();
        await authStorage.removeCurrentUserId();
        setAccessToken(null);
        setRefreshToken(null);
        setCurrentUserId(null);
        queryClient.clear();
    };

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                refreshToken,
                currentUserId,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

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
    userToken: string | null;
    isLoading: boolean;
    login: (accessToken: string, refreshToken: string) => Promise<void>;
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
    const [userToken, setUserToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                const token = await authStorage.getAccessToken();
                if (token) {
                    // W idealnym świecie tutaj wywołujemy np. UserService.getCurrentUser()
                    // aby sprawdzić czy token jest nadal ważny.
                    setUserToken(token);
                }
                // if (token) {
                //     console.log(token);
                //     const user = await UserService.getCurrentUser();
                //     if (user) {
                //         console.log("authContext-user", user);
                //         setUserToken(token);
                //     } else {
                //         logout();
                //     }
                // }
            } catch (e) {
                console.error("Błąd inicjalizacji tokena:", e);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    const login = async (accesToken: string, refreshToken: string) => {
        await authStorage.saveAccessToken(accesToken);
        console.log(refreshToken);

        setUserToken(accesToken);
    };

    const logout = async () => {
        await authStorage.removeAccessToken();
        await authStorage.removeRefreshToken();
        setUserToken(null);
        queryClient.clear();
    };

    return (
        <AuthContext.Provider value={{ userToken, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

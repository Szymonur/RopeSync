import React, {
    createContext,
    useState,
    useEffect,
    ReactNode,
    useContext,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as authStorage from "../lib/utils/authStorage";

// 1. Definiujemy kształt danych w naszym kontekście
interface AuthContextData {
    userToken: string | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
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
            const token = await authStorage.getToken();
            if (token) {
                setUserToken(token);
            }
            setIsLoading(false);
        };

        bootstrapAsync();
    }, []);

    const login = async (token: string) => {
        await authStorage.saveToken(token);
        setUserToken(token);
    };

    const logout = async () => {
        await authStorage.removeToken();
        setUserToken(null);
        queryClient.clear();
    };

    return (
        <AuthContext.Provider value={{ userToken, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

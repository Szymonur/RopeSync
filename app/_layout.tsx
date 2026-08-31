// @ts-ignore
if (typeof WeakRef === "undefined") {
    // @ts-ignore
    global.WeakRef = class WeakRef {
        target: any;
        constructor(target: any) {
            this.target = target;
        }
        deref() {
            return this.target;
        }
    };
}

import { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import {
    Stack,
    useRouter,
    useSegments,
    usePathname,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { initializeDatabase } from "../database/db";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { NetworkProvider } from "../contexts/NetworkContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { SnackbarProvider } from "../contexts/SnackbarContext";
import { RepositoryProvider } from "../contexts/RepositoryContext";
import { useSyncManager } from "../lib/hooks/useSyncManager";
import { Colors } from "../constants/Colors";

const queryClient = new QueryClient();

const NativeSyncManager: React.FC = () => {
    useSyncManager();
    return null;
};

const DatabaseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (Platform.OS === "web") {
        return <>{children}</>;
    }

    return (
        <SQLiteProvider databaseName="ropesync.db" onInit={initializeDatabase}>
            {children}
        </SQLiteProvider>
    );
};

const InitialLayout = () => {
    const { refreshToken, currentUserId, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";

        // The password-reset screen must remain accessible without authentication.
        if (segments.includes("choose-new-password")) return;

        // Poprawiłem zależność: z !currentUserId na currentUserId
        if (!currentUserId && !refreshToken && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (currentUserId && refreshToken && inAuthGroup) {
            router.replace("/(dashboard)");
        }
    }, [refreshToken, currentUserId, isLoading, segments]);

    return (
        <View style={{ flex: 1 }}>
            {Platform.OS !== "web" && <NativeSyncManager />}
            
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: theme.navBackground,
                    },
                    headerTintColor: theme.title,
                    headerTitleStyle: { fontWeight: "bold" },
                }}
            >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="(dashboard)"
                    options={{ headerShown: false }}
                />
            </Stack>
        </View>
    );
};

const RootLayout = () => {
    const router = useRouter();
    const pathname = usePathname();
    const resetLinkHandled = useRef(false);
    const urlParams =
        Platform.OS === "web" && typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : null;
    const token = urlParams?.get("token") ?? null;

    useEffect(() => {
        if (
            Platform.OS === "web" &&
            token &&
            !pathname.includes("choose-new-password") &&
            !resetLinkHandled.current
        ) {
            resetLinkHandled.current = true;
            router.replace({
                pathname: "/(auth)/choose-new-password",
                params: { token },
            });
        }
    }, [pathname, router, token]);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <SnackbarProvider>
                    <NetworkProvider>
                        <AuthProvider>
                            <DatabaseWrapper>
                                <RepositoryProvider>
                                    <InitialLayout />
                                </RepositoryProvider>
                            </DatabaseWrapper>
                        </AuthProvider>
                    </NetworkProvider>
                </SnackbarProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

export default RootLayout;
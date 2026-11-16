if (typeof globalThis.WeakRef === "undefined") {
    // @ts-ignore
    globalThis.WeakRef = class WeakRef {
        target: any;
        constructor(target: any) {
            this.target = target;
        }
        deref() {
            return this.target;
        }
    };
}

import { useEffect, useMemo, useRef } from "react";
import { Platform, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
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

const RouteRedirects = () => {
    const { refreshToken, currentUserId, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const resetLinkHandled = useRef(false);
    const rootSegment = segments[0];
    const isPasswordResetRoute = segments.includes("choose-new-password");

    // Obsługa resetu hasła po stronie Web
    useEffect(() => {
        if (Platform.OS !== "web" || typeof window === "undefined" || resetLinkHandled.current) return;

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (token) {
            resetLinkHandled.current = true;
            router.replace({
                pathname: "/(auth)/choose-new-password",
                params: { token },
            });
        }
    }, [router]);

    // Ochrona tras
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = rootSegment === "(auth)";

        if (isPasswordResetRoute) return;

        if (!currentUserId && !refreshToken && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if ((currentUserId || refreshToken) && inAuthGroup) {
            router.replace("/(dashboard)");
        }
    }, [refreshToken, currentUserId, isLoading, rootSegment, isPasswordResetRoute]);

    return null;
};

const InitialLayout = () => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const screenOptions = useMemo(
        () => ({
            headerStyle: {
                backgroundColor: theme.navBackground,
            },
            headerTintColor: theme.title,
            headerTitleStyle: { fontWeight: "bold" as const },
        }),
        [theme],
    );

    return (
        <View style={{ flex: 1 }}>
            <RouteRedirects />
            {Platform.OS !== "web" && <NativeSyncManager />}

            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <Stack screenOptions={screenOptions}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
            </Stack>
        </View>
    );
};

// Statyczny RootLayout bez jakichkolwiek hooków nawigacyjnych
const RootLayout = () => {
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
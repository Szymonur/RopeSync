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

import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Colors } from "../constants/Colors";
import { initializeDatabase } from "../database/db";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { NetworkProvider } from "../contexts/NetworkContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

const queryClient = new QueryClient();

const InitialLayout = () => {
    const { refreshToken, currentUserId, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!currentUserId && !refreshToken && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (currentUserId && refreshToken && inAuthGroup) {
            router.replace("/(dashboard)");
        }
    }, [refreshToken, !currentUserId, isLoading, segments]);

    return (
        <>
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
        </>
    );
};

const RootLayout = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <NetworkProvider>
                    <AuthProvider>
                        <SQLiteProvider
                            databaseName="ropesync.db"
                            onInit={initializeDatabase}
                        >
                            <InitialLayout />
                        </SQLiteProvider>
                    </AuthProvider>
                </NetworkProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

export default RootLayout;

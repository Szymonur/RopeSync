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
import { StyleSheet, useColorScheme } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Colors } from "../constants/Colors";
import { initializeDatabase } from "../database/db";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

const queryClient = new QueryClient();

const InitialLayout = () => {
    const { userToken, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || "light"];

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!userToken && !inAuthGroup) {
            // Brak tokena i nie jesteśmy w logowaniu -> przekieruj do /login
            router.replace("/(auth)/login");
        } else if (userToken && inAuthGroup) {
            // Jest token i jesteśmy w logowaniu -> przekieruj do dashboardu
            router.replace("/(dashboard)");
        }
    }, [userToken, isLoading, segments]);

    return (
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
            <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        </Stack>
    );
};

const RootLayout = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <SQLiteProvider
                    databaseName="ropesync.db"
                    onInit={initializeDatabase}
                >
                    <StatusBar style="auto" />
                    <InitialLayout />
                </SQLiteProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
};

export default RootLayout;

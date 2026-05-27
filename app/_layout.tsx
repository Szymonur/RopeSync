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
import { StyleSheet, Platform, View, Text, Linking } from "react-native";
import {
    Stack,
    useRouter,
    useLocalSearchParams,
    useSegments,
} from "expo-router";
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
    if (Platform.OS === "web") {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const appUrl = `ropesync://choose-new-password?token=${token}`;
        useEffect(() => {
            window.location.replace(appUrl);
        }, []);

        return (
            <View style={styles.webContainer}>
                <Text style={styles.webTitle}>Otwieranie aplikacji...</Text>
                <Text style={styles.webText}>
                    Jeśli aplikacja nie otworzyła się automatycznie, kliknij
                    przycisk poniżej.
                </Text>
                <View style={{ marginTop: 30 }}>
                    <Text
                        style={styles.buttonText}
                        onPress={() => {
                            window.location.replace(appUrl);
                        }}
                    >
                        Otwórz w aplikacji RopeSync
                    </Text>
                </View>
            </View>
        );
    }
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

const styles = StyleSheet.create({
    webContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        padding: 20,
    },
    webTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
    },
    webText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        maxWidth: "80%",
    },
    // Dodany styl przycisku
    buttonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
        backgroundColor: "#007bff",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        overflow: "hidden",
        textAlign: "center",
    },
});

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

import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { Stack } from "expo-router";
import { Colors } from "../constants/Colors";
import { StatusBar } from "expo-status-bar";

import { SQLiteProvider } from "expo-sqlite";
import { initializeDatabase } from "../database/db";

const RootLayout = () => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || "light"];

    return (
        <>
            <SQLiteProvider
                databaseName="ropesync.db"
                onInit={initializeDatabase}
            >
                <StatusBar style="auto" />
                <Stack
                    // Options to all screens in the stack
                    screenOptions={{
                        headerStyle: { backgroundColor: theme.navBackground },
                        headerTintColor: theme.title,
                        headerTitleStyle: { fontWeight: "bold" },
                    }}
                >
                    {/* <Stack.Screen name="(auth)" options={{ headerShown: false }} /> */}
                    <Stack.Screen
                        name="(dashboard)"
                        options={{ headerShown: false }}
                    />
                </Stack>
            </SQLiteProvider>
        </>
    );
};

export default RootLayout;

const styles = StyleSheet.create({});

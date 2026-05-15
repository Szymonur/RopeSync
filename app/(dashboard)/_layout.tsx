import { Stack } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "../../constants/Colors";

const DashboardLayout = () => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.navBackground,
                },
                headerTintColor: theme.title,
                headerTitleStyle: {
                    fontWeight: "bold",
                },
                headerShadowVisible: false,
            }}
        >
            {/* Główne zakładki  */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Pozostałe zakładki  */}
            <Stack.Screen
                name="settings"
                options={{
                    title: "Settings",
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="ascent/[id]"
                options={{
                    title: "Ascent Details",
                    headerShown: true,
                }}
            />
        </Stack>
    );
};

export default DashboardLayout;

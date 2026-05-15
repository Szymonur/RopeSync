import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import Spacer from "../../components/Spacer";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "../../constants/Colors";

const Settings = () => {
    const { logout } = useAuth();
    const router = useRouter();
    const { themeMode, setThemeMode, colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const modes = [
        { id: "system", label: "System", icon: "settings-outline" },
        { id: "light", label: "Light", icon: "sunny-outline" },
        { id: "dark", label: "Dark", icon: "moon-outline" },
    ] as const;

    return (
        <ThemedView style={styles.container} safe scroll>
            <Tabs.Screen
                options={{
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ marginLeft: 15 }}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={24}
                                color={theme.title}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />
            <Spacer />
            <ThemedText title style={styles.title}>
                Settings
            </ThemedText>

            <Spacer height={30} />
            <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>
            <Spacer height={10} />

            <View
                style={[
                    styles.modeContainer,
                    { backgroundColor: theme.uiBackground },
                ]}
            >
                {modes.map((mode) => (
                    <TouchableOpacity
                        key={mode.id}
                        onPress={() => setThemeMode(mode.id)}
                        style={[
                            styles.modeButton,
                            themeMode === mode.id && {
                                backgroundColor: Colors.primary,
                            },
                        ]}
                    >
                        <Ionicons
                            name={mode.icon as any}
                            size={20}
                            color={themeMode === mode.id ? "white" : theme.text}
                        />
                        <ThemedText
                            style={[
                                styles.modeLabel,
                                {
                                    color:
                                        themeMode === mode.id
                                            ? "white"
                                            : theme.text,
                                },
                            ]}
                        >
                            {mode.label}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>

            <Spacer height={40} />

            <ThemedButton onPress={logout}>
                <ThemedText style={{ textAlign: "center", color: "white" }}>
                    Logout
                </ThemedText>
            </ThemedButton>

            <Spacer height={40} />

            <ThemedText style={styles.info}>RopeSync App v0.0.1</ThemedText>
        </ThemedView>
    );
};

export default Settings;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        opacity: 0.8,
    },
    modeContainer: {
        flexDirection: "row",
        borderRadius: 12,
        padding: 5,
        justifyContent: "space-between",
    },
    modeButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    modeLabel: {
        fontSize: 14,
        fontWeight: "500",
    },
    info: {
        textAlign: "center",
        opacity: 0.5,
        fontSize: 12,
    },
});

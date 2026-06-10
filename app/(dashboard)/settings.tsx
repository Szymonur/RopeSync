import { StyleSheet, TouchableOpacity, View, Alert, Platform } from "react-native";
import { Stack } from "expo-router";
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
    const { themeMode, setThemeMode, colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const handleLogout = () => {
        if (Platform.OS === "web") {
            const confirmed = window.confirm(
                "Czy na pewno chcesz się wylogować?\n\nUWAGA: aby zalogować się ponownie musisz być podłączony do internetu!",
            );
            if (confirmed) {
                logout();
            }
            return;
        }

        Alert.alert(
            "Czy na pewno chcesz się wylogować?",
            "UWAGA: aby zalogować się ponownie musisz być podłączony do internetu!",
            [
                {
                    text: "Cofnij",
                },
                {
                    text: "Wyloguj",
                    onPress: logout,
                },
            ],
        );
    };

    const modes = [
        { id: "system", label: "System", icon: "settings-outline" },
        { id: "light", label: "Jasny", icon: "sunny-outline" },
        { id: "dark", label: "Ciemny", icon: "moon-outline" },
    ] as const;

    return (
        <ThemedView style={styles.container} safe scroll>
            <Stack.Screen options={{ title: "Ustawienia" }} />

            <Spacer />
            <ThemedText title style={styles.title}>
                Ustawienia
            </ThemedText>

            <Spacer height={30} />
            <ThemedText style={styles.sectionTitle}>Wygląd</ThemedText>
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
                            {" "}
                            {mode.label}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>

            <Spacer height={40} />

            <ThemedButton onPress={handleLogout}>
                <ThemedText style={{ textAlign: "center", color: "white" }}>
                    Wyloguj
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
        paddingVertical: 5,
        justifyContent: "space-between",
    },
    modeButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 8,
        marginHorizontal: 5,
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

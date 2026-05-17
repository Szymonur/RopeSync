import { StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedButton from "../../../components/ThemedButton";
import { useTheme } from "../../../contexts/ThemeContext";
import { Colors } from "../../../constants/Colors";

import { useAuth } from "../../../contexts/AuthContext";

import { useMe } from "../../../lib/hooks/useProfile";

const Profile = () => {
    const { logout } = useAuth();
    const { data: profile, isLoading, error } = useMe();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    if (isLoading)
        return (
            <ThemedView style={styles.container} safe>
                <ThemedText>Ładowanie...</ThemedText>
            </ThemedView>
        );
    if (error)
        return (
            <ThemedView style={styles.container} safe>
                <ThemedText title={true} style={styles.heading}>
                    Coś poszło nie tak!
                </ThemedText>
                <Spacer />
                <ThemedButton onPress={logout}>
                    <ThemedText style={{ textAlign: "center" }}>
                        Wyloguj
                    </ThemedText>
                </ThemedButton>
            </ThemedView>
        );

    return (
        <ThemedView style={styles.container}>
            <Tabs.Screen
                options={{
                    headerTitle: `${profile?.firstName} ${profile?.lastName}`,
                    tabBarLabel: "Profile",
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => router.push("/(dashboard)/settings")}
                            style={{ marginRight: 15 }}
                        >
                            <Ionicons
                                name="settings-outline"
                                color={theme.iconColour}
                                size={24}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />

            <Spacer />
            {/* Tutaj możesz dodać resztę zawartości profilu */}
        </ThemedView>
    );
};

export default Profile;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
    },
    heading: {
        fontWeight: "bold",
        fontSize: 24,
        textAlign: "right",
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
});

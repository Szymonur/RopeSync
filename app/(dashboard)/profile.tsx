import { StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";

import { useAuth } from "../../contexts/AuthContext";

import { useMe } from "../../lib/hooks/useProfile";

const Profile = () => {
    const { logout } = useAuth();
    const { data: profile, isLoading, error } = useMe();

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
                    title: `${profile?.firstName} ${profile?.lastName}`,
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={logout}
                            style={{ marginRight: 15 }}
                        >
                            <Ionicons name="log-out-outline" size={24} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <Spacer />
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

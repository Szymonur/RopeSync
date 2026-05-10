import { StyleSheet, Alert } from "react-native";

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
        <ThemedView style={styles.container} safe>
            <ThemedText title={true} style={styles.heading}>
                Profile
            </ThemedText>
            <Spacer />

            <ThemedText>Welcome {profile?.username}</ThemedText>
            <ThemedText>role: {profile?.role}</ThemedText>
            <ThemedText>id: {profile?.id}</ThemedText>

            <ThemedButton onPress={logout}>
                <ThemedText style={{ textAlign: "center" }}>Wyloguj</ThemedText>
            </ThemedButton>
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
        fontSize: 18,
        textAlign: "center",
    },
});

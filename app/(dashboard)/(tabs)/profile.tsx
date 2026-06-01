import {
    StyleSheet,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedButton from "../../../components/ThemedButton";
import { useTheme } from "../../../contexts/ThemeContext";
import { Colors } from "../../../constants/Colors";

import { useSQLiteContext } from "expo-sqlite";

import {
    AscentRepository,
    Ascent,
} from "../../../database/repositories/AscentRepository";

import {
    UserRepository,
    User,
} from "../../../database/repositories/UserRepository";

import ProfileStats from "../../../components/ProfileStats";

import { useAuth } from "../../../contexts/AuthContext";

import { useMe } from "../../../lib/hooks/useProfile";
import { useState, useEffect, useMemo } from "react";

const Profile = () => {
    const { logout } = useAuth();
    const router = useRouter();

    const [userLoading, setUserLoading] = useState(true);
    const [ascentsLoading, setAscentsLoading] = useState(true);

    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const { currentUserId: userId } = useAuth();
    const currentUserId = Number(userId);

    const db = useSQLiteContext();
    const ascentRepository = useMemo(() => new AscentRepository(db), [db]);
    const [ascents, setAscents] = useState<Ascent[]>([]);

    const userRepository = useMemo(() => new UserRepository(db), [db]);
    const [user, setUser] = useState<User>();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            if (!currentUserId) {
                console.error(
                    "Brak id uzytkownia przed probą pobrania przejsć dla czczegółów profilu!",
                );
                return;
            }
            try {
                const data = await userRepository.getUserInfo(currentUserId);
                await setUser(data);
                setUserLoading(false);
            } catch (e) {
                console.error("Błąd podczas pobierania przejść w profilu: ", e);
            }
        };
        fetchCurrentUser();
    }, [currentUserId]);

    useEffect(() => {
        const fetchAscents = async () => {
            if (!currentUserId) {
                console.error(
                    "Brak id uzytkownia przed probą pobrania przejsć dla czczegółów profilu!",
                );
                return;
            }
            try {
                const data =
                    await ascentRepository.getAscentsForUser(currentUserId);
                await setAscents(data);
                setAscentsLoading(false);
            } catch (e) {
                console.error("Błąd podczas pobierania przejść w profilu: ", e);
            }
        };
        fetchAscents();
    }, [currentUserId, ascentRepository]);

    if (userLoading)
        return (
            <ThemedView style={styles.container} safe>
                <Tabs.Screen
                    options={{
                        tabBarLabel: "Profile",
                        headerRight: () => (
                            <TouchableOpacity
                                onPress={() =>
                                    router.push("/(dashboard)/settings")
                                }
                                style={{ marginRight: 20 }}
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
                <ActivityIndicator
                    size="large"
                    color={theme.iconColourFocused}
                />
            </ThemedView>
        );

    return (
        <ThemedView style={styles.container}>
            <Tabs.Screen
                options={{
                    headerTitle: `${user?.imie} ${user?.nazwisko}`,
                    tabBarLabel: "Profile",
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => router.push("/(dashboard)/settings")}
                            style={{ marginRight: 20 }}
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
            {ascentsLoading ? (
                <ActivityIndicator
                    size="large"
                    color={theme.iconColourFocused}
                />
            ) : (
                <ProfileStats ascents={ascents} />
            )}
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
        textAlign: "center",
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
});

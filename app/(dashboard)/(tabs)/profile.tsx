import {
    StyleSheet,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
    View,
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

import { ReactionRepository } from "../../../database/repositories/ReactionRepository";

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

    const reactionRepository = useMemo(() => new ReactionRepository(db), [db]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!currentUserId) return;
            try {
                const count =
                    await reactionRepository.getUnreadCount(currentUserId);
                console.log("count: ", count);

                setUnreadCount(count);
            } catch (e) {
                console.error(
                    "Błąd podczas pobierania liczby powiadomień: ",
                    e,
                );
            }
        };
        fetchUnreadCount();
    }, [currentUserId, reactionRepository]);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            if (!currentUserId) {
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

    const handleNotificationsPress = () => {
        router.push("/(dashboard)/notifications");
    };

    if (userLoading)
        return (
            <ThemedView style={styles.container} safe>
                <Tabs.Screen
                    options={{
                        tabBarLabel: "Profile",
                        headerRight: () => (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
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
                            </View>
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
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <TouchableOpacity
                                onPress={handleNotificationsPress}
                                style={{ marginRight: 15 }}
                            >
                                <View>
                                    <Ionicons
                                        name="notifications-outline"
                                        color={theme.iconColour}
                                        size={24}
                                    />
                                    {unreadCount > 0 && (
                                        <View
                                            style={[
                                                styles.badge,
                                                {
                                                    backgroundColor:
                                                        Colors.error,
                                                },
                                            ]}
                                        >
                                            <ThemedText
                                                style={styles.badgeText}
                                            >
                                                {unreadCount}
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
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
                        </View>
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
    badge: {
        position: "absolute",
        right: -6,
        top: -3,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
    },
    badgeText: {
        color: "white",
        fontSize: 10,
        fontWeight: "bold",
    },
});

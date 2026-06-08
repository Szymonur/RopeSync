import {
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    View,
    RefreshControl,
} from "react-native";
import { Tabs, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import { useTheme } from "../../../contexts/ThemeContext";
import { Colors } from "../../../constants/Colors";

import { User } from "../../../types/user"

import ProfileStats from "../../../components/ProfileStats";

import { useAuth } from "../../../contexts/AuthContext";
import { useUserStats } from "../../../lib/hooks/useAscents";

import { useState } from "react";

const Profile = () => {
    const { logout } = useAuth();
    const router = useRouter();


    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const { currentUserId: userId } = useAuth();
    const currentUserId = Number(userId);

    // Nowy hook statystyk
    const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching } = useUserStats(currentUserId);

    // const db = useSQLiteContext();
    const [user, setUser] = useState<User>();

    // const reactionRepository = useMemo(() => new ReactionRepository(db), [db]);
    const [unreadCount, setUnreadCount] = useState(0);

    // const fetchUnreadCount = useCallback(async () => {
    //     if (!currentUserId) return;
    //     try {
    //         const count =
    //             await reactionRepository.getUnreadCount(currentUserId);
    //         setUnreadCount(count);
    //     } catch (e) {
    //         console.error("Błąd podczas pobierania liczby powiadomień: ", e);
    //     }
    // }, [currentUserId, reactionRepository]);


    const handleRefresh = async () => {
        await Promise.all([
            refetchStats(),
            // fetchUnreadCount(),
        ]);
    };

    // useFocusEffect(
    //     useCallback(() => {
    //         fetchUnreadCount();
    //     }, [fetchUnreadCount]),
    // );

    const handleNotificationsPress = () => {
        router.push("/(dashboard)/notifications");
    };

    if (statsLoading)
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
                    headerTitle: "Profile", // TODO - add firstName and lastName od current login user
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
            {statsLoading && !stats ? (
                <ActivityIndicator
                    size="large"
                    color={theme.iconColourFocused}
                />
            ) : stats ? (
                <ProfileStats
                    stats={stats}
                    isLoading={isRefetching}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={handleRefresh}
                            colors={[theme.iconColour]}
                            tintColor={theme.iconColour}
                        />
                    }
                />
            ) : (
                <ThemedText>Błąd ładowania statystyk</ThemedText>
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

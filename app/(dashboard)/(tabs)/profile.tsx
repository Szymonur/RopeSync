import {
    StyleSheet,
    TouchableOpacity,
    View,
    RefreshControl,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import { useTheme } from "../../../contexts/ThemeContext";
import DelayedActivityIndicator from "../../../components/DelayedActivityIndicator"
import { Colors } from "../../../constants/Colors";

import ProfileStats from "../../../components/ProfileStats";

import { useAuth } from "../../../contexts/AuthContext";
import { useUserStats } from "../../../lib/hooks/useAscents";
import { useCurrentUser} from "../../../lib/hooks/useUsers";
import { useUnreadReactionsCount } from "../../../lib/hooks/useReactions";

const Profile = () => {
    const router = useRouter();

    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const { currentUserId: userId } = useAuth();
    const currentUserId = Number(userId);

    const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching } = useUserStats(currentUserId); 
    const { data: user, isLoading: userLoading } = useCurrentUser(currentUserId);
    const { data: unreadCount = 0, refetch: refetchUnreadCount } = useUnreadReactionsCount(currentUserId);

    const handleRefresh = async () => {
        await Promise.all([
            refetchStats(),
            refetchUnreadCount(),
        ]);
    };

    const handleNotificationsPress = () => {
        router.push("/(dashboard)/notifications");
    };


    return (
        <ThemedView style={styles.container}>
            <Tabs.Screen
                options={{
                    headerTitle: userLoading ? "Profil" : `${user?.firstName} ${user?.lastName}`,
                    tabBarLabel: "Ty",
                    headerRight: () => (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                                        <View style={[styles.badge, { backgroundColor: Colors.error }]}>
                                            <ThemedText style={styles.badgeText}>
                                                {unreadCount}
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
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
                        </View>
                    ),
                }}
            />
            
            {statsLoading ? (
                <DelayedActivityIndicator 
                    isLoading={statsLoading} 
                    size="large" 
                    color={theme.iconColourFocused} 
                    style={{ marginTop: 20 }} 
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
                <DelayedActivityIndicator 
                    isLoading={statsLoading} 
                    size="large" 
                    color={theme.iconColourFocused} 
                    style={{ marginTop: 20 }} 
                />
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

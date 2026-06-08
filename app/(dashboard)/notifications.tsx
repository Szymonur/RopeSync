import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useRepositories } from "../../contexts/RepositoryContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "../../constants/Colors";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedCard from "../../components/ThemedCard";
import { Ionicons } from "@expo/vector-icons";
import { ReactionNotification } from "../../types/reaction";

export default function NotificationsScreen() {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const { currentUserId } = useAuth();
    const { reactionRepository: repo } = useRepositories();
    const router = useRouter();

    const [notifications, setNotifications] = useState<ReactionNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndMark = async () => {
            if (!currentUserId) return;
            try {
                // Fetch latest notifications
                const items = await repo.getNotifications(
                    Number(currentUserId),
                );
                setNotifications(items);

                // Mark them as read locally so the badge clears
                await repo.markAllAsRead(Number(currentUserId));
            } catch (error) {
                console.error("Error fetching notifications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndMark();
    }, [currentUserId, repo]);

    const formatDate = (value: string) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat("pl-PL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    if (loading) {
        return (
            <ThemedView style={styles.center}>
                <ActivityIndicator
                    size="large"
                    color={theme.iconColourFocused}
                />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: "Powiadomienia" }} />

            {notifications.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons
                        name="notifications-off-outline"
                        size={48}
                        color={theme.iconColour}
                        style={{ marginBottom: 16 }}
                    />
                    <ThemedText style={{ opacity: 0.7 }}>
                        Brak powiadomień
                    </ThemedText>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <ThemedCard
                            style={[
                                styles.card,
                                item.wyswietlono === 0 && {
                                    borderColor: theme.iconColourFocused,
                                    borderWidth: 1,
                                },
                            ]}
                        >
                            <View style={styles.row}>
                                <View style={styles.iconContainer}>
                                    <Ionicons
                                        name="heart"
                                        size={24}
                                        color={Colors.error}
                                    />
                                </View>
                                <View style={styles.textContainer}>
                                    <ThemedText style={styles.mainText}>
                                        <ThemedText
                                            style={{ fontWeight: "bold" }}
                                        >
                                            {item.imie} {item.nazwisko} (@
                                            {item.username})
                                        </ThemedText>{" "}
                                        polubił(a) twoje przejście drogi{" "}
                                        <ThemedText
                                            style={{ fontWeight: "bold" }}
                                        >
                                            {item.nazwa_drogi}
                                        </ThemedText>
                                    </ThemedText>
                                    <ThemedText style={styles.timeText}>
                                        {formatDate(item.data_reakcji)}
                                    </ThemedText>
                                </View>
                                {item.wyswietlono === 0 && (
                                    <View
                                        style={[
                                            styles.unreadDot,
                                            {
                                                backgroundColor:
                                                    theme.iconColourFocused,
                                            },
                                        ]}
                                    />
                                )}
                            </View>
                        </ThemedCard>
                    )}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        padding: 16,
    },
    card: {
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    mainText: {
        fontSize: 14,
        lineHeight: 20,
    },
    timeText: {
        fontSize: 12,
        marginTop: 4,
        opacity: 0.6,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 12,
    },
});

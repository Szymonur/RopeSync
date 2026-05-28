import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";

import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import ThemedTextInput from "../../../components/ThemedTextInput";
import ThemedButton from "../../../components/ThemedButton";
import ThemedCard from "../../../components/ThemedCard";
import Spacer from "../../../components/Spacer";

import { Colors } from "../../../constants/Colors";
import { useTheme } from "../../../contexts/ThemeContext";
import { SearchUser, UserService } from "../../../services/api/UserService";

const SearchUsers = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const [phrase, setPhrase] = useState("");
    const [users, setUsers] = useState<SearchUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [busyUserId, setBusyUserId] = useState<number | null>(null);

    const loadUsers = async (query: string) => {
        const trimmed = query.trim();

        if (trimmed.length < 2) {
            setUsers([]);
            return;
        }

        try {
            setLoading(true);
            const result = await UserService.searchUsers(trimmed);
            setUsers(result);
        } catch (error) {
            console.error("Błąd wyszukiwania użytkowników:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadUsers(phrase);
        }, 300);

        return () => clearTimeout(timeout);
    }, [phrase]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUsers(phrase);
        setRefreshing(false);
    };

    const onToggleFollow = async (user: SearchUser) => {
        try {
            setBusyUserId(user.id);

            if (user.isFollowing) {
                await UserService.unfollowUser(user.id);
            } else {
                await UserService.followUser(user.id);
            }

            await queryClient.invalidateQueries({ queryKey: ["following-feed"] });

            setUsers((prev) =>
                prev.map((item) =>
                    item.id === user.id
                        ? { ...item, isFollowing: !item.isFollowing }
                        : item,
                ),
            );
        } catch (error) {
            console.error("Błąd podczas zmiany obserwacji:", error);
        } finally {
            setBusyUserId(null);
        }
    };

    return (
        <ThemedView style={styles.container} safe>
            <Stack.Screen
                options={{
                    title: "Szukaj użytkowników",
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => router.replace("/(dashboard)/(tabs)")}
                            style={styles.closeButton}
                            accessibilityRole="button"
                            accessibilityLabel="Zamknij wyszukiwanie"
                        >
                            <Ionicons
                                name="close"
                                size={28}
                                color={theme.iconColour}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ThemedTextInput
                value={phrase}
                onChangeText={setPhrase}
                placeholder="Wpisz min. 2 znaki..."
                autoCapitalize="none"
            />
            <Spacer height={10} />

            {loading && (
                <ActivityIndicator size="small" color={theme.iconColour} />
            )}

            {!loading && phrase.trim().length >= 2 && users.length === 0 && (
                <ThemedText style={styles.emptyText}>
                    Brak wyników dla tej frazy.
                </ThemedText>
            )}

            <FlatList
                data={users}
                keyExtractor={(item) => String(item.id)}
                style={{ width: "100%" }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.iconColour]}
                        tintColor={theme.iconColour}
                    />
                }
                renderItem={({ item }) => {
                    const isBusy = busyUserId === item.id;

                    return (
                        <ThemedCard style={styles.userCard}>
                            <View style={styles.rowTop}>
                                <View>
                                    <ThemedText style={styles.nameText}>
                                        {item.firstName} {item.lastName}
                                    </ThemedText>
                                    <ThemedText style={styles.usernameText}>
                                        @{item.username}
                                    </ThemedText>
                                </View>

                                <ThemedButton
                                    style={[
                                        styles.followButton,
                                        item.isFollowing && {
                                            backgroundColor: theme.uiBackground,
                                            borderWidth: 1,
                                            borderColor: theme.iconColour,
                                        },
                                    ]}
                                    onPress={() => onToggleFollow(item)}
                                    disabled={isBusy}
                                >
                                    <ThemedText
                                        style={{
                                            textAlign: "center",
                                            color: item.isFollowing
                                                ? theme.text
                                                : "white",
                                        }}
                                    >
                                        {isBusy
                                            ? "..."
                                            : item.isFollowing
                                              ? "Obserwujesz"
                                              : "Obserwuj"}
                                    </ThemedText>
                                </ThemedButton>
                            </View>
                        </ThemedCard>
                    );
                }}
                ListEmptyComponent={
                    phrase.trim().length < 2 ? (
                        <ThemedText style={styles.emptyText}>
                            Zacznij wpisywać, aby wyszukać użytkowników.
                        </ThemedText>
                    ) : null
                }
            />
        </ThemedView>
    );
};

export default SearchUsers;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    userCard: {
        marginBottom: 10,
    },
    rowTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    nameText: {
        fontSize: 16,
        fontWeight: "600",
    },
    usernameText: {
        opacity: 0.8,
        fontSize: 13,
    },
    followButton: {
        marginVertical: 0,
        paddingVertical: 10,
        minWidth: 118,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 16,
        opacity: 0.8,
    },
    closeButton: {
        marginRight: 12,
    },
});

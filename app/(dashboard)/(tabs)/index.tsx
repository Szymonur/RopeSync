import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";

import Spacer from "../../../components/Spacer";
import ThemedCard from "../../../components/ThemedCard";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import { Colors } from "../../../constants/Colors";
import { useTheme } from "../../../contexts/ThemeContext";
import { UserService } from "../../../services/api/UserService";

const Index = () => {
    const router = useRouter();
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const {
        data: feed = [],
        isLoading,
        refetch,
        isRefetching,
    } = useQuery({
        queryKey: ["following-feed"],
        queryFn: UserService.getFollowingFeed,
        staleTime: 1000 * 30,
    });

    const formatDate = (value: string) => {
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

    return (
        <ThemedView safe>
            <Tabs.Screen
                options={{
                    title: "Home",
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() =>
                                router.push("/(dashboard)/(tabs)/search-users")
                            }
                            style={{ marginLeft: 12 }}
                        >
                            <Ionicons
                                name="search-outline"
                                size={26}
                                color={theme.iconColourFocused}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />
            <FlatList
                data={feed}
                keyExtractor={(item) => item.ascentId}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        colors={[theme.iconColourFocused]}
                        tintColor={theme.iconColourFocused}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.headerBlock}>
                        <ThemedText style={styles.heading}>Home</ThemedText>
                        <ThemedText style={styles.subheading}>
                            Przejścia osób, które obserwujesz
                        </ThemedText>
                    </View>
                }
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator size="large" color={theme.iconColourFocused} />
                    ) : (
                        <ThemedCard style={styles.emptyCard}>
                            <ThemedText style={styles.emptyTitle}>
                                Brak aktywności do pokazania
                            </ThemedText>
                            <ThemedText style={styles.emptyText}>
                                Obserwuj znajomych, a ich przejścia pojawią się tutaj.
                            </ThemedText>
                        </ThemedCard>
                    )
                }
                renderItem={({ item }) => (
                    <ThemedCard style={styles.feedCard}>
                        <View style={styles.authorRow}>
                            <View
                                style={[
                                    styles.avatar,
                                    { borderColor: theme.iconColourFocused },
                                ]}
                            >
                                <Ionicons
                                    name="person-outline"
                                    size={26}
                                    color={theme.iconColourFocused}
                                />
                            </View>
                            <View style={styles.authorTextBlock}>
                                <ThemedText style={styles.authorName}>
                                    {item.firstName} {item.lastName}
                                </ThemedText>
                                <ThemedText style={styles.authorMeta}>
                                    @{item.username} · {formatDate(item.date)}
                                </ThemedText>
                            </View>
                        </View>

                        <ThemedText style={styles.routeName}>
                            {item.routeName}
                        </ThemedText>

                        <View style={styles.routeMetaRow}>
                            <ThemedText style={styles.routeType}>
                                {item.grade ?? "-"}
                            </ThemedText>
                            <ThemedText style={styles.routeType}>
                                {item.routeType}
                            </ThemedText>
                        </View>
                    </ThemedCard>
                )}
            />
        </ThemedView>
    );
};

export default Index;

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    headerBlock: {
        paddingTop: 12,
        paddingBottom: 10,
    },
    heading: {
        fontWeight: "bold",
        fontSize: 24,
    },
    subheading: {
        marginTop: 4,
        opacity: 0.75,
    },
    feedCard: {
        marginBottom: 12,
        padding: 16,
    },
    authorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    authorTextBlock: {
        flex: 1,
    },
    authorName: {
        fontSize: 16,
        fontWeight: "700",
    },
    authorMeta: {
        marginTop: 2,
        opacity: 0.72,
        fontSize: 12,
    },
    routeName: {
        fontSize: 22,
        fontWeight: "600",
        lineHeight: 28,
        marginBottom: 14,
    },
    routeMetaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    routeType: {
        fontSize: 15,
        fontWeight: "600",
        opacity: 0.9,
    },
    emptyCard: {
        marginTop: 24,
        padding: 18,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },
    emptyText: {
        opacity: 0.8,
        lineHeight: 20,
    },
});

import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";

import ThemedCard from "../../../components/ThemedCard";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import { Colors } from "../../../constants/Colors";
import { useTheme } from "../../../contexts/ThemeContext";
import { UserService } from "../../../services/api/UserService";

import RouteTypeBadge from "../../../components/Badges/RouteTypeBadge";
import RouteGradeBadge from "../../../components/Badges/RouteGradeBadge";
import RouteStyleBadge from "../../../components/Badges/RouteStyleBadge";
import ThemedEmptyState from "../../../components/ThemedEmptyState";

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
        }).format(date);
    };

    return (
        <ThemedView>
            <Tabs.Screen
                options={{
                    title: "Home",
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() =>
                                router.push("/(dashboard)/search-users")
                            }
                            style={{ marginRight: 20 }}
                        >
                            <Ionicons
                                name="search"
                                color={theme.iconColour}
                                size={24}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />
            <FlatList
                data={feed}
                keyExtractor={(item) => item.ascentId}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        colors={[theme.iconColour]}
                        tintColor={theme.iconColour}
                    />
                }
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator
                            size="large"
                            color={theme.iconColourFocused}
                        />
                    ) : (
                        <ThemedEmptyState
                            title="Czas zapełnić ten widok!"
                            description={[
                                "Nie widzisz jeszcze żadnych przejść.",
                                "Dodaj znajomych do obserwowanych, żeby śledzić ich kolejne kroki.",
                            ]}
                            buttonLabel="Szukaj znajomych"
                            onButtonPress={() =>
                                router.push("/(dashboard)/search-users")
                            }
                        />
                    )
                }
                renderItem={({ item }) => (
                    <ThemedCard style={styles.feedCard}>
                        <View style={styles.authorRow}>
                            <View
                                style={[
                                    styles.avatar,
                                    {
                                        borderColor: theme.text,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="person-outline"
                                    size={26}
                                    color={theme.text}
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
                        {item.note && (
                            <>
                                <ThemedText style={styles.routeNote}>
                                    {item.note}
                                </ThemedText>
                            </>
                        )}
                        <View style={styles.routeMetaRow}>
                            {item.routeType && (
                                <RouteTypeBadge route_type={item.routeType} />
                            )}

                            {item.grade && (
                                <RouteGradeBadge route_grade={item.grade} />
                            )}
                            {item.style && (
                                <RouteStyleBadge route_style={item.style} />
                            )}
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
        paddingVertical: 12,
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
        fontSize: 18,
        fontWeight: "600",
        lineHeight: 28,
        marginBottom: 10,
    },
    routeNote: {
        fontSize: 12,
        fontWeight: "400",
        marginBottom: 12,
    },
    routeMetaRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
    },
    routeType: {
        fontSize: 15,
        fontWeight: "600",
        opacity: 0.9,
    },
});

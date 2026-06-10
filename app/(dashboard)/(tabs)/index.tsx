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

import ThemedCard from "../../../components/ThemedCard";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import { Colors } from "../../../constants/Colors";
import { useTheme } from "../../../contexts/ThemeContext";
import { useNetwork } from "../../../contexts/NetworkContext";

import RouteTypeBadge from "../../../components/Badges/RouteTypeBadge";
import RouteGradeBadge from "../../../components/Badges/RouteGradeBadge";
import RouteStyleBadge from "../../../components/Badges/RouteStyleBadge";
import ThemedEmptyState from "../../../components/ThemedEmptyState";
import LikeButton from "../../../components/LikeButton";

import { useSnackbar } from "../../../contexts/SnackbarContext";
import { useState } from "react";
import { useFollowingFeed } from "../../../lib/hooks/useAscents";


const Index = () => {
    const router = useRouter();
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const { isConnected } = useNetwork();
    const { showSnackbar } = useSnackbar();

    const {
        data: feed = [],
        isLoading,
        refetch,
        isRefetching,
    } = useFollowingFeed();

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
        <ThemedView style={{ flex: 1 }}>
            <Tabs.Screen
                options={{
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
                keyExtractor={(item) => item.id_przejscia}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        colors={[theme.iconColour]}
                        tintColor={theme.iconColour}
                        enabled={isConnected !== false}
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
                            title={
                                isConnected === false
                                    ? "Jesteś offline"
                                    : "Czas zapełnić ten widok!"
                            }
                            description={
                                isConnected === false
                                    ? "Nie możemy pobrać nowych postów. Sprawdź swoje połączenie."
                                    : [
                                          "Nie widzisz jeszcze żadnych przejść.",
                                          "Dodaj znajomych do obserwowanych, żeby śledzić ich kolejne kroki.",
                                      ]
                            }
                            buttonLabel={
                                isConnected === false
                                    ? "Spróbuj odświeżyć"
                                    : "Szukaj znajomych"
                            }
                            onButtonPress={() =>
                                isConnected === false
                                    ? refetch()
                                    : router.push("/(dashboard)/search-users")
                            }
                        />
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => {
                            isConnected
                                ? router.push(
                                      `/(dashboard)/ascent/${item.id_przejscia}?userId=${item.id_uzytkownika}`,
                                  )
                                : showSnackbar({
                                      message:
                                          "Aby zobaczyć szczegóły przejscia potrzebujesz podłączenia do internetu!",
                                      type: "warn",
                                  });
                        }}
                    >
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
                                        {item.imie} {item.nazwisko}
                                    </ThemedText>
                                    <ThemedText style={styles.authorMeta}>
                                        @{item.username} ·{" "}
                                        {formatDate(item.data)}
                                    </ThemedText>
                                </View>
                            </View>

                            <ThemedText style={styles.routeName}>
                                {item.nazwa_drogi}
                            </ThemedText>
                            {item.notatka && (
                                <>
                                    <ThemedText style={styles.routeNote}>
                                        {item.notatka}
                                    </ThemedText>
                                </>
                            )}
                            <View style={styles.routeMetaRow}>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        flex: 1,
                                        gap: 4,
                                    }}
                                >
                                    {item.typ_drogi && (
                                        <RouteTypeBadge
                                            route_type={item.typ_drogi}
                                        />
                                    )}

                                    {item.wycena && (
                                        <RouteGradeBadge
                                            route_grade={item.wycena}
                                        />
                                    )}
                                    {item.nazwa_stylu && (
                                        <RouteStyleBadge
                                            route_style={item.nazwa_stylu}
                                        />
                                    )}
                                </View>

                                <LikeButton
                                    isLiked={item.isLiked}
                                    ascentId={item.id_przejscia}
                                    theme={theme}
                                    isConnected={isConnected ? true : false}
                                    showSnackbar={showSnackbar}
                                />
                            </View>
                        </ThemedCard>
                    </TouchableOpacity>
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
        justifyContent: "space-between",
        alignItems: "center",
    },
    routeType: {
        fontSize: 15,
        fontWeight: "600",
        opacity: 0.9,
    },
    offlineNotice: {
        textAlign: "center",
        paddingVertical: 8,
        fontSize: 12,
        opacity: 0.6,
    },
    likeButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    likesCount: {
        fontSize: 14,
        fontWeight: "500",
    },
});

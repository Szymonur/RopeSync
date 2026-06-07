import {
    StyleSheet,
    FlatList,
    TouchableOpacity,
    View,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Colors } from "../../../constants/Colors";
import { useTheme } from "../../../contexts/ThemeContext";

import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedCard from "../../../components/ThemedCard";
import ManualAscentFormModal from "../../../components/ManualAscentFormModal";

import ThemedEmptyState from "../../../components/ThemedEmptyState";

import { useAscents } from "../../../lib/hooks/useAscents";

import RouteTypeBadge from "../../../components/Badges/RouteTypeBadge";
import RouteGradeBadge from "../../../components/Badges/RouteGradeBadge";
import RouteStyleBadge from "../../../components/Badges/RouteStyleBadge";

const Ascents = () => {
    const { data: ascents, isLoading, refetch, isRefetching } = useAscents();
    const [formVisible, setFormVisible] = useState(false);
    const router = useRouter();

    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const onRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    return (
        <ThemedView style={styles.container}>
            <ManualAscentFormModal
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSuccess={() => refetch()}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setFormVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Dodaj przejście"
            >
                <ThemedText style={styles.fabIcon}>+</ThemedText>
            </TouchableOpacity>

            <FlatList
                data={ascents}
                keyExtractor={(item) => item.id_przejscia}
                showsVerticalScrollIndicator={false}
                style={{ width: "100%", paddingVertical: 7 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={onRefresh}
                        colors={[theme.iconColour]}
                        tintColor={theme.iconColour}
                    />
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() =>
                            router.push(
                                `/(dashboard)/ascent/${item.id_przejscia}`,
                            )
                        }
                    >
                        <ThemedCard style={styles.card}>
                            <View style={styles.rowTop}>
                                <View
                                    style={{
                                        flex: 1,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <ThemedText style={styles.heading}>
                                        {item.nazwa_drogi ?? "Bez nazwy"}
                                    </ThemedText>
                                    {item.synced === 0 && (
                                        <Ionicons
                                            name="cloud-offline-outline"
                                            size={16}
                                            color={theme.iconColour}
                                            opacity={0.6}
                                        />
                                    )}
                                </View>
                                <ThemedText>{item.data}</ThemedText>
                            </View>
                            <ThemedText style={styles.note}>
                                {item.notatka}
                            </ThemedText>
                            <View style={styles.row}>
                                <RouteTypeBadge
                                    route_type={item.typ_drogi ?? ""}
                                />
                                <RouteGradeBadge
                                    route_grade={item.wycena ?? ""}
                                />
                                <RouteStyleBadge
                                    route_style={item.nazwa_stylu ?? ""}
                                />
                            </View>
                        </ThemedCard>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator
                            size="large"
                            color={theme.iconColourFocused}
                        />
                    ) : (
                        <ThemedEmptyState
                            title="Twoja księga przejść jest jeszcze czysta"
                            description={[
                                "Każda droga zaczyna się od pierwszego kroku.",
                                "Zapisz swoje ostatnie przejście, aby zacząć budować swoją historię.",
                            ]}
                            buttonLabel="Dodaj pierwsze przejście"
                            onButtonPress={() => setFormVisible(true)}
                        />
                    )
                }
            />
        </ThemedView>
    );
};

export default Ascents;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 24,
        zIndex: 20,
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primary,
        elevation: 5,
    },
    fabIcon: {
        color: "white",
        fontSize: 28,
        fontWeight: "800",
        lineHeight: 30,
    },
    heading: {
        fontWeight: "bold",
        fontSize: 18,
    },
    card: {
        padding: 15,
        marginVertical: 5,
    },
    rowTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
    },
    bold: {
        fontWeight: "bold",
        fontSize: 16,
    },
    row: {
        display: "flex",
        flexDirection: "row",
        marginTop: 12,
    },
    note: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: "400",
    },
});

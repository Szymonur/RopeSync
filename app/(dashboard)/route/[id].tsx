import { StyleSheet, ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState, useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
    RouteRepository,
    RouteDetails,
} from "../../../database/repositories/RouteRepository";
import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import Spacer from "../../../components/Spacer";
import ThemedCard from "../../../components/ThemedCard";
import { Colors } from "../../../constants/Colors";

const RouteDetail = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const db = useSQLiteContext();
    const [route, setRoute] = useState<RouteDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const repository = useMemo(() => new RouteRepository(db), [db]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                const data = await repository.getRouteDetails(id);
                setRoute(data);
            } catch (error) {
                console.error("Błąd ładowania szczegółów drogi:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <ThemedView
                style={[styles.container, { justifyContent: "center" }]}
                safe
            >
                <ActivityIndicator size="large" color={Colors.primary} />
            </ThemedView>
        );
    }

    if (!route) {
        return (
            <ThemedView style={styles.container}>
                <Stack.Screen options={{ title: "Not Found" }} />
                <Spacer />
                <ThemedText title style={styles.title}>
                    Route does not exist
                </ThemedText>
            </ThemedView>
        );
    }
    const headerTitle = `${route.nazwa_rejonu}/${route.nazwa_sektoru}`;

    return (
        <ThemedView style={styles.container} scroll>
            <Stack.Screen
                options={{
                    title: headerTitle,
                    headerTitleStyle: {
                        fontSize: 16,
                    },
                }}
            />
            <Spacer height={16} />
            <ThemedText title style={styles.title}>
                {route.nazwa_drogi}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
                {route.typ_drogi.toUpperCase()} • {route.skala} •{" "}
                {route.nazwa_skaly}
            </ThemedText>

            <Spacer height={28} />

            <ThemedCard style={styles.detailsCard}>
                <View style={styles.detailRow}>
                    <ThemedText style={styles.label}>Type:</ThemedText>
                    <ThemedText style={styles.value}>
                        {route.typ_drogi}
                    </ThemedText>
                </View>
                {route.dlugosc_drogi && (
                    <View style={styles.detailRow}>
                        <ThemedText style={styles.label}>Length:</ThemedText>
                        <ThemedText style={styles.value}>
                            {route.dlugosc_drogi}m
                        </ThemedText>
                    </View>
                )}
                {route.liczba_ringow !== undefined && (
                    <View style={styles.detailRow}>
                        <ThemedText style={styles.label}>Bolts:</ThemedText>
                        <ThemedText style={styles.value}>
                            {route.liczba_ringow}
                        </ThemedText>
                    </View>
                )}
                {route.wysokosc && (
                    <View style={styles.detailRow}>
                        <ThemedText style={styles.label}>Height:</ThemedText>
                        <ThemedText style={styles.value}>
                            {route.wysokosc}m
                        </ThemedText>
                    </View>
                )}
                {route.stanowisko && (
                    <View style={styles.detailRow}>
                        <ThemedText style={styles.label}>Anchor:</ThemedText>
                        <ThemedText style={styles.value}>
                            {route.stanowisko}
                        </ThemedText>
                    </View>
                )}
                {route.potrzebny_sprzet && (
                    <View style={styles.detailRow}>
                        <ThemedText style={styles.label}>Gear:</ThemedText>
                        <ThemedText style={styles.value}>
                            {route.potrzebny_sprzet}
                        </ThemedText>
                    </View>
                )}
            </ThemedCard>

            <Spacer height={20} />
            <ThemedText style={styles.noteLabel}>Description:</ThemedText>
            <ThemedText style={styles.note}>
                {route.opis || "No description available."}
            </ThemedText>

            <Spacer height={40} />
        </ThemedView>
    );
};

export default RouteDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    stack_header: {
        fontSize: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.8,
        fontWeight: "500",
    },
    detailsCard: {
        padding: 15,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(128,128,128,0.2)",
    },
    label: {
        fontWeight: "bold",
        opacity: 0.7,
    },
    value: {
        fontWeight: "500",
    },
    noteLabel: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 5,
    },
    note: {
        fontSize: 16,
        fontStyle: "italic",
        lineHeight: 24,
    },
});

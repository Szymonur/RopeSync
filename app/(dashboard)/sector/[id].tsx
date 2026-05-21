import { StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState, useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
    RouteRepository,
    RouteListItem,
} from "../../../database/repositories/RouteRepository";
import {
    SectorRepository,
    Sector,
} from "../../../database/repositories/SectorRepository";
import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import Spacer from "../../../components/Spacer";
import RouteCard from "../../../components/Explore/RouteCard";

const SectorRoutes = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const db = useSQLiteContext();
    const [routes, setRoutes] = useState<RouteListItem[]>([]);
    const [sector, setSector] = useState<Sector | null>(null);
    const [loading, setLoading] = useState(true);

    const routeRepo = useMemo(() => new RouteRepository(db), [db]);
    const sectorRepo = useMemo(() => new SectorRepository(db), [db]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const sectorId = parseInt(id);
                const [routesData, sectorData] = await Promise.all([
                    routeRepo.getRoutesBySector(sectorId),
                    sectorRepo.getSectorById(sectorId),
                ]);
                setRoutes(routesData);
                setSector(sectorData);
            } catch (error) {
                console.error("Błąd ładowania danych sektora:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <ThemedView
                style={[styles.container, { justifyContent: "center" }]}
                safe
            >
                <ActivityIndicator size="large" color="#7b0490" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{ title: sector?.nazwa_sektoru || "Routes" }}
            />
            <FlatList
                data={routes}
                style={{ width: "100%" }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => <RouteCard route={item} />}
                ListEmptyComponent={
                    <ThemedText style={styles.emptyText}>
                        No routes found in this sector.
                    </ThemedText>
                }
                ListHeaderComponent={<Spacer height={20} />}
            />
        </ThemedView>
    );
};

export default SectorRoutes;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 20,
        opacity: 0.5,
    },
});

import { StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useRepositories } from "../../../contexts/RepositoryContext";

import { RouteListItem } from "../../../types/route";
import { Sector } from "../../../types/location";
import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import Spacer from "../../../components/Spacer";
import RouteCard from "../../../components/Explore/RouteCard";

const SectorRoutes = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { routeRepository, locationRepository } = useRepositories();
    const [routes, setRoutes] = useState<RouteListItem[]>([]);
    const [sector, setSector] = useState<Sector | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        const fetchData = async () => {
            if (!id) return;
            try {
                const sectorId = parseInt(id);
                const [routesData, sectorData] = await Promise.all([
                    routeRepository.getRoutesBySector(sectorId, controller.signal),
                    locationRepository.getSectorById(sectorId, controller.signal),
                ]);
                setRoutes(routesData);
                setSector(sectorData);
            } catch (error: any) {
                if (error.name === 'AbortError') return;
                console.error("Błąd ładowania danych sektora:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, [id, routeRepository, locationRepository]);

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

import {
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    View,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
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
import ThemedCard from "../../../components/ThemedCard";
import Spacer from "../../../components/Spacer";

const SectorRoutes = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const db = useSQLiteContext();
    const router = useRouter();
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
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() =>
                            router.push({
                                pathname: "/(dashboard)/route/[id]",
                                params: { id: item.id_drogi },
                            })
                        }
                    >
                        <ThemedCard style={styles.card}>
                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={styles.bold}>
                                        {item.nazwa_drogi}
                                    </ThemedText>
                                    <ThemedText style={styles.rock}>
                                        {item.nazwa_skaly} • {item.typ_drogi}
                                    </ThemedText>
                                </View>
                                <View style={styles.gradeBadge}>
                                    <ThemedText style={styles.gradeText}>
                                        {item.skala}
                                    </ThemedText>
                                </View>
                            </View>
                        </ThemedCard>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <ThemedText>No routes found in this sector.</ThemedText>
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
    card: {
        padding: 15,
        marginBottom: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    bold: {
        fontWeight: "bold",
        fontSize: 18,
    },
    rock: {
        fontSize: 14,
        opacity: 0.7,
        marginTop: 2,
    },
    gradeBadge: {
        backgroundColor: "#7b0490",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginLeft: 10,
    },
    gradeText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
});

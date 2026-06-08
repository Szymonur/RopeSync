import {
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useRepositories } from "../../../contexts/RepositoryContext";

import { Sector, Region } from "../../../types/location";
import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import ThemedCard from "../../../components/ThemedCard";
import Spacer from "../../../components/Spacer";

const RegionSectors = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { locationRepository } = useRepositories();
    const router = useRouter();
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [region, setRegion] = useState<Region | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        const fetchData = async () => {
            if (!id) return;
            try {
                const regionId = parseInt(id);
                const [sectorsData, regionData] = await Promise.all([
                    locationRepository.getSectorsByRegion(regionId, controller.signal),
                    locationRepository.getRegionById(regionId, controller.signal),
                ]);
                setSectors(sectorsData);
                setRegion(regionData);
            } catch (error: any) {
                if (error.name === 'AbortError') return;
                console.error("Błąd ładowania danych regionu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, [id, locationRepository]);

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
                options={{ title: region?.nazwa_rejonu || "Sectors" }}
            />
            <FlatList
                data={sectors}
                style={{ width: "100%" }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() =>
                            router.push({
                                pathname: "/(dashboard)/sector/[id]",
                                params: { id: item.id_sektoru.toString() },
                            })
                        }
                    >
                        <ThemedCard style={styles.card}>
                            <ThemedText style={styles.bold}>
                                {item.nazwa_sektoru}
                            </ThemedText>
                            <ThemedText style={styles.coords}>
                                {item.szerokosc_geograficzna},{" "}
                                {item.dlugosc_geograficzna}
                            </ThemedText>
                        </ThemedCard>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <ThemedText>No sectors found in this region.</ThemedText>
                }
                ListHeaderComponent={<Spacer height={20} />}
            />
        </ThemedView>
    );
};

export default RegionSectors;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    card: {
        padding: 15,
        marginBottom: 10,
    },
    bold: {
        fontWeight: "bold",
        fontSize: 18,
    },
    coords: {
        fontSize: 12,
        opacity: 0.6,
        marginTop: 4,
    },
});

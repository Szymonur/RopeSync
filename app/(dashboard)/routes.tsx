import { StyleSheet, FlatList, View } from "react-native";
import { useEffect, useState, useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";

import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";

import {
    RegionRepository,
    Region,
} from "../../database/repositories/RegionRepository";

const Routes = () => {
    const db = useSQLiteContext();
    const [regions, setRegions] = useState<Region[]>([]);

    // Inicjalizacja repozytorium
    const repository = useMemo(() => new RegionRepository(db), [db]);

    const loadRegions = async () => {
        try {
            const data = await repository.getAllRegions();
            setRegions(data);
        } catch (error) {
            console.error("Błąd podczas ładowania regionów:", error);
        }
    };

    useEffect(() => {
        loadRegions();
    }, []);

    return (
        <ThemedView style={styles.container}>
            {/* <View style={styles.mapContainer}>
                <MapView provider={PROVIDER_GOOGLE} style={styles.map} />
            </View> */}
            <FlatList
                data={regions}
                style={{ width: "100%" }}
                renderItem={({ item }) => (
                    <ThemedCard style={styles.card}>
                        <ThemedText style={styles.bold}>
                            {item?.kraj} - {item.nazwa_rejonu}
                        </ThemedText>
                        <ThemedText>{item.dlugosc_geograficzna}</ThemedText>
                        <ThemedText>{item.szerokosc_geograficzna}</ThemedText>
                    </ThemedCard>
                )}
                ListEmptyComponent={
                    <ThemedText>Brak zarejestrowanych przejść.</ThemedText>
                }
            />
        </ThemedView>
    );
};

export default Routes;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    mapContainer: {
        width: "100%",
        height: 300,
        marginBottom: 20,
        borderRadius: 15,
        overflow: "hidden",
    },
    map: {
        width: "100%",
        height: "100%",
    },
    heading: {
        fontWeight: "bold",
        fontSize: 22,
        textAlign: "center",
    },
    card: {
        padding: 15,
        marginBottom: 10,
    },
    bold: {
        fontWeight: "bold",
        fontSize: 16,
    },
    note: {
        fontStyle: "italic",
        color: "#666",
        marginTop: 5,
    },
});

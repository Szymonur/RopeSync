import { StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useSectorById } from "../../../lib/hooks/useLocations";
import { useRoutesBySector } from "../../../lib/hooks/useRoutes";

import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import Spacer from "../../../components/Spacer";
import RouteCard from "../../../components/Explore/RouteCard";

const SectorRoutes = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const sectorId = parseInt(id);

    const { data: sector, isLoading: isSectorLoading } = useSectorById(sectorId);
    const { data: routes, isLoading: isRoutesLoading } = useRoutesBySector(sectorId);

    const isLoading = isSectorLoading || isRoutesLoading;

    if (isLoading) {
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

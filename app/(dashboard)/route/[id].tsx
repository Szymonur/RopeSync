import {
    StyleSheet,
    ActivityIndicator,
    View,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useState } from "react";
import { useRouteDetails } from "../../../lib/hooks/useRoutes";

import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import Spacer from "../../../components/Spacer";
import ThemedCard from "../../../components/ThemedCard";
import { Colors } from "../../../constants/Colors";

import ManualAscentFormModal from "../../../components/ManualAscentFormModal";

import RouteTypeBadge from "../../../components/Badges/RouteTypeBadge";
import RouteGradeBadge from "../../../components/Badges/RouteGradeBadge";

const RouteDetail = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: route, isLoading } = useRouteDetails(id!);
    const [formVisible, setFormVisible] = useState(false);

    if (isLoading) {
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
        <ThemedView style={styles.container}>
            <ManualAscentFormModal
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                preselectedRouteId={id}
                hideRouteSearch={true}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setFormVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Dodaj przejście"
            >
                <ThemedText style={styles.fabIcon}>+</ThemedText>
            </TouchableOpacity>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
            >
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
                <View style={styles.subtitle}>
                    <RouteTypeBadge route_type={route.typ_drogi} />
                    <RouteGradeBadge route_grade={route.skala} />
                </View>

                <Spacer height={28} />

                <ThemedCard style={styles.detailsCard}>
                    {route.dlugosc_drogi && (
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.label}>
                                Length:
                            </ThemedText>
                            <ThemedText style={styles.value}>
                                {route.dlugosc_drogi}m
                            </ThemedText>
                        </View>
                    )}
                    {route.liczba_ringow && (
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.label}>Bolts:</ThemedText>
                            <ThemedText style={styles.value}>
                                {route.liczba_ringow}
                            </ThemedText>
                        </View>
                    )}
                    {route.wysokosc && (
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.label}>
                                Height:
                            </ThemedText>
                            <ThemedText style={styles.value}>
                                {route.wysokosc}m
                            </ThemedText>
                        </View>
                    )}
                    {route.stanowisko && (
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.label}>
                                Anchor:
                            </ThemedText>
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
                    {route.liczba_potrzebnych_crashpadow && (
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.label}>
                                Number of carshpads:
                            </ThemedText>
                            <ThemedText style={styles.value}>
                                {route.liczba_potrzebnych_crashpadow}
                            </ThemedText>
                        </View>
                    )}
                    {route.czy_stanowiska && (
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.label}>
                                Bolred anchors:
                            </ThemedText>
                            <ThemedText style={styles.value}>
                                {route.czy_stanowiska ? "yes" : "no"}
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
            </ScrollView>
        </ThemedView>
    );
};

export default RouteDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
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
    stack_header: {
        fontSize: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 5,
    },
    subtitle: {
        display: "flex",
        flexDirection: "row",
        gap: 6,
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

import {
    StyleSheet,
    FlatList,
    TouchableOpacity,
    View,
    RefreshControl,
    ActivityIndicator,
	Platform
} from "react-native";
import { useState, useCallback, useMemo } from "react";
import { Tabs, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Colors } from "../../../constants/Colors";
import { useTheme } from "../../../contexts/ThemeContext";

import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedCard from "../../../components/ThemedCard";
import ManualAscentFormModal from "../../../components/ManualAscentFormModal";
import AscentsFilters from "../../../components/AscentsFilters"

import ThemedEmptyState from "../../../components/ThemedEmptyState";

import { useAscents } from "../../../lib/hooks/useAscents";

import RouteTypeBadge from "../../../components/Badges/RouteTypeBadge";
import RouteGradeBadge from "../../../components/Badges/RouteGradeBadge";
import RouteStyleBadge from "../../../components/Badges/RouteStyleBadge";
import { AscentFilters as IFilters } from "../../../types/ascent";

const Ascents = () => {
    const { data: ascents = [], isLoading, refetch, isRefetching } = useAscents();
    const [formVisible, setFormVisible] = useState(false);
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState<IFilters>({
        styles: [],
        types: [],
        dateFrom: "",
        dateTo: "",
    });
	const isWeb = Platform.OS === "web";
    
    const router = useRouter();

    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const onRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const filteredAscents = useMemo(() => {
        return ascents.filter(ascent => {
            // Filtracja po stylu
            if (activeFilters.styles.length > 0 && !activeFilters.styles.includes(ascent.nazwa_stylu)) return false;
            
            // Filtracja po typie drogi
            if (activeFilters.types.length > 0 && !activeFilters.types.includes(ascent.typ_drogi || "")) return false;
            
            // Filtracja po dacie
            if (activeFilters.dateFrom && ascent.data < activeFilters.dateFrom) return false;
            if (activeFilters.dateTo && ascent.data > activeFilters.dateTo) return false;
            
            // Filtracja po ID (jeśli backend nie zwraca id_rejonu w przejsciu, to lokalnie tylko po routeId)
            if (activeFilters.routeId && ascent.id_drogi !== activeFilters.routeId) return false;


            return true;
        });
    }, [ascents, activeFilters]);
	
    return (
        <ThemedView style={styles.container}>
			    <Tabs.Screen
                    options={{
                        headerRight: () => (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() =>
                                        setFiltersVisible(true)
                                    }
                                    style={{ marginRight: 20, display: "flex", flexDirection: "row", alignItems: "center"}}
                                >
									<ThemedText  style={{ marginRight: 6}}>
										Filtry 
									</ThemedText>
                                    <MaterialIcons
                                        name="filter-list"
                                        color={activeFilters.styles.length > 0 || activeFilters.types.length > 0 || activeFilters.dateFrom || activeFilters.dateTo ? Colors.primary : theme.iconColour}
                                        size={24}
                                    />
                                </TouchableOpacity>
                            </View>
                        ),
                    }}
                />
            <ManualAscentFormModal
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSuccess={() => refetch()}
            />
			{isWeb && (
                <View style={[styles.webSidebar, { borderRightColor: theme.border }]}>
                    <AscentsFilters
                        visible={true}
                        onClose={() => {}}
                        currentFilters={activeFilters}
                        onApply={(filters) => setActiveFilters(filters)}
                    />
                </View>
            )}

            {!isWeb && (
                <AscentsFilters
                    visible={filtersVisible}
                    onClose={() => setFiltersVisible(false)}
                    currentFilters={activeFilters}
                    onApply={(filters) => {
                        setActiveFilters(filters);
                        setFiltersVisible(false);
                    }}
                />
            )}
			


            <TouchableOpacity
                style={styles.fab}
                onPress={() => setFormVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Dodaj przejście"
            >
                <ThemedText style={styles.fabIcon}>+</ThemedText>
            </TouchableOpacity>

            <FlatList
                data={filteredAscents}
                keyExtractor={(item) => item.id_przejscia}
                showsVerticalScrollIndicator={false}
                style={[{ width: "100%", paddingVertical: 7, paddingLeft: isWeb ? 10 : 0} ]}
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
		flexDirection: "row",
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
	webContainer: {
        flexDirection: "row", // Ustawia dzieci (Sidebar i Główne okno) obok siebie
        paddingHorizontal: 0,
        gap: 20,
    },
    webSidebar: {
        width: 350, // Stała szerokość kolumny filtrów
        padding: 20,
        borderRightWidth: 1,
        // Tutaj ewentualnie dodaj kolor ramki w inline styles (borderRightColor)
    },
    webMainContent: {
        flex: 1, // Zajmuje całą resztę dostępnego miejsca
        paddingRight: 20,
    },
});

import {
    StyleSheet,
    FlatList,
    TouchableOpacity,
    View,
    SectionList,
} from "react-native";
import { useEffect, useState, useMemo, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useSQLiteContext } from "expo-sqlite";

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedCard from "../../../components/ThemedCard";
import ThemedTextInput from "../../../components/ThemedTextInput";

import { useTheme } from "../../../contexts/ThemeContext";
import { Colors } from "../../../constants/Colors";

import {
    RegionRepository,
    Region,
} from "../../../database/repositories/RegionRepository";
import {
    SectorRepository,
    Sector,
} from "../../../database/repositories/SectorRepository";
import {
    RouteRepository,
    RouteListItem,
} from "../../../database/repositories/RouteRepository";

const Routes = () => {
    const db = useSQLiteContext();
    const router = useRouter();

    const [regions, setRegions] = useState<Region[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{
        regions: Region[];
        sectors: (Sector & { nazwa_rejonu: string })[];
        routes: RouteListItem[];
    }>({ regions: [], sectors: [], routes: [] });

    const [showSearchBar, setShowSearchBar] = useState<boolean>(false);

    const regionRepo = useMemo(() => new RegionRepository(db), [db]);
    const sectorRepo = useMemo(() => new SectorRepository(db), [db]);
    const routeRepo = useMemo(() => new RouteRepository(db), [db]);

    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const loadRegions = async () => {
        try {
            const data = await regionRepo.getAllRegions();
            setRegions(data);
        } catch (error) {
            console.error("Błąd podczas ładowania regionów:", error);
        }
    };

    useEffect(() => {
        loadRegions();
    }, []);

    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.length < 2) {
                setSearchResults({ regions: [], sectors: [], routes: [] });
                return;
            }
            try {
                const [regions, sectors, routes] = await Promise.all([
                    regionRepo.searchRegions(searchQuery),
                    sectorRepo.searchSectors(searchQuery),
                    routeRepo.searchRoutes(searchQuery),
                ]);
                console.log({ regions });
                console.log({ sectors });

                setSearchResults({ regions, sectors, routes });
            } catch (error) {
                console.error("Błąd podczas wyszukiwania:", error);
            }
        };

        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const sections = useMemo(() => {
        const result = [];
        if (searchResults.regions.length > 0) {
            result.push({
                title: "Regions",
                data: searchResults.regions,
                type: "region",
            });
        }
        if (searchResults.sectors.length > 0) {
            result.push({
                title: "Sectors",
                data: searchResults.sectors,
                type: "sector",
            });
        }
        if (searchResults.routes.length > 0) {
            result.push({
                title: "Routes",
                data: searchResults.routes,
                type: "route",
            });
        }
        return result;
    }, [searchResults]);

    const renderRegionItem = ({ item }: { item: Region }) => (
        <TouchableOpacity
            onPress={() =>
                router.push({
                    pathname: "/(dashboard)/region/[id]",
                    params: { id: item.id_rejonu.toString() },
                })
            }
        >
            <ThemedCard style={styles.card}>
                <ThemedText style={styles.bold}>
                    {item?.kraj} - {item.nazwa_rejonu}
                </ThemedText>
                <ThemedText style={styles.coords}>
                    {item.dlugosc_geograficzna}, {item.szerokosc_geograficzna}
                </ThemedText>
            </ThemedCard>
        </TouchableOpacity>
    );

    const renderSearchItem = ({
        item,
        section,
    }: {
        item: any;
        section: any;
    }) => {
        if (section.type === "sector") {
            const sector = item as Sector & { nazwa_rejonu: string };
            return (
                <TouchableOpacity
                    onPress={() =>
                        router.push({
                            pathname: "/(dashboard)/sector/[id]",
                            params: { id: sector.id_sektoru.toString() },
                        })
                    }
                >
                    <ThemedCard style={styles.card}>
                        <ThemedText style={styles.bold}>
                            {sector.nazwa_sektoru}
                        </ThemedText>
                        <ThemedText style={styles.subtext}>
                            {sector.nazwa_rejonu}
                        </ThemedText>
                    </ThemedCard>
                </TouchableOpacity>
            );
        }
        if (section.type === "region") {
            const region = item as Region;
            return (
                <TouchableOpacity
                    onPress={() =>
                        router.push({
                            pathname: "/(dashboard)/region/[id]",
                            params: { id: region.id_rejonu.toString() },
                        })
                    }
                >
                    <ThemedCard style={styles.card}>
                        <ThemedText style={styles.bold}>
                            {region.nazwa_rejonu}
                        </ThemedText>
                        <ThemedText style={styles.subtext}>
                            {region.kraj}
                        </ThemedText>
                    </ThemedCard>
                </TouchableOpacity>
            );
        } else {
            const route = item as RouteListItem;
            return (
                <TouchableOpacity
                    onPress={() =>
                        router.push({
                            pathname: "/(dashboard)/route/[id]",
                            params: { id: route.id_drogi },
                        })
                    }
                >
                    <ThemedCard style={styles.card}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.bold}>
                                    {route.nazwa_drogi}
                                </ThemedText>
                                <ThemedText style={styles.subtext}>
                                    {route.nazwa_skaly} • {route.typ_drogi}
                                </ThemedText>
                            </View>
                            <View style={styles.gradeBadge}>
                                <ThemedText style={styles.gradeText}>
                                    {route.skala}
                                </ThemedText>
                            </View>
                        </View>
                    </ThemedCard>
                </TouchableOpacity>
            );
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Tabs.Screen
                options={{
                    headerTitle: "Explore",
                    tabBarLabel: "Routes",
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => {
                                setShowSearchBar(!showSearchBar);
                                setSearchQuery("");
                            }}
                            style={{ marginRight: 20 }}
                        >
                            {!showSearchBar && (
                                <Ionicons
                                    name="search"
                                    color={theme.iconColour}
                                    size={24}
                                />
                            )}
                            {showSearchBar && (
                                <Ionicons
                                    name="close"
                                    color={theme.iconColour}
                                    size={24}
                                />
                            )}
                        </TouchableOpacity>
                    ),
                }}
            />
            {showSearchBar && (
                <ThemedTextInput
                    label="Search regions, sectors or routes"
                    placeholder="Search regions, sectors or routes"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                    autoFocus={true}
                />
            )}

            <Spacer height={10} />

            {searchQuery.length > 0 ? (
                <SectionList
                    showsVerticalScrollIndicator={false}
                    sections={sections}
                    keyExtractor={(item, index) =>
                        (item.id_sektoru || item.id_rejonu || item.id_drogi) +
                        index
                    }
                    renderItem={renderSearchItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <ThemedText style={styles.sectionHeader}>
                            {title}
                        </ThemedText>
                    )}
                    ListEmptyComponent={
                        searchQuery.length >= 2 ? (
                            <ThemedText style={styles.emptyText}>
                                No results found.
                            </ThemedText>
                        ) : null
                    }
                    stickySectionHeadersEnabled={false}
                />
            ) : (
                <FlatList
                    data={regions}
                    keyExtractor={(item) => item.id_rejonu.toString()}
                    renderItem={renderRegionItem}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <ThemedText style={styles.emptyText}>
                            No regions available.
                        </ThemedText>
                    }
                />
            )}
        </ThemedView>
    );
};

export default Routes;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    searchInput: {
        marginBottom: 5,
    },
    card: {
        padding: 15,
        marginBottom: 10,
    },
    bold: {
        fontWeight: "bold",
        fontSize: 16,
    },
    coords: {
        fontSize: 12,
        opacity: 0.6,
        marginTop: 4,
    },
    subtext: {
        fontSize: 13,
        opacity: 0.7,
        marginTop: 2,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 10,
        marginBottom: 10,
        opacity: 0.8,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 20,
        opacity: 0.5,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    gradeBadge: {
        backgroundColor: "#7b0490",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    gradeText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 12,
    },
});

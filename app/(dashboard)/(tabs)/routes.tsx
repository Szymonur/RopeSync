import {
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SectionList,
    View,
    Platform 
} from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedTextInput from "../../../components/ThemedTextInput";
import DelayedActivityIndicator from "../../../components/DelayedActivityIndicator";

import { useTheme } from "../../../contexts/ThemeContext";
import { Colors } from "../../../constants/Colors";
import { useExploreSearch } from "../../../lib/hooks/useExploreSearch";
import { useRegionById, useSectorsByRegion } from "../../../lib/hooks/useLocations";
import { useRoutesBySector, useRouteDetails  } from "../../../lib/hooks/useRoutes";

import RegionCard from "../../../components/Explore/RegionCard";
import SectorCard from "../../../components/Explore/SectorCard";
import RouteCard from "../../../components/Explore/RouteCard";
import RouteDetail from "../../../app/(dashboard)/route/[id]";

import { RouteListItem } from "../../../types/route"

const Routes = () => {
    // Odczytujemy stan z parametrów URL, by przeżył nawigację/odświeżenie
    const params = useLocalSearchParams<{ region?: string; sector?: string; route?: string; }>();
    
    const selectedRegion = params.region ? parseInt(params.region) : null;
    const selectedSector = params.sector ? parseInt(params.sector) : null;
    const selectedRoute = params.route ? params.route : "";

    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [error, setError] = useState<string | undefined>();

    // Pobieranie danych
    const { data: region } = useRegionById(selectedRegion);
    const { data: sectors } = useSectorsByRegion(selectedRegion);
    const { data: routes } = useRoutesBySector(selectedSector);
    const { data: route } =  useRouteDetails(selectedRoute);

    const { regions, sections } = useExploreSearch(searchQuery);

    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

	const flatListRef = useRef<FlatList<RouteListItem>>(null);

    const handleRegionSelect = useCallback((regionId: number) => {
        router.setParams({ 
            region: regionId.toString(), 
            sector: "",
			route: ""
        });
    }, []);

    const handleSectorSelect = useCallback((sectorId: number) => {
        router.setParams({ sector: sectorId.toString() });
    }, []);

	const handleRouteSelect =  useCallback((routeId: string) => {
        router.setParams({ route: routeId });
    }, []);

    const renderRegionItem = useCallback(({ item }: { item: any }) => (
        <RegionCard 
            region={item} 
            onRegionPress={handleRegionSelect} 
            isSelected={selectedRegion === item.id_rejonu}
        />
    ), [selectedRegion, handleRegionSelect]);

    const renderSectorItem = useCallback(({ item }: { item: any }) => (
        <SectorCard 
            sector={item} 
            onSectorPress={handleSectorSelect} 
            isSelected={selectedSector === item.id_sektoru}
        />
    ), [selectedSector, handleSectorSelect]);

    const renderRouteItem = useCallback(({ item }: { item: any }) => (
        <RouteCard 
			route={item}
            onRoutePress={handleRouteSelect} 
            isSelected={selectedRoute === item.id_drogi}
		/>
    ), [selectedRoute, handleRouteSelect]);

    // Logika walidacji wyszukiwarki
    useEffect(() => {
        if (searchQuery.length === 0 || searchQuery.length >= 2) {
            setError(undefined);
            return;
        }
        const timer = setTimeout(() => {
            if (searchQuery.length === 1) {
                setError("Min. 2 characters required");
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [searchQuery]);

	useEffect(() => {
		if (routes && selectedRoute && flatListRef.current && !showSearchBar) {
			const timer = setTimeout(() => {
				const index = routes.findIndex(route => route.id_drogi === selectedRoute);
				
				if (index !== -1) {
					flatListRef.current?.scrollToIndex({
						index: index,
						animated: true,
						viewPosition: 0.5
					});
				}
			}, 500);

			return () => clearTimeout(timer);
		}
	}, [routes, selectedRoute, showSearchBar]);


    const renderSearchItem = ({
        item,
        section,
    }: {
        item: any;
        section: any;
    }) => {
        switch (section.type) {
            case "region":
                return <RegionCard region={item} onRegionPress={ () => {
					router.setParams({ 
                        region: item.id_rejonu, 
                        sector: "", 
                        route: "" 
                    });
					setShowSearchBar(false);
					setSearchQuery("");
				}}  />;
            case "sector":
                return <SectorCard sector={item} onSectorPress={ () => {
					router.setParams({ 
                        region: item.id_rejonu, 
                        sector: item.id_sektoru, 
                        route: "" 
                    });
					setShowSearchBar(false);
					setSearchQuery("");
				}}  />;
            case "route":
                return <RouteCard route={item} 
					onRoutePress={ () => {
					router.setParams({ 
                        region: item.id_rejonu, 
                        sector: item.id_sektoru, 
                        route: item.id_drogi
                    });
					setShowSearchBar(false);
					setSearchQuery("");
				}}  />;
            default:
                return null;
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Tabs.Screen
                options={{
                    headerTitle: "Rejony",
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => {
                                setShowSearchBar(!showSearchBar);
                                setSearchQuery("");
                                setError(undefined);
                            }}
                            style={{ marginRight: 20 }}
                        >
                            <Ionicons
                                name={showSearchBar ? "close" : "search"}
                                color={theme.iconColour}
                                size={24}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />

            {Platform.OS === 'web' && (
                <>
                    <Spacer/>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <ThemedText style={{ fontSize: 24, fontWeight: 'bold' }}>Drogi</ThemedText>
                        
                        <TouchableOpacity
                            onPress={() => {
                                setShowSearchBar(!showSearchBar);
                                setSearchQuery("");
                            }}
                        >
                            <Ionicons
                                name={showSearchBar ? "close" : "search"}
                                size={24}
                                color={theme.iconColour}
                            />
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {showSearchBar && (
                <ThemedTextInput
                    label="Quick Search"
                    placeholder="Regions, sectors or routes"
                    value={searchQuery}
                    onChangeText={(text) => setSearchQuery(text)}
                    error={error}
                    autoFocus
                />
            )}

            <Spacer height={10} />

            {searchQuery.length >= 2 ? (
                <SectionList
                    sections={sections}
					keyExtractor={(item, index) => {
						if (item.id_drogi) return `route-${item.id_drogi}`;
						if (item.id_sektoru) return `sector-${item.id_sektoru}`;
						if (item.id_rejonu) return `region-${item.id_rejonu}`;
						return `fallback-${index}`; 
					}}
                    renderItem={renderSearchItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <ThemedText style={styles.sectionHeader}>
                            {title}
                        </ThemedText>
                    )}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={false}
                    ListEmptyComponent={
                        <ThemedText style={styles.emptyText}>
                            No results found.
                        </ThemedText>
                    }
                />
            ) : (
                <ThemedView style={{ display: "flex", flexDirection: "row", flex: 1 }}>
                    <FlatList
                        style={{ flex: 1 }}
                        data={regions}
                        keyExtractor={(item) => item.id_rejonu.toString()}
                        renderItem={renderRegionItem}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={10}
                        windowSize={5}
                        removeClippedSubviews={Platform.OS !== 'web'}
                        ListEmptyComponent={<DelayedActivityIndicator isLoading={true} size="large" />}
                    />
                    
                    {selectedRegion && region && (
                        <FlatList
                            style={{ flex: 1 }}
                            data={sectors}
                            keyExtractor={(item) => item.id_sektoru.toString()}
                            renderItem={renderSectorItem}
                            showsVerticalScrollIndicator={false}
                            initialNumToRender={10}
                            windowSize={5}
                            removeClippedSubviews={Platform.OS !== 'web'}
                            ListEmptyComponent={<DelayedActivityIndicator isLoading={true} size="large" />}
                        /> 
                    )}

                    {selectedRegion && region && selectedSector && routes && (
                        <FlatList
							ref={flatListRef}
                            style={{ flex: 2 }}
                            data={routes}
                            keyExtractor={(item) => item.id_drogi.toString()}
                            renderItem={renderRouteItem}
                            showsVerticalScrollIndicator={false}
                            initialNumToRender={15}
                            windowSize={5}
                            removeClippedSubviews={Platform.OS !== 'web'}
                            ListEmptyComponent={<DelayedActivityIndicator isLoading={true} size="large" />}
							onScrollToIndexFailed={(info) => {
							const wait = new Promise(resolve => setTimeout(resolve, 500));
							wait.then(() => {
									flatListRef.current?.scrollToIndex({ 
										index: info.index, 
										animated: true,
										viewPosition: 0.5 
									});
								});
							}}
                        /> 
                    )}

					{selectedRoute && (
                        <View style={{ flex: 3}}>
                            {/* Komponent z flagą isEmbedded - nie renderuje Stack.Screen i wie, że jest panelem */}
                            <RouteDetail 
                                routeId={selectedRoute} 
                                isEmbedded={true} 
                            />
                        </View>
                    )}


                </ThemedView>
            )}
        </ThemedView>
    );
};

export default Routes;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 2,
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
});
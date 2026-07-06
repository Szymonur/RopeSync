import {
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SectionList,
    View,
	Platform 
} from "react-native";
import { useState, useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedTextInput from "../../../components/ThemedTextInput";

import { useTheme } from "../../../contexts/ThemeContext";
import { Colors } from "../../../constants/Colors";
import { useExploreSearch } from "../../../lib/hooks/useExploreSearch";

import RegionCard from "../../../components/Explore/RegionCard";
import SectorCard from "../../../components/Explore/SectorCard";
import RouteCard from "../../../components/Explore/RouteCard";

const Routes = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const { regions, sections } = useExploreSearch(searchQuery);
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
    };

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

    const renderSearchItem = ({
        item,
        section,
    }: {
        item: any;
        section: any;
    }) => {
        switch (section.type) {
            case "region":
                return <RegionCard region={item} />;
            case "sector":
                return <SectorCard sector={item} />;
            case "route":
                return <RouteCard route={item} />;
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

			{Platform.OS === 'web' &&
			<>
			<Spacer/>
			<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
				<ThemedText style={{ fontSize: 24, fontWeight: 'bold' }}>Rejony</ThemedText>
                
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
			}

            {showSearchBar && (
                <ThemedTextInput
                    label="Quick Search"
                    placeholder="Regions, sectors or routes"
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    error={error}
                    autoFocus
                />
            )}

            <Spacer height={10} />

            {searchQuery.length >= 2 ? (
                <SectionList
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
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={false}
                    ListEmptyComponent={
                        <ThemedText style={styles.emptyText}>
                            No results found.
                        </ThemedText>
                    }
                />
            ) : (
                <FlatList
                    data={regions}
                    keyExtractor={(item) => item.id_rejonu.toString()}
                    renderItem={({ item }) => <RegionCard region={item} />}
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

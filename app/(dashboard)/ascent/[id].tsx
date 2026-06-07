import {
    StyleSheet,
    ActivityIndicator,
    View,
    TouchableOpacity,
    Alert,
	Platform
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "expo-router";

import { useRepositories } from "../../../contexts/RepositoryContext";
import { Ascent } from "../../../types/ascent";

import {
    UserService,
    RemoteAscentDetails,
} from "../../../services/api/UserService";
import { useNetwork } from "../../../contexts/NetworkContext";

import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import Spacer from "../../../components/Spacer";
import ThemedTimeline from "../../../components/ThemedTimeline";

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import RouteTypeBadge from "../../../components/Badges/RouteTypeBadge";
import RouteGradeBadge from "../../../components/Badges/RouteGradeBadge";
import RouteStyleBadge from "../../../components/Badges/RouteStyleBadge";

import { useTheme } from "../../../contexts/ThemeContext";
import { Colors } from "../../../constants/Colors";

import { useAuth } from "../../../contexts/AuthContext";

import { useSnackbar } from "../../../contexts/SnackbarContext";

const AscentDetails = () => {
    const { id, userId: searchUserId } = useLocalSearchParams<{
        id: string;
        userId?: string;
    }>();
    const { showSnackbar } = useSnackbar();

    const [ascent, setAscent] = useState<Ascent | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const { currentUserId: userId } = useAuth();
    const currentUserId = Number(userId);

    const { ascentRepository } = useRepositories();

    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const handleDelete = () => { // TODO - add custom alert component ans use it here
		if (Platform.OS === 'web') {
		const confirmed = window.confirm(`Usuń przejście\n\nCzy na pewno chcesz usunąć przejście "${ascent?.nazwa_drogi}"?`);
				if (confirmed) {
					ascentRepository.deleteAscent(id);
					console.log("DELETE");
					router.back();
				}
		} else {

			Alert.alert(
				"Usuń przejście",
				`Czy na pewno chcesz usunąć przejście "${ascent?.nazwa_drogi}"?`,
				[
					{ text: "Anuluj", style: "cancel" },
					{
						text: "Usuń",
						style: "destructive",
						onPress: async () => {
							try {
								if (ascent?.id_przejscia) {
									await ascentRepository.deleteAscent(id);
									router.back();
									showSnackbar({
										message: `Przejscie drogi ${ascent?.nazwa_drogi} zostało usunięte`,
										type: "success",
									});
								}
							} catch (error) {
								showSnackbar({
									message: "Nie duało się usunać przejscia",
									type: "error",
								});
								console.error("Błąd podczas usuwania:", error);
							}
						},
					},
				],
			);
		};
    };

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                setLoading(true);

				const data = await ascentRepository.getAscent(
                    id as string, 
                    searchUserId ? Number(searchUserId) : undefined
                );
				setAscent(data);

            } catch (error) {
                console.error("Błąd ładowania szczegółów przejścia:", error);
				setAscent(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id, searchUserId, currentUserId]);

    if (loading) {
        return (
            <ThemedView
                style={[styles.container, { justifyContent: "center" }]}
                safe
            >
                <ActivityIndicator size="large" color={Colors.primary} />
            </ThemedView>
        );
    }

    if (!ascent) {
        return (
            <ThemedView style={styles.container}>
                <Stack.Screen options={{ title: "Nie znaleziono" }} />
                <Spacer />
                <ThemedText
                    title
                    style={[styles.title, { textAlign: "center" }]}
                >
                    Podłącz się do internetu aby przejrzeć szczególy tego
                    przejscia!
                </ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container} scroll>
            <Stack.Screen
                options={{
                    title:
                        currentUserId !== ascent.id_uzytkownika &&
                        "username" in ascent
                            ? `${ascent.imie} ${ascent.nazwisko}`
                            : "Szczegóły",
                    headerRight: () =>
                        currentUserId === ascent.id_uzytkownika ? (
                            <TouchableOpacity
                                onPress={handleDelete}
                                style={{ marginRight: 20 }}
                            >
                                <FontAwesome6
                                    name="trash-can"
                                    color={theme.iconColour}
                                    size={22}
                                />
                            </TouchableOpacity>
                        ) : null,
                }}
            />
            <Spacer height={16} />
            <ThemedText title style={styles.title}>
                {ascent.nazwa_drogi}
            </ThemedText>
            <View style={styles.subtitle}>
                <RouteTypeBadge route_type={ascent.typ_drogi ?? ""} />
                <RouteGradeBadge route_grade={ascent.wycena ?? ""} />
                <RouteStyleBadge route_style={ascent.nazwa_stylu ?? ""} />
            </View>

            <Spacer height={28} />
            <ThemedText style={styles.noteLabel}>Notatka:</ThemedText>
            <ThemedText style={styles.note}>
                {ascent.notatka || "Brak notatki"}
            </ThemedText>
            {ascent.timeline_data &&
                Object.keys(ascent.timeline_data).length > 0 && (
                    <>
                        <Spacer height={10} />
                        <ThemedTimeline timelineData={ascent.timeline_data} />
                    </>
                )}

            <Spacer height={20} />
            <ThemedText style={{ opacity: 0.5, fontSize: 12 }}>
                ID Przejścia: {ascent.id_przejscia}
            </ThemedText>
            <Spacer height={40} />
        </ThemedView>
    );
};

export default AscentDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
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
    noteLabel: {
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 5,
        opacity: 0.5,
    },
    note: {
        fontSize: 16,
        fontStyle: "italic",
        lineHeight: 24,
    },
    timeline: {
        height: 100,
    },
});

import {
    StyleSheet,
    FlatList,
    TouchableOpacity,
    View,
    RefreshControl,
} from "react-native";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";

import { Colors } from "../../../constants/Colors";
import { useTheme } from "../../../contexts/ThemeContext";

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedCard from "../../../components/ThemedCard";
import ManualAscentFormModal, {
    ManualAscentFormValues,
} from "../../../components/ManualAscentFormModal";

import {
    AscentRepository,
    Ascent,
} from "../../../database/repositories/AscentRepository";
import { useMe } from "../../../lib/hooks/useProfile";
import {
    UserService,
    AscentRouteOption,
} from "../../../services/api/UserService";

import RouteTypeBadge from "../../../components/Badges/RouteTypeBadge";
import RouteGradeBadge from "../../../components/Badges/RouteGradeBadge";
import RouteStyleBadge from "../../../components/Badges/RouteStyleBadge";

const Asce = () => {
    const db = useSQLiteContext();
    const { data: user } = useMe();
    const [ascents, setAscents] = useState<Ascent[]>([]);
    const [routes, setRoutes] = useState<AscentRouteOption[]>([]);
    const [stylesList, setStylesList] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    // Inicjalizacja repozytorium
    const repository = useMemo(() => new AscentRepository(db), [db]);

    const loadAscents = async () => {
        if (!user?.id) return;
        try {
            const data = await repository.getAscentsForUser(Number(user.id));
            setAscents(data);
        } catch (error) {
            console.error("Błąd podczas ładowania przejść:", error);
        }
    };

    const loadRoutes = async () => {
        try {
            const data = await repository.getRoutesForSelection();
            setRoutes(data);
        } catch (error) {
            console.error("Błąd podczas ładowania dróg:", error);
        }
    };

    const loadStyles = async () => {
        try {
            const data = await repository.getStylesForSelection();
            setStylesList(data);
        } catch (error) {
            console.error("Błąd podczas ładowania stylów:", error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadAscents();
        setRefreshing(false);
    }, [user?.id, repository]);

    useEffect(() => {
        loadAscents();
        loadRoutes();
        loadStyles();
    }, [user?.id]);

    const handleSaveManualAscent = async (values: ManualAscentFormValues) => {
        if (!user?.id) return;

        try {
            setSaving(true);
            console.log("values: ", values);

            await UserService.createAscent({
                data: values.data,
                id_drogi: values.id_drogi,
                notatka: values.notatka,
                nazwa_stylu: values.nazwa_stylu,
            });
            await repository.addManualAscent({
                data: values.data,
                id_drogi: values.id_drogi,
                notatka: values.notatka,
                id_uzytkownika: Number(user.id),
                nazwa_stylu: values.nazwa_stylu,
            });
            await loadAscents();
            setFormVisible(false);
        } catch (error) {
            console.error("Błąd podczas zapisywania przejścia:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ManualAscentFormModal
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSubmit={handleSaveManualAscent}
                saving={saving}
                routes={routes}
                styles={stylesList}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setFormVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Dodaj przejście"
            >
                <ThemedText style={styles.fabIcon}>+</ThemedText>
            </TouchableOpacity>

            <FlatList
                data={ascents}
                keyExtractor={(item) => item.id_przejscia}
                showsVerticalScrollIndicator={false}
                style={{ width: "100%" }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
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
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={styles.heading}>
                                        {item.nazwa_drogi ?? "Bez nazwy"}
                                    </ThemedText>
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
                    <ThemedText>Brak zarejestrowanych przejść.</ThemedText>
                }
            />
        </ThemedView>
    );
};

export default Asce;

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
});

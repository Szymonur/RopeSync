import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useMemo, useState } from "react";

import ThemedButton from "./ThemedButton";
import ThemedText from "./ThemedText";
import ThemedTextInput from "./ThemedTextInput";
import ThemedView from "./ThemedView";
import Spacer from "./Spacer";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";
import { RouteForSelection } from "../database/repositories/AscentRepository";

export interface ManualAscentFormValues {
    data: string;
    id_drogi: string;
    notatka: string;
}

interface ManualAscentFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (values: ManualAscentFormValues) => Promise<void> | void;
    saving?: boolean;
    routes: RouteForSelection[];
}

const getToday = () => new Date().toISOString().split("T")[0];

const ManualAscentFormModal = ({
    visible,
    onClose,
    onSubmit,
    saving,
    routes,
}: ManualAscentFormModalProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const [data, setData] = useState(getToday());
    const [notatka, setNotatka] = useState("");
    const [routeFilter, setRouteFilter] = useState("");
    const [selectedRouteId, setSelectedRouteId] = useState("");

    const filteredRoutes = useMemo(() => {
        const query = routeFilter.trim().toLowerCase();
        if (!query) return routes;

        return routes.filter((route) => route.nazwa_drogi.toLowerCase().includes(query));
    }, [routeFilter, routes]);

    const selectedRoute = useMemo(
        () => routes.find((route) => route.id_drogi === selectedRouteId),
        [routes, selectedRouteId],
    );

    const canSubmit = useMemo(
        () =>
            data.trim().length > 0 &&
            selectedRouteId.trim().length > 0 &&
            notatka.trim().length > 0,
        [data, selectedRouteId, notatka],
    );

    const resetForm = () => {
        setData(getToday());
        setNotatka("");
        setRouteFilter("");
        setSelectedRouteId("");
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;

        await onSubmit({
            data: data.trim(),
            id_drogi: selectedRouteId,
            notatka: notatka.trim(),
        });

        resetForm();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <ThemedView style={styles.sheet}>
                    <View style={styles.header}>
                        <ThemedText style={styles.title}>Dodaj przejście</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <ThemedText style={styles.closeText}>Zamknij</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <ThemedText style={styles.label}>Data przejścia</ThemedText>
                        <ThemedTextInput value={data} onChangeText={setData} placeholder="YYYY-MM-DD" />

                        <Spacer height={12} />
                        <ThemedText style={styles.label}>Szukaj drogi</ThemedText>
                        <ThemedTextInput
                            value={routeFilter}
                            onChangeText={setRouteFilter}
                            placeholder="Wpisz nazwę drogi..."
                        />

                        <Spacer height={12} />
                        <ThemedText style={styles.label}>Wybierz drogę z bazy</ThemedText>
                        <View style={styles.routesList}>
                            {filteredRoutes.length === 0 ? (
                                <ThemedText style={{ opacity: 0.7 }}>
                                    Brak dróg pasujących do filtra.
                                </ThemedText>
                            ) : (
                                filteredRoutes.map((item) => {
                                    const selected = selectedRouteId === item.id_drogi;

                                    return (
                                        <TouchableOpacity
                                            key={item.id_drogi}
                                            onPress={() => setSelectedRouteId(item.id_drogi)}
                                            style={[
                                                styles.routeItem,
                                                {
                                                    backgroundColor: selected
                                                        ? theme.iconColourFocused
                                                        : theme.uiBackground,
                                                    borderColor: theme.iconColourFocused,
                                                },
                                            ]}
                                        >
                                            <ThemedText
                                                style={{
                                                    color: selected ? theme.background : theme.text,
                                                    fontWeight: "700",
                                                }}
                                            >
                                                {item.nazwa_drogi}
                                            </ThemedText>
                                            <ThemedText
                                                style={{
                                                    color: selected ? theme.background : theme.text,
                                                    opacity: 0.8,
                                                }}
                                            >
                                                {item.typ_drogi}
                                                {item.wycena ? ` • ${item.wycena}` : ""}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>

                        {selectedRoute && (
                            <>
                                <Spacer height={8} />
                                <ThemedText style={styles.selectedHint}>
                                    Wybrano: {selectedRoute.nazwa_drogi} • {selectedRoute.typ_drogi}
                                    {selectedRoute.wycena ? ` • ${selectedRoute.wycena}` : ""}
                                </ThemedText>
                            </>
                        )}

                        <Spacer height={12} />
                        <ThemedText style={styles.label}>Krótki opis</ThemedText>
                        <ThemedTextInput
                            value={notatka}
                            onChangeText={setNotatka}
                            placeholder="Jak było?"
                            multiline
                            numberOfLines={4}
                            style={styles.multilineInput}
                        />

                        <Spacer height={18} />
                        <ThemedButton
                            onPress={handleSubmit}
                            disabled={!canSubmit || !!saving}
                            style={{ opacity: !canSubmit || saving ? 0.6 : 1 }}
                        >
                            <ThemedText style={{ textAlign: "center", color: "white" }}>
                                {saving ? "Zapisywanie..." : "Zapisz przejście"}
                            </ThemedText>
                        </ThemedButton>
                    </ScrollView>
                </ThemedView>
            </View>
        </Modal>
    );
};

export default ManualAscentFormModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: "88%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
    },
    closeButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    closeText: {
        opacity: 0.8,
        fontWeight: "700",
    },
    label: {
        marginBottom: 6,
        fontWeight: "700",
    },
    routesList: {
        borderRadius: 12,
        overflow: "hidden",
        maxHeight: 240,
    },
    routeItem: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 10,
    },
    selectedHint: {
        opacity: 0.8,
        fontSize: 12,
    },
    multilineInput: {
        minHeight: 96,
        textAlignVertical: "top",
        paddingTop: 12,
    },
});
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Platform,
    View,
    Keyboard,
    KeyboardEvent,
} from "react-native";
import { useEffect, useMemo, useState } from "react";

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
    nazwa_stylu: string;
}

interface ManualAscentFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (values: ManualAscentFormValues) => Promise<void> | void;
    saving?: boolean;
    routes: RouteForSelection[];
    styles: string[];
    preselectedRouteId?: string;
    hideRouteSearch?: boolean;
}

const getToday = () => new Date().toISOString().split("T")[0];

const ManualAscentFormModal = ({
    visible,
    onClose,
    onSubmit,
    saving,
    routes,
    styles: stylesList,
    preselectedRouteId,
    hideRouteSearch,
}: ManualAscentFormModalProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const [data, setData] = useState(getToday());
    const [note, setNote] = useState("");
    const [ascentStyle, setAscentStyle] = useState("RP");
    const [routeFilter, setRouteFilter] = useState("");
    const [selectedRouteId, setSelectedRouteId] = useState(
        preselectedRouteId || "",
    );

    const [routeFilterError, setRouteFilterError] = useState("");

    // Dodano stan dla wysokości klawiatury
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        if (preselectedRouteId) {
            setSelectedRouteId(preselectedRouteId);
        }
    }, [preselectedRouteId]);

    useEffect(() => {
        const showEvent =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const keyboardDidShowListener = Keyboard.addListener(
            showEvent,
            (e: KeyboardEvent) => {
                setKeyboardHeight(e.endCoordinates.height);
            },
        );
        const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    useEffect(() => {
        if (routeFilter.length === 0 || routeFilter.length >= 2) {
            setRouteFilterError("");
            return;
        }

        const timer = setTimeout(() => {
            if (routeFilter.length === 1) {
                setRouteFilterError("Min. 2 znaki są wymagane");
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [routeFilter]);

    const filteredRoutes = useMemo(() => {
        const query = routeFilter.trim().toLowerCase();
        if (query.length < 2) return [];

        return routes.filter((route) =>
            route.nazwa_drogi.toLowerCase().includes(query),
        );
    }, [routeFilter, routes]);

    const selectedRoute = useMemo(
        () => routes.find((route) => route.id_drogi === selectedRouteId),
        [routes, selectedRouteId],
    );

    const canSubmit = useMemo(
        () =>
            data.trim().length > 0 &&
            selectedRouteId.trim().length > 0 &&
            ascentStyle.length > 0,
        [data, selectedRouteId, note, ascentStyle],
    );

    const resetForm = () => {
        setData(getToday());
        setNote("");
        setRouteFilter("");
        setSelectedRouteId(preselectedRouteId || "");
        setAscentStyle("RP");
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;

        await onSubmit({
            data: data.trim(),
            id_drogi: selectedRouteId,
            notatka: note.trim(),
            nazwa_stylu: ascentStyle,
        });

        resetForm();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.backdrop}>
                <ThemedView
                    style={[
                        styles.sheet,
                        {
                            paddingBottom:
                                keyboardHeight > 0 ? keyboardHeight : 20,
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <ThemedText style={styles.title}>
                            Dodaj przejście
                        </ThemedText>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <ThemedText style={styles.closeText}>
                                Zamknij
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <ThemedText style={styles.label}>
                            Data przejścia
                        </ThemedText>
                        <ThemedTextInput
                            value={data}
                            onChangeText={setData}
                            placeholder="YYYY-MM-DD"
                        />

                        <Spacer height={12} />
                        
                        {!hideRouteSearch && (
                            <>
                                <ThemedText style={styles.label}>
                                    Szukaj drogi
                                </ThemedText>
                                <ThemedTextInput
                                    value={routeFilter}
                                    onChangeText={setRouteFilter}
                                    placeholder="Wpisz nazwę drogi..."
                                    error={routeFilterError}
                                />

                                <ScrollView
                                    style={styles.routesList}
                                    nestedScrollEnabled={true}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {filteredRoutes.length === 0 &&
                                    routeFilter.length >= 2 ? (
                                        <ThemedText style={{ opacity: 0.7 }}>
                                            Brak dróg pasujących do filtra.
                                        </ThemedText>
                                    ) : (
                                        filteredRoutes.map((item) => {
                                            const selected =
                                                selectedRouteId === item.id_drogi;

                                            return (
                                                <TouchableOpacity
                                                    key={item.id_drogi}
                                                    onPress={() => {
                                                        if (
                                                            selectedRouteId ==
                                                            item.id_drogi
                                                        ) {
                                                            setSelectedRouteId("");
                                                        } else {
                                                            setSelectedRouteId(
                                                                item.id_drogi,
                                                            );
                                                        }
                                                    }}
                                                    style={[
                                                        styles.routeItem,
                                                        {
                                                            backgroundColor: selected
                                                                ? theme.iconColourFocused
                                                                : theme.uiBackground,
                                                            borderColor:
                                                                theme.iconColourFocused,
                                                        },
                                                    ]}
                                                >
                                                    <ThemedText
                                                        style={{
                                                            color: selected
                                                                ? theme.background
                                                                : theme.text,
                                                            fontWeight: "700",
                                                        }}
                                                    >
                                                        {item.nazwa_drogi}
                                                    </ThemedText>
                                                    <ThemedText
                                                        style={{
                                                            color: selected
                                                                ? theme.background
                                                                : theme.text,
                                                            opacity: 0.8,
                                                        }}
                                                    >
                                                        {item.nazwa_rejonu} •{" "}
                                                        {item.typ_drogi}
                                                        {item.wycena
                                                            ? ` • ${item.wycena}`
                                                            : ""}
                                                    </ThemedText>
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </ScrollView>
                            </>
                        )}

                        {selectedRoute && (
                            <>
                                <ThemedText style={styles.selectedHint}>
                                    Wybrałeś: {selectedRoute.nazwa_drogi} •{" "}
                                    {selectedRoute.nazwa_rejonu} •{" "}
                                    {selectedRoute.typ_drogi}
                                    {selectedRoute.wycena
                                        ? ` • ${selectedRoute.wycena}`
                                        : ""}
                                </ThemedText>
                            </>
                        )}

                        <Spacer height={12} />
                        <ThemedText style={styles.label}>
                            Styl przejścia
                        </ThemedText>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.stylesList}
                        >
                            {stylesList.map((style) => {
                                const selected = ascentStyle === style;
                                return (
                                    <TouchableOpacity
                                        key={style}
                                        onPress={() => setAscentStyle(style)}
                                        style={[
                                            styles.styleItem,
                                            {
                                                backgroundColor: selected
                                                    ? theme.iconColourFocused
                                                    : theme.uiBackground,
                                                borderColor:
                                                    theme.iconColourFocused,
                                            },
                                        ]}
                                    >
                                        <ThemedText
                                            style={{
                                                color: selected
                                                    ? theme.background
                                                    : theme.text,
                                                fontWeight: "700",
                                            }}
                                        >
                                            {style}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <Spacer height={12} />
                        <ThemedText style={styles.label}>
                            Krótki opis
                        </ThemedText>
                        <ThemedTextInput
                            value={note}
                            onChangeText={setNote}
                            placeholder="Jak było?"
                            multiline
                            numberOfLines={4}
                            style={styles.multilineInput}
                        />

                        <Spacer height={18} />
                        <ThemedButton
                            onPress={handleSubmit}
                            disabled={!canSubmit || !!saving}
                            style={{
                                opacity: !canSubmit || saving ? 0.4 : 1,
                            }}
                        >
                            <ThemedText
                                style={{
                                    textAlign: "center",
                                    color: "white",
                                }}
                            >
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
    stylesList: {
        flexDirection: "row",
        marginBottom: 10,
    },
    styleItem: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
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

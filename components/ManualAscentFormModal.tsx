import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Platform,
    View,
    Keyboard,
    KeyboardEvent,
    ActivityIndicator,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import {randomUUID} from "expo-crypto";

import ThemedButton from "./ThemedButton";
import ThemedText from "./ThemedText";
import ThemedTextInput from "./ThemedTextInput";
import ThemedView from "./ThemedView";
import Spacer from "./Spacer";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

import { useAscentStyles, useAddAscent } from "../lib/hooks/useAscents";
import { useRoutes } from "../lib/hooks/useRoutes";
import { useDebounce} from "../lib/hooks/useDebounce"

import DateTimePicker, { DateType } from 'react-native-ui-datepicker';

import { useSnackbar } from "../contexts/SnackbarContext";
import { useAuth } from "../contexts/AuthContext";
import { useNetwork } from "../contexts/NetworkContext";

import Ionicons from "@expo/vector-icons/Ionicons";

export interface ManualAscentFormValues {
    data: string;
    id_drogi: string;
    notatka: string;
    nazwa_stylu: string;
}

interface ManualAscentFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    preselectedRouteId?: string;
    hideRouteSearch?: boolean;
}

const getToday = () => new Date().toISOString().split("T")[0];

const formatDate = (date: DateType) => {
    if (!date) return getToday();
    const d = new Date(date.toString());
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ManualAscentFormModal = ({
    visible,
    onClose,
    onSuccess,
    preselectedRouteId,
    hideRouteSearch,
}: ManualAscentFormModalProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const { currentUserId: userId } = useAuth();
    const { showSnackbar } = useSnackbar();

    const { data: stylesList = [] } = useAscentStyles();
    const addAscentMutation = useAddAscent();

    const [data, setData] = useState(getToday());
    const [note, setNote] = useState("");
    const [ascentStyle, setAscentStyle] = useState("RP");
    const [routeFilter, setRouteFilter] = useState("");

	const debouncedRouteFilter = useDebounce(routeFilter);

    const { data: routes = [] } = useRoutes(
        { nazwa_drogi: debouncedRouteFilter.trim() },
        { enabled: visible && !hideRouteSearch && debouncedRouteFilter.trim().length >= 2 }
    );

    const [selectedRouteId, setSelectedRouteId] = useState(
        preselectedRouteId || "",
    );

    const [routeFilterError, setRouteFilterError] = useState("");
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
        const query = debouncedRouteFilter.trim();
        if (query.length === 1) {
            setRouteFilterError("Wpisz przynajmniej 2 znaki!");
        } else {
            setRouteFilterError("");
        }
    }, [debouncedRouteFilter]);

    const selectedRoute = useMemo(
        () => routes.find((route) => route.id_drogi === selectedRouteId),
        [routes, selectedRouteId],
    );

    const canSubmit = useMemo(
        () =>
            data.trim().length > 0 &&
            selectedRouteId.trim().length > 0 &&
            ascentStyle.length > 0,
        [data, selectedRouteId, ascentStyle],
    );

    const resetForm = () => {
        setData(getToday());
        setNote("");
        setRouteFilter("");
        setSelectedRouteId(preselectedRouteId || "");
        setAscentStyle("RP");
    };

    const handleSubmit = async () => {
        if (!canSubmit || !userId) return;

        try {
            await addAscentMutation.mutateAsync({
                id_przejscia: randomUUID(),
                timeline_data: {},
                data: data.trim(),
                id_drogi: selectedRouteId,
                notatka: note.trim(),
                id_uzytkownika: Number(userId),
                nazwa_stylu: ascentStyle,
                synced: 0,
            });

            if (onSuccess) onSuccess();
            onClose();

            showSnackbar({
                message: "Przejście zostało zapisane",
                type: "success",
            });

            resetForm();
        } catch (error) {
            console.error("Błąd zapisu przejścia:", error);
            showSnackbar({
                message: "Wystąpił błąd podczas zapisywania",
                type: "error",
            });
        }
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
                            <Ionicons
                                name="close"
                                size={28}
                                color={theme.iconColour}
                            />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
						    <DateTimePicker
                                mode="single"
                                date={data}
                                onChange={({ date }) => {
                                    if (date) {
                                        setData(formatDate(date));
                                    }
                                }}
                                styles={{
                                    day_label: { color: theme.text },
                                    month_selector_label: { color: theme.text },
                                    year_selector_label: { color: theme.text },
                                    weekday_label: { color: theme.text },
                                    selected: { backgroundColor: Colors.primary, borderRadius: 10 },
                                    selected_label: { color: 'white' },
                                    today: { borderColor: Colors.primary, borderWidth: 1, borderRadius: 10 },
                                    today_label: { color: Colors.primary }
                                }}
							/>

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
                                    {routes.length === 0 && debouncedRouteFilter.length >= 2 ? (
                                        <ThemedText style={{ opacity: 0.7 }}>
                                            Brak dróg pasujących do filtra.
                                        </ThemedText>
                                    ) : (
                                        routes.map((item) => {
                                            const selected = selectedRouteId === item.id_drogi;

                                            return (
                                                <TouchableOpacity
                                                    key={item.id_drogi}
                                                    onPress={() => {
                                                        if (
                                                            selectedRouteId ==
                                                            item.id_drogi
                                                        ) {
                                                            setSelectedRouteId(
                                                                "",
                                                            );
                                                        } else {
                                                            setSelectedRouteId(
                                                                item.id_drogi,
                                                            );
                                                        }
                                                    }}
                                                    style={[
                                                        styles.routeItem,
                                                        {
                                                            backgroundColor:
                                                                selected
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
                                const selected = style.nazwa_stylu === ascentStyle;
                                return (
                                    <TouchableOpacity
                                        key={style.nazwa_stylu}
                                        onPress={() => setAscentStyle(style.nazwa_stylu)}
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
                                            {style.nazwa_stylu}
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
                            disabled={!canSubmit || addAscentMutation.isPending}
                            style={{
                                opacity: !canSubmit || addAscentMutation.isPending ? 0.4 : 1,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 10,
                                }}
                            >
                                <ThemedText
                                    style={{
                                        textAlign: "center",
                                        color: "white",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {addAscentMutation.isPending ? (
                                        <ActivityIndicator
                                            size="small"
                                            color="white"
                                        />
                                    ) : (
                                        "Zapisz przejście"
                                    )}
                                </ThemedText>
                            </View>
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

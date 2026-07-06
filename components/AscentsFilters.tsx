import {
    StyleSheet,
    TouchableOpacity,
    Modal,
    View,
    ScrollView,
	Platform
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, useEffect } from "react";
import DateTimePicker, { DateType } from 'react-native-ui-datepicker';

import ThemedView from "./ThemedView";
import { useAscentStyles } from "../lib/hooks/useAscents";
import ThemedText from "./ThemedText";
import ThemedButton from "./ThemedButton";
import Spacer from "./Spacer";

import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";
import { AscentFilters } from "../types/ascent";

interface AscentsFiltersProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: AscentFilters) => void;
    currentFilters: AscentFilters;
}

const formatDate = (date: DateType) => {
    if (!date) return "";
    const d = new Date(date.toString());
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AscentsFilters = ({ visible, onClose, onApply, currentFilters }: AscentsFiltersProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const { data: stylesList = [] } = useAscentStyles();

	const isWeb = Platform.OS === "web";
    
    // Lokalne stany "robocze"
    const [selectedStyles, setSelectedStyles] = useState<string[]>(currentFilters.styles);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(currentFilters.types);
    const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom);
    const [dateTo, setDateTo] = useState(currentFilters.dateTo);

    // Synchronizacja z nadrzędnym stanem przy otwarciu modala
    useEffect(() => {
        if (visible) {
            setSelectedStyles(currentFilters.styles);
            setSelectedTypes(currentFilters.types);
            setDateFrom(currentFilters.dateFrom);
            setDateTo(currentFilters.dateTo);
        }
    }, [visible, currentFilters]);

    const toggleStyle = (styleName: string) => {
        setSelectedStyles(prev => 
            prev.includes(styleName) 
                ? prev.filter(s => s !== styleName) 
                : [...prev, styleName]
        );
    };

    const toggleType = (typeName: string) => {
        setSelectedTypes(prev => 
            prev.includes(typeName) 
                ? prev.filter(s => s !== typeName) 
                : [...prev, typeName]
        );
    };

    const handleApply = () => {
        onApply({
            styles: selectedStyles,
            types: selectedTypes,
            dateFrom,
            dateTo,
        });
    };

    const handleReset = () => {
        setSelectedStyles([]);
        setSelectedTypes([]);
        setDateFrom("");
        setDateTo("");
    };

    const routeTypes = ["sportowa", "trad", "boulder"];

    return (
        <Modal 
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.backdrop}>
                <ThemedView style={styles.sheet}>
                    <View style={styles.header}>
                        <ThemedText style={styles.title}>Filtry</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color={theme.iconColour} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <ThemedText style={styles.label}>Style przejścia</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
                            {stylesList.map((style) => {
                                const selected = selectedStyles.includes(style.nazwa_stylu);
                                return (
                                    <TouchableOpacity
                                        key={style.nazwa_stylu}
                                        onPress={() => toggleStyle(style.nazwa_stylu)}
                                        style={[
                                            styles.filterItem,
                                            {
                                                backgroundColor: selected ? theme.iconColourFocused : theme.uiBackground,
                                                borderColor: theme.iconColourFocused,
                                            },
                                        ]}
                                    >
                                        <ThemedText style={[styles.filterText, { color: selected ? theme.background : theme.text }]}>
                                            {style.nazwa_stylu}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <Spacer height={16} />

                        <ThemedText style={styles.label}>Typ drogi</ThemedText>
                        <View style={styles.wrapList}>
                            {routeTypes.map((type) => {
                                const selected = selectedTypes.includes(type);
                                return (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => toggleType(type)}
                                        style={[
                                            styles.filterItem,
                                            {
                                                backgroundColor: selected ? theme.iconColourFocused : theme.uiBackground,
                                                borderColor: theme.iconColourFocused,
                                                marginBottom: 8,
                                            },
                                        ]}
                                    >
                                        <ThemedText style={[styles.filterText, { color: selected ? theme.background : theme.text }]}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Spacer height={16} />

                        <ThemedText style={styles.label}>Zakres dat</ThemedText>
                        <DateTimePicker
                            mode="range"
                            startDate={dateFrom}
                            endDate={dateTo}
                            onChange={({ startDate, endDate }) => {
                                setDateFrom(formatDate(startDate));
                                setDateTo(formatDate(endDate));
                            }}
                            styles={{
                                day_label: { color: theme.text },
                                month_selector_label: { color: theme.text },
                                year_selector_label: { color: theme.text },
                                weekday_label: { color: theme.text },
                                selected: { backgroundColor: Colors.primary, borderRadius: 10 },
                                selected_label: { color: 'white' },
                                today: { borderColor: Colors.primary, borderWidth: 1, borderRadius: 10 },
                                today_label: { color: Colors.primary },
                                range_fill: { backgroundColor: Colors.primary + '30' }
                            }}
                        />

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                                <ThemedText style={{ color: Colors.error }}>Wyczyść wszystko</ThemedText>
                            </TouchableOpacity>
                            <ThemedButton onPress={handleApply} style={styles.applyButton}>
                                <ThemedText style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Zastosuj filtry</ThemedText>
                            </ThemedButton>
                        </View>
                        
                        <Spacer height={20} />
                    </ScrollView>
                </ThemedView>
            </View>
        </Modal>
    );
};

export default AscentsFilters;

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
        maxHeight: "85%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
    },
    closeButton: {
        padding: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 10,
        opacity: 0.8,
    },
    horizontalList: {
        flexDirection: "row",
    },
    wrapList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    filterItem: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
    },
    filterText: {
        fontWeight: "700",
        fontSize: 13,
    },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 10,
    },
    resetButton: {
        paddingVertical: 10,
    },
    applyButton: {
        flex: 1,
        marginLeft: 20,
    },
});

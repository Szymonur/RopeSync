import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, ActivityIndicator } from "react-native";
import { File, Directory, Paths } from "expo-file-system";
import ThemedText from "./ThemedText";
import Spacer from "../components/Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

// Maksymalna wysokość ściany w metrach
const SCALE_FACTOR = 40; // Ile pikseli przypada na 1 metr
const MAX_HEIGHT = 25;

interface ThemedTimelineProps {
    uriTimeline: string;
}

const ThemedTimeline = ({ uriTimeline }: ThemedTimelineProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const [timelineData, setTimelineData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTimeline = async () => {
            if (!uriTimeline) {
                setError("Brak ścieżki do danych timeline.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Nowe API: Tworzymy instancję pliku relatywnie do Paths.document
                const file = new File(Paths.document, uriTimeline);

                if (!file.exists) {
                    console.error("Plik nie istnieje pod ścieżką:");
                    throw new Error(
                        `Plik wspinaczki nie istnieje (${uriTimeline})`,
                    );
                }

                // Używamy wersji asynchronicznej
                const content = await file.textSync();
                setTimelineData(JSON.parse(content));
            } catch (err: any) {
                console.error("Błąd ładowania timeline:", err);
                setError(`Błąd: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadTimeline();
    }, [uriTimeline]);

    if (loading) {
        return (
            <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="large" color={theme.text} />
                <ThemedText style={{ marginTop: 10 }}>
                    Ładowanie danych wspinaczki...
                </ThemedText>
            </View>
        );
    }

    if (error || !timelineData) {
        return (
            <View style={{ padding: 20, alignItems: "center" }}>
                <Ionicons
                    name="alert-circle-outline"
                    size={40}
                    color={Colors.warning}
                />
                <ThemedText
                    style={{
                        color: Colors.warning,
                        textAlign: "center",
                        marginTop: 10,
                    }}
                >
                    {error || "Nie udało się załadować danych."}
                </ThemedText>
            </View>
        );
    }

    const { timeline } = timelineData;

    // Funkcja dobierająca kolor do typu zdarzenia
    const getEventColor = (type: string) => {
        switch (type) {
            case "fall":
                return Colors.warning; // Czerwony dla upadku
            case "clip":
                return "#44AAFF"; // Niebieski dla wpinki
            case "anchor":
                return "#44FF44"; // Zielony dla stanowiska
            default:
                return theme.iconColour;
        }
    };

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            style={{ transform: [{ scaleY: -1 }] }}
        >
            <View
                style={[
                    styles.container,
                    {
                        height: MAX_HEIGHT * SCALE_FACTOR + 14,
                        transform: [{ scaleY: -1 }],
                    },
                ]}
            >
                {/* 1. Pionowa Linia (Oś) */}
                <View
                    style={[
                        styles.verticalLine,
                        { backgroundColor: theme.text },
                    ]}
                />

                {/* 2. Skala wysokości (np. co 5m) */}
                {Array.from({ length: Math.ceil(MAX_HEIGHT / 5) + 1 }).map(
                    (_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.scaleMark,
                                { bottom: i * 5 * SCALE_FACTOR },
                            ]}
                        >
                            <ThemedText
                                style={[
                                    styles.scaleText,
                                    { color: theme.iconColour },
                                ]}
                            >
                                {i * 5} m —
                            </ThemedText>
                        </View>
                    ),
                )}

                {/* 3. Eventy z JSONA */}
                {timeline.map((item: any, index: number) => {
                    const event = item.events[0];
                    const eventColor = getEventColor(event.type);

                    return (
                        <View
                            key={index}
                            style={[
                                styles.eventWrapper,
                                { bottom: item.height * SCALE_FACTOR },
                            ]}
                        >
                            <View
                                style={[
                                    {
                                        left: -80,
                                        position: "absolute",
                                        width: 80,
                                        display: "flex",
                                        flexDirection: "column",
                                    },
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        {
                                            fontSize: 12,
                                            textAlign: "right",
                                        },
                                    ]}
                                >
                                    {item.height} m
                                </ThemedText>
                            </View>

                            <View
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: eventColor,
                                        borderColor: theme.background,
                                    },
                                ]}
                            />

                            <View
                                style={[
                                    styles.eventCard,
                                    {
                                        borderColor: eventColor,
                                        backgroundColor: theme.uiBackground,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        {
                                            display: "flex",
                                            justifyContent: "space-between",
                                            flexDirection: "row",
                                            height: 20,
                                        },
                                    ]}
                                >
                                    <ThemedText style={styles.eventType}>
                                        {event.type.toUpperCase()}
                                    </ThemedText>
                                    <ThemedText
                                        style={[
                                            {
                                                fontSize: 12,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name="timer-outline"
                                            size={12}
                                            color={theme.text}
                                        />{" "}
                                        {Math.floor(item.timestamp / 60)}:
                                        {(item.timestamp % 60)
                                            .toString()
                                            .padStart(2, "0")}
                                    </ThemedText>
                                </View>

                                {event.type === "fall" &&
                                    "fallenDisnace" in event &&
                                    "duration" in event &&
                                    "force" in event && (
                                        <ThemedText style={[styles.fallText]}>
                                            Przeleciałeś{" "}
                                            <ThemedText bold>
                                                {event.fallenDisnace} m
                                            </ThemedText>
                                            przez
                                            <ThemedText bold>
                                                {event.duration} s{"\n"}
                                            </ThemedText>
                                            generując
                                            <ThemedText bold>
                                                {event.force} kN
                                            </ThemedText>{" "}
                                        </ThemedText>
                                    )}
                                {event.type === "clip" &&
                                    "clipingTime" in event &&
                                    "force" in event &&
                                    "belayRate" in event && (
                                        <ThemedText style={[styles.clipText]}>
                                            Wpinka zajeła ci{" "}
                                            <ThemedText bold>
                                                {event.clipingTime} s {"\n"}
                                            </ThemedText>
                                            podczas niej wygenerowałeś siłe{" "}
                                            <ThemedText bold>
                                                {event.force} kN {"\n"}
                                            </ThemedText>
                                            Ocena asekurującego{" "}
                                            <ThemedText bold>
                                                {event.belayRate}/10
                                            </ThemedText>
                                        </ThemedText>
                                    )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        paddingVertical: 5,
        paddingHorizontal: 5,
    },
    container: {
        width: "100%",
        position: "relative",
        marginLeft: 40, // Miejsce na skalę po lewej
    },
    verticalLine: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderRadius: 2,
    },
    scaleMark: {
        position: "absolute",
        left: -45,
        flexDirection: "row",
        alignItems: "center",
    },
    scaleText: {
        fontSize: 12,
        width: 40,
        textAlign: "right",
    },
    eventWrapper: {
        position: "absolute",
        left: -8, // Wyśrodkowanie kropki na linii (szerokość linii/2 - promień kropki)
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 3,
        elevation: 3, // Cień na Androidzie
        shadowColor: "#000", // Cień na iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
    },
    eventCard: {
        marginLeft: 15,
        padding: 8,
        borderRadius: 8,
        borderLeftWidth: 4,
        minWidth: 150,
    },
    eventType: {
        fontWeight: "bold",
        fontSize: 12,
    },
    eventDetails: {
        fontSize: 11,
    },
    fallText: {
        fontSize: 11,
    },
    clipText: {
        fontSize: 11,
    },
});

export default ThemedTimeline;

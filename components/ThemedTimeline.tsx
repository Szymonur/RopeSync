import React from "react";
import { StyleSheet, View, ScrollView, useColorScheme } from "react-native";
import ThemedText from "./ThemedText";
import timelineData from "../database/timelines/timeline-user1-1.json";
import Spacer from "../components/Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Colors } from "../constants/Colors";

// Maksymalna wysokość ściany w metrach
const SCALE_FACTOR = 40; // Ile pikseli przypada na 1 metr
const MAX_HEIGHT = 25;

interface ThemedTimelineProps {
    userId: number;
}

const ThemedTimeline = ({ userId }: ThemedTimelineProps) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || "light"];

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
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View
                style={[
                    styles.container,
                    { height: MAX_HEIGHT * SCALE_FACTOR + 14 },
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

                {/* 3. Eventy z JSONa */}
                {timeline.map((item, index) => {
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
                                            color="white"
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
            <Spacer />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        paddingVertical: 40,
        paddingHorizontal: 20,
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

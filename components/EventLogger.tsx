import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import ThemedText from "./ThemedText";
import ThemedButton from "./ThemedButton";

import { useAuth } from "../contexts/AuthContext";
import { useAddAscent } from "../lib/hooks/useAscents";

const EVENT_TYPES = [
    "start",
    "end",
    "fall",
    "anchor",
    "shortRope",
    "excessSlack",
] as const;

type EventCategory =
    | (typeof EVENT_TYPES)[number]
    | "block"
    | "rest"
    | "clip";
type EventState = "start" | "end";

type GeneratedEvent = {
    category: EventCategory;
    timestamp: string;
    state?: EventState;
    milliseconds: number;
};

const EventLogger = () => {
    const { currentUserId: userId } = useAuth();
    const { mutateAsync: addAscent } = useAddAscent();

    const [generatedEvents, setGeneratedEvents] = useState<GeneratedEvent[]>([]);
    const [clipPressed, setClipPressed] = useState(false);
    const [toggleStates, setToggleStates] = useState<{
        block?: boolean;
        rest?: boolean;
    }>({});

    const appendEvent = (category: GeneratedEvent["category"], state?: EventState) => {
        const timestamp = new Date();
        const event: GeneratedEvent = {
            category,
            timestamp: timestamp.toISOString(),
            milliseconds: timestamp.getTime(),
            ...(state ? { state } : {}),
        };

        setGeneratedEvents((prev) => [...prev, event]);
    };

    const registerSingleEvent = (category: EventCategory) => {
        appendEvent(category);
    };

    const handleToggleEvent = (category: "block" | "rest") => {
        const isActive = !!toggleStates[category];

        if (isActive) {
            appendEvent(category, "end");
            setToggleStates((prev) => ({ ...prev, [category]: false }));
            return;
        }

        appendEvent(category, "start");
        setToggleStates((prev) => ({ ...prev, [category]: true }));
    };

    const handleClipPressIn = () => {
        if (clipPressed) return;
        setClipPressed(true);
        appendEvent("clip", "start");
    };

    const handleClipPressOut = () => {
        if (!clipPressed) return;
        setClipPressed(false);
        appendEvent("clip", "end");
    };

    const eventPayload = {
        date: new Date().toISOString().split("T")[0],
        user: userId ? String(userId) : "unknown_user",
        generatedAt: new Date().toISOString(),
        events: generatedEvents,
    };

    const sendGeneratedJsonToApi = async () => {
        if (!generatedEvents.length) {
            Alert.alert("Brak danych", "Najpierw dodaj przynajmniej jedno zdarzenie.");
            return;
        }

        try {
            const payload = {
                date: new Date().toISOString().split("T")[0],
                user: userId ? String(userId) : "unknown_user",
                generatedAt: new Date().toISOString(),
                events: generatedEvents,
            };

            await addAscent({
                id_przejscia: `events_${Date.now()}`,
                data: payload.date,
                notatka: "Wygenerowane flagi zdarzeń z ekranu urządzenia",
                timeline_data: payload,
                id_uzytkownika: Number(userId),
                synced: 0,
                deleted: 0,
                nazwa_stylu: "RP",
                id_drogi: "01b90955-958b-4dfd-8e16-f80c4e21fcbc",
            });

            Alert.alert("Sukces", "JSON z eventami został zapisany i wysłany do API.");
        } catch (error: any) {
            console.error("Błąd wysyłki eventów:", error);
            Alert.alert("Błąd", error.message || "Nie udało się wysłać danych.");
        }
    };

    return (
        <View style={styles.eventLoggerSection}>
            <ThemedText style={styles.eventLoggerTitle}>
                Rejestracja zdarzeń
            </ThemedText>

            <View style={styles.eventGrid}>
                {EVENT_TYPES.map((eventType) => (
                    <ThemedButton
                        key={eventType}
                        onPress={() => registerSingleEvent(eventType)}
                        style={styles.eventButton}
                    >
                        <ThemedText style={{ color: "white", textAlign: "center" }}>
                            {eventType}
                        </ThemedText>
                    </ThemedButton>
                ))}

                <ThemedButton
                    onPressIn={handleClipPressIn}
                    onPressOut={handleClipPressOut}
                    style={[
                        styles.eventButton,
                        { backgroundColor: clipPressed ? "#ff9800" : "#3f51b5" },
                    ]}
                >
                    <ThemedText style={{ color: "white", textAlign: "center" }}>
                        {clipPressed ? "Clip: STOP" : "Clip: START"}
                    </ThemedText>
                </ThemedButton>

                <ThemedButton
                    onPress={() => handleToggleEvent("block")}
                    style={[
                        styles.eventButton,
                        { backgroundColor: toggleStates.block ? "#f44336" : "#795548" },
                    ]}
                >
                    <ThemedText style={{ color: "white", textAlign: "center" }}>
                        {toggleStates.block ? "Block: END" : "Block: START"}
                    </ThemedText>
                </ThemedButton>

                <ThemedButton
                    onPress={() => handleToggleEvent("rest")}
                    style={[
                        styles.eventButton,
                        { backgroundColor: toggleStates.rest ? "#9c27b0" : "#673ab7" },
                    ]}
                >
                    <ThemedText style={{ color: "white", textAlign: "center" }}>
                        {toggleStates.rest ? "Rest: END" : "Rest: START"}
                    </ThemedText>
                </ThemedButton>
            </View>

            <View style={styles.actionRow}>
                <ThemedButton
                    onPress={() => setGeneratedEvents([])}
                    style={{ backgroundColor: "#444" }}
                >
                    <ThemedText style={{ color: "white" }}>
                        Wyczyść
                    </ThemedText>
                </ThemedButton>
                <ThemedButton
                    onPress={sendGeneratedJsonToApi}
                    style={{ backgroundColor: "#27ae60" }}
                >
                    <ThemedText style={{ color: "white" }}>
                        Wyślij JSON do API
                    </ThemedText>
                </ThemedButton>
            </View>

            <View style={styles.jsonBox}>
                <ThemedText style={styles.jsonTitle}>
                    JSON wygenerowanych eventów
                </ThemedText>
                <ThemedText style={styles.jsonPreview}>
                    {JSON.stringify(eventPayload, null, 2)}
                </ThemedText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    eventLoggerSection: {
        width: "100%",
        padding: 15,
        borderRadius: 15,
        backgroundColor: "rgba(0, 150, 136, 0.08)",
        borderWidth: 1,
        borderColor: "rgba(0, 150, 136, 0.3)",
        marginBottom: 20,
    },
    eventLoggerTitle: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 10,
        textAlign: "center",
    },
    eventGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 8,
    },
    eventButton: {
        minWidth: "45%",
        marginVertical: 8,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
        gap: 8,
    },
    jsonBox: {
        marginTop: 12,
        padding: 10,
        borderRadius: 10,
        backgroundColor: "rgba(0,0,0,0.2)",
    },
    jsonTitle: {
        fontWeight: "bold",
        marginBottom: 8,
    },
    jsonPreview: {
        fontSize: 12,
        fontFamily: "monospace",
    },
});

export default EventLogger;
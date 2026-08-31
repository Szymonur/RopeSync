import { ActivityIndicator, StyleSheet, View, Alert } from "react-native";
import { useState } from "react";
import { useNetwork } from "../../../contexts/NetworkContext";

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedButton from "../../../components/ThemedButton";

import { useBLE } from "../../../lib/hooks/useBLE";
import { useAddAscent } from "../../../lib/hooks/useAscents";

import { useAuth } from "../../../contexts/AuthContext";

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

const DeviceScreen = () => {
    const { currentUserId: userId } = useAuth();
    const { mutateAsync: addAscent } = useAddAscent();
    const {
        scanForPeripherals,
        isScanning,
        connectedDevice,
        disconnectFromDevice,
        sensorData,
        updateRate,
        resetAltitude,
    } = useBLE();

    const [eventLoggerVisible, setEventLoggerVisible] = useState(false);
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

            Alert.alert(
                "Sukces",
                "JSON z eventami został zapisany i wysłany do API.",
            );
        } catch (error: any) {
            console.error("Błąd wysyłki eventów:", error);
            Alert.alert("Błąd", error.message || "Nie udało się wysłać danych.");
        }
    };

    const createMockTimeline = async () => {
        try {
            const mockId = `mock_${Date.now()}`;

            const mockData = {
                date: new Date().toISOString().split("T")[0],
                user: "mock_user",
                startTime: new Date().toISOString(),
                routeLenght: 15.5,
                timeline: [
                    {
                        timestamp: 10,
                        height: 2.5,
                        events: [
                            {
                                type: "clip",
                                clipingTime: 1.5,
                                force: 0.1,
                                belayRate: 8,
                            },
                        ],
                    },
                    {
                        timestamp: 15,
                        height: 3,
                        events: [
                            {
                                type: "clip",
                                clipingTime: 1.5,
                                force: 0.1,
                                belayRate: 8,
                            },
                        ],
                    },

                    {
                        timestamp: 25,
                        height: 6.5,
                        events: [
                            {
                                type: "clip",
                                clipingTime: 1.5,
                                force: 0.1,
                                belayRate: 8,
                            },
                        ],
                    },
                    {
                        timestamp: 45,
                        height: 8.2,
                        events: [
                            {
                                type: "fall",
                                force: 2.1,
                                duration: 1.2,
                                fallenDisnace: 3.5,
                            },
                        ],
                    },
                    {
                        timestamp: 70,
                        height: 12.5,
                        events: [
                            {
                                type: "clip",
                                clipingTime: 1.5,
                                force: 0.1,
                                belayRate: 8,
                            },
                        ],
                    },
                    {
                        timestamp: 80,
                        height: 12.6,
                        events: [
                            {
                                type: "clip",
                                clipingTime: 1.5,
                                force: 0.1,
                                belayRate: 8,
                            },
                        ],
                    },
                    {
                        timestamp: 90,
                        height: 17.5,
                        events: [{ type: "anchor" }],
                    },
                ],
            };

            await addAscent({
                id_przejscia: mockId,
                data: new Date().toISOString().split("T")[0],
                notatka: "Automatycznie wygenerowany mock timeline",
                timeline_data: mockData,
                id_uzytkownika: Number(userId),
                synced: 0,
                deleted: 0,
                nazwa_stylu: "RP",
                id_drogi: "d_s1",
            });

            Alert.alert(
                "Sukces",
                "Utworzono mockowe przejście i zapisano dane w bazie.",
            );
        } catch (error: any) {
            console.error("Błąd tworzenia mocka:", error);
            Alert.alert("Błąd", error.message);
        }
    };

    return (
        <ThemedView style={styles.container} scroll>
            <View style={styles.header}>
                <ThemedText title={true} style={styles.heading}>
                    {connectedDevice
                        ? `Połączono z RopeSync 🟢`
                        : "Brak połączenia 🔴"}
                </ThemedText>
            </View>

            <View style={styles.mockSection}>
                <ThemedText
                    style={{
                        marginBottom: 10,
                        textAlign: "center",
                        opacity: 0.7,
                    }}
                >
                    Tryb deweloperski (Symulacja urządzenia)
                </ThemedText>
                <ThemedButton
                    onPress={createMockTimeline}
                    style={{ backgroundColor: "#6200ee" }}
                >
                    <ThemedText style={{ color: "white" }}>
                        Generuj Mock Timeline
                    </ThemedText>
                </ThemedButton>

                <ThemedButton
                    onPress={() => setEventLoggerVisible((prev) => !prev)}
                    style={{ backgroundColor: "#009688" }}
                >
                    <ThemedText style={{ color: "white" }}>
                        {eventLoggerVisible
                            ? "Ukryj generowanie flag"
                            : "Generuj flagi zdarzeń"}
                    </ThemedText>
                </ThemedButton>
            </View>

            {eventLoggerVisible && (
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
                                <ThemedText style={{ color: "white", textAlign: "center"  }}>
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
                            <ThemedText style={{ color: "white", textAlign: "center"  }}>
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
                            <ThemedText style={{ color: "white", textAlign: "center"  }}>
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
            )}

            <Spacer />

            {isScanning && <ActivityIndicator size="large" color="#FFF" />}
            {!connectedDevice && !isScanning && (
                <ThemedButton
                    onPress={() => {
                        scanForPeripherals();
                    }}
                    disabled={isScanning || !!connectedDevice}
                >
                    <ThemedText style={{ textAlign: "center", color: "white" }}>
                        {isScanning
                            ? "Szukam RopeSync..."
                            : "Połącz z urządzeniem"}
                    </ThemedText>
                </ThemedButton>
            )}
            <Spacer />
            {connectedDevice && (
                <View style={styles.dataContainer}>
                    <ThemedText style={styles.dataTitle}>
                        Dane na żywo ( {updateRate} Hz )
                    </ThemedText>

                    <View style={styles.dataBox}>
                        <ThemedText style={styles.dataLabel}>
                            Wysokość względem startu:
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.dataValue,
                                { color: "#E91E63", fontSize: 32 },
                            ]}
                        >
                            {sensorData.altitude.toFixed(2)} m
                        </ThemedText>
                        <ThemedText style={styles.dataSubText}>
                            Ciśnienie: {sensorData.pressure.toFixed(2)} hPa
                        </ThemedText>

                        <ThemedButton
                            onPress={resetAltitude}
                            style={{
                                marginTop: 10,
                                backgroundColor: "#555",
                            }}
                        >
                            <ThemedText style={{ fontSize: 12 }}>
                                Wyzeruj Wysokość (TARA)
                            </ThemedText>
                        </ThemedButton>
                    </View>

                    <View style={styles.dataBox}>
                        <ThemedText style={styles.dataLabel}>
                            Siła naciągu:
                        </ThemedText>
                        <ThemedText style={styles.dataValue}>
                            {sensorData.force.toFixed(2)} N
                        </ThemedText>
                    </View>

                    <View style={styles.dataBox}>
                        <ThemedText style={styles.dataLabel}>
                            Kwaterniony:
                        </ThemedText>
                        <ThemedText style={styles.dataSubText}>
                            X: {sensorData.qX.toFixed(3)}
                        </ThemedText>
                        <ThemedText style={styles.dataSubText}>
                            Y: {sensorData.qY.toFixed(3)}
                        </ThemedText>
                        <ThemedText style={styles.dataSubText}>
                            Z: {sensorData.qZ.toFixed(3)}
                        </ThemedText>
                        <ThemedText style={styles.dataSubText}>
                            W: {sensorData.qW.toFixed(3)}
                        </ThemedText>
                    </View>
                    <ThemedButton onPress={() => disconnectFromDevice()}>
                        <ThemedText style={{ textAlign: "center" }}>
                            Rozłącz
                        </ThemedText>
                    </ThemedButton>
                </View>
            )}
        </ThemedView>
    );
};

export default DeviceScreen;

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    header: { marginBottom: 20 },
    heading: { fontWeight: "bold", fontSize: 20, textAlign: "center" },
    mockSection: {
        width: "100%",
        padding: 15,
        backgroundColor: "rgba(98, 0, 238, 0.1)",
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(98, 0, 238, 0.3)",
    },
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
        color: "#d4d4d4",
    },
    dataContainer: {
        width: "100%",
        padding: 15,
        backgroundColor: "rgba(100,100,100,0.1)",
        borderRadius: 15,
    },
    dataTitle: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 15,
        textAlign: "center",
        color: "#4CAF50",
    },
    dataBox: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 10,
    },
    dataLabel: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
    dataValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#2196F3",
        textAlign: "center",
    },
    dataSubText: { fontSize: 16, fontFamily: "monospace", marginVertical: 2 },
});

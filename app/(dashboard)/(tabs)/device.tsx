import { StyleSheet, View, Alert } from "react-native";
import { useState } from "react";
import { useNetwork } from "../../../contexts/NetworkContext";

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedButton from "../../../components/ThemedButton";
import DelayedActivityIndicator from "../../../components/DelayedActivityIndicator";
import EventLogger from"../../../components/EventLogger";

import { useBLE } from "../../../lib/hooks/useBLE";
import { useAddAscent } from "../../../lib/hooks/useAscents";
import { useAuth } from "../../../contexts/AuthContext";

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
        // Nowe z hooka useBLE
        triggerSync,
        isSyncing,
        syncProgress,
		syncedData,
    } = useBLE();

    const [eventLoggerVisible, setEventLoggerVisible] = useState(false);

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
                        events: [{ type: "clip", clipingTime: 1.5, force: 0.1, belayRate: 8 }],
                    },
                    {
                        timestamp: 45,
                        height: 8.2,
                        events: [{ type: "fall", force: 2.1, duration: 1.2, fallenDisnace: 3.5 }],
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
                data: mockData.date,
                notatka: "Automatycznie wygenerowany mock timeline",
                timeline_data: mockData,
                id_uzytkownika: Number(userId),
                synced: 0,
                deleted: 0,
                nazwa_stylu: "RP",
                id_drogi: "d_s1",
            });

            Alert.alert("Sukces", "Utworzono mockowe przejście i zapisano dane w bazie.");
        } catch (error: any) {
            console.error("Błąd tworzenia mocka:", error);
            Alert.alert("Błąd", error.message);
        }
    };

    return (
        <ThemedView style={styles.container} scroll>
            <View style={styles.header}>
                <ThemedText title={true} style={styles.heading}>
                    {connectedDevice ? `Połączono z RopeSync 🟢` : "Brak połączenia 🔴"}
                </ThemedText>
            </View>

            {/* SEKCJA DEWELOPERSKA */}
            <View style={styles.mockSection}>
                <ThemedText style={{ marginBottom: 10, textAlign: "center", opacity: 0.7 }}>
                    Tryb deweloperski (Symulacja urządzenia)
                </ThemedText>
                <ThemedButton onPress={createMockTimeline} style={{ backgroundColor: "#6200ee" }}>
                    <ThemedText style={{ color: "white" }}>Generuj Mock Timeline</ThemedText>
                </ThemedButton>
                <ThemedButton
                    onPress={() => setEventLoggerVisible((prev) => !prev)}
                    style={{ backgroundColor: "#009688" }}
                >
                    <ThemedText style={{ color: "white" }}>
                        {eventLoggerVisible ? "Ukryj generowanie flag" : "Generuj flagi zdarzeń"}
                    </ThemedText>
                </ThemedButton>
            </View>

            {/* Użycie wydzielonego EventLoggera */}
            {eventLoggerVisible && <EventLogger />}
            <Spacer />

            {/* SKANOWANIE BLE */}
            {isScanning && (
                <DelayedActivityIndicator isLoading={isScanning} size="large" style={{ marginTop: 20 }} />
            )}
            {!connectedDevice && !isScanning && (
                <ThemedButton
                    onPress={() => scanForPeripherals()}
                    disabled={isScanning || !!connectedDevice}
                >
                    <ThemedText style={{ textAlign: "center", color: "white" }}>
                        {isScanning ? "Szukam RopeSync..." : "Połącz z urządzeniem"}
                    </ThemedText>
                </ThemedButton>
            )}

            <Spacer />

            {/* DANE Z URZĄDZENIA ORAZ SYNCHRONIZACJA */}
            {connectedDevice && (
                <View style={styles.dataContainer}>
                    {/* Panel Synchronizacji */}
                    <View style={styles.syncBox}>
                        {!isSyncing ? (
							<View>
                                <ThemedButton onPress={triggerSync} style={{ backgroundColor: "#ff9800", marginBottom: 10 }}>
                                    <ThemedText style={{ color: "white", textAlign: "center" }}>
                                        Rozpocznij synchronizację (Pobierz dane)
                                    </ThemedText>
                                </ThemedButton>
                                
                                <ThemedButton 
                                    onPress={() => {
                                        console.log("Pobrane rekordy:", JSON.stringify(syncedData, null, 2));
                                        Alert.alert(
                                            "Zsynchronizowane dane", 
                                            `Obecnie w pamięci jest: ${syncedData.length} rekordów.\n\nPierwszy rekord siła: ${syncedData[0]?.force || 'brak'}`
                                        );
                                    }} 
                                    style={{ backgroundColor: "#2196F3" }}
                                >
                                    <ThemedText style={{ color: "white", textAlign: "center" }}>
                                        Pokaż zawartość pobranych danych
                                    </ThemedText>
                                </ThemedButton>
                            </View>
							
                        ) : (
                            <View style={{ width: "100%", alignItems: "center" }}>
                                <ThemedText style={{ marginBottom: 8, fontWeight: "bold" }}>
                                    Pobieranie... {syncProgress}%
                                </ThemedText>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${syncProgress}%` }]} />
                                </View>
                            </View>
                        )}
                    </View>

                    <ThemedText style={styles.dataTitle}>
                        Dane na żywo ( {updateRate} Hz )
                    </ThemedText>

                    <View style={styles.dataBox}>
                        <ThemedText style={styles.dataLabel}>Wysokość względem startu:</ThemedText>
                        <ThemedText style={[styles.dataValue, { color: "#E91E63", fontSize: 32 }]}>
                            {sensorData.altitude.toFixed(2)} m
                        </ThemedText>
                        <ThemedText style={styles.dataSubText}>
                            Ciśnienie: {sensorData.pressure.toFixed(2)} hPa
                        </ThemedText>
                        <ThemedButton onPress={resetAltitude} style={{ marginTop: 10, backgroundColor: "#555" }}>
                            <ThemedText style={{ fontSize: 12, color: "white", textAlign: "center" }}>
                                Wyzeruj Wysokość (TARA)
                            </ThemedText>
                        </ThemedButton>
                    </View>

                    <View style={styles.dataBox}>
                        <ThemedText style={styles.dataLabel}>Siła naciągu:</ThemedText>
                        <ThemedText style={styles.dataValue}>{sensorData.force.toFixed(2)} N</ThemedText>
                    </View>

                    <View style={styles.dataBox}>
                        <ThemedText style={styles.dataLabel}>Kwaterniony:</ThemedText>
                        <ThemedText style={styles.dataSubText}>X: {sensorData.qX.toFixed(3)}</ThemedText>
                        <ThemedText style={styles.dataSubText}>Y: {sensorData.qY.toFixed(3)}</ThemedText>
                        <ThemedText style={styles.dataSubText}>Z: {sensorData.qZ.toFixed(3)}</ThemedText>
                        <ThemedText style={styles.dataSubText}>W: {sensorData.qW.toFixed(3)}</ThemedText>
                    </View>
                    
                    <ThemedButton onPress={() => disconnectFromDevice()} style={{ backgroundColor: "#d32f2f" }}>
                        <ThemedText style={{ textAlign: "center", color: "white" }}>Rozłącz</ThemedText>
                    </ThemedButton>
                </View>
            )}
        </ThemedView>
    );
};

export default DeviceScreen;

const styles = StyleSheet.create({
    container: { justifyContent: "center", alignItems: "center", padding: 20 },
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
    dataContainer: {
        width: "100%",
        padding: 15,
        backgroundColor: "rgba(100,100,100,0.1)",
        borderRadius: 15,
    },
    syncBox: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: "rgba(255, 152, 0, 0.1)",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255, 152, 0, 0.3)",
    },
    progressBarBg: {
        width: "100%",
        height: 20,
        backgroundColor: "#ccc",
        borderRadius: 10,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#4CAF50",
    },
    dataTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 15, textAlign: "center", color: "#4CAF50" },
    dataBox: { marginBottom: 15, padding: 10, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 10 },
    dataLabel: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
    dataValue: { fontSize: 24, fontWeight: "bold", color: "#2196F3", textAlign: "center" },
    dataSubText: { fontSize: 16, fontFamily: "monospace", marginVertical: 2 },
});
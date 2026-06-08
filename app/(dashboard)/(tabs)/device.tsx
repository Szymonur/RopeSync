import { ActivityIndicator, StyleSheet, View, Alert } from "react-native";
import { useNetwork } from "../../../contexts/NetworkContext";

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedButton from "../../../components/ThemedButton";

import { useBLE } from "../../../lib/hooks/useBLE";
import { useRepositories } from "../../../contexts/RepositoryContext";


import { UserService } from "../../../services/api/UserService";

import { useAuth } from "../../../contexts/AuthContext";

const DeviceScreen = () => {
    const { currentUserId: userId } = useAuth();
    const { ascentRepository } = useRepositories();

    const {
        scanForPeripherals,
        isScanning,
        connectedDevice,
        disconnectFromDevice,
        sensorData,
        updateRate,
        resetAltitude,
    } = useBLE();

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

            await ascentRepository.addAscent({
                id_przejscia: mockId,
                data: new Date().toISOString().split("T")[0],
                notatka: "Automatycznie wygenerowany mock timeline",
                timeline_data: mockData,
                id_uzytkownika: Number(userId),
                synced: 0,
                deleted: 0,
                nazwa_stylu: "RP",
                id_drogi: "d_s1", // Istniejąca droga w SEED_DATA
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
            </View>

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
                        {/* Pokazujemy metry z centymetrową dokładnością */}
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
                        {/* toFixed(2) zaokrągla do 2 miejsc po przecinku */}
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

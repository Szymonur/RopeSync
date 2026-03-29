import React from "react";
import { StyleSheet, View } from "react-native";

import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";

// Importujemy nasz nowy Hook!
import { useBLE } from "../../lib/hooks/useBLE";

const DeviceScreen = () => {
    const {
        scanForPeripherals,
        sendData,
        isScanning,
        connectedDevice,
        disconnectFromDevice,
        sensorData,
        updateRate,
    } = useBLE();

    return (
        <ThemedView style={styles.container} safe>
            <View style={styles.header}>
                <ThemedText title={true} style={styles.heading}>
                    Status:{" "}
                    {connectedDevice
                        ? `Połączono z RopeSync 🟢`
                        : "Brak połączenia 🔴"}
                </ThemedText>
            </View>

            <Spacer />

            {!connectedDevice && (
                <ThemedButton
                    onPress={scanForPeripherals}
                    disabled={isScanning || !!connectedDevice}
                >
                    <ThemedText>
                        {isScanning
                            ? "Szukam RopeSync..."
                            : "Połącz z urządzeniem"}
                    </ThemedText>
                </ThemedButton>
            )}

            <Spacer />

            {connectedDevice && (
                <>
                    <ThemedButton
                        onPress={() => sendData("Siema ESP, tutaj aplikacja!")}
                    >
                        <ThemedText>Wyślij testowe dane</ThemedText>
                    </ThemedButton>
                    <ThemedButton onPress={() => disconnectFromDevice()}>
                        <ThemedText>Rozłącz</ThemedText>
                    </ThemedButton>
                </>
            )}
            <Spacer />
            {connectedDevice && (
                <View style={styles.dataContainer}>
                    <ThemedText style={styles.dataTitle}>
                        Dane na żywo ( {updateRate} Hz )
                    </ThemedText>

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
                </View>
            )}
        </ThemedView>
    );
};

export default DeviceScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    header: { marginBottom: 40 },
    heading: { fontWeight: "bold", fontSize: 20, textAlign: "center" },
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

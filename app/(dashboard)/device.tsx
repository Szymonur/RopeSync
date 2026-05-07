import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";

import { useBLE } from "../../lib/hooks/useBLE";

const DeviceScreen = () => {
    const {
        scanForPeripherals,
        isScanning,
        connectedDevice,
        disconnectFromDevice,
        sensorData,
        updateRate,
        resetAltitude,
    } = useBLE();

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setIsLoading(false);
        }
    }, [connectedDevice]);

    return (
        <ThemedView style={styles.container} safe scroll>
            <View style={styles.header}>
                <ThemedText title={true} style={styles.heading}>
                    {connectedDevice
                        ? `Połączono z RopeSync 🟢`
                        : "Brak połączenia 🔴"}
                </ThemedText>
            </View>
            {isLoading && <ActivityIndicator size="large" color="#FFF" />}
            {!connectedDevice && !isLoading && (
                <ThemedButton
                    onPress={() => {
                        scanForPeripherals();
                        setIsLoading(true);
                    }}
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
                        <ThemedText>Rozłącz</ThemedText>
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

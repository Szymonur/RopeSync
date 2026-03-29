import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Alert,
    FlatList,
    TouchableOpacity,
    View,
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";

import { requestAndroid31Permissions } from "../../lib/utils/bluetoothPermissions";

const DeviceScreen = () => {
    const [manager] = useState(() => new BleManager());
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

    // NOWY STAN: Tablica przechowująca znalezione urządzenia
    const [scannedDevices, setScannedDevices] = useState<Device[]>([]);

    useEffect(() => {
        return () => {
            manager.stopDeviceScan();
        };
    }, []);

    const handleScan = async () => {
        const hasPermissions = await requestAndroid31Permissions();
        if (!hasPermissions) {
            Alert.alert("Błąd", "Brak uprawnień!");
            return;
        }

        const btState = await manager.state();
        if (btState !== "PoweredOn") {
            Alert.alert("Błąd", "Włącz Bluetooth w telefonie!");
            return;
        }

        // Czyścimy starą listę przed nowym skanowaniem
        setScannedDevices([]);
        setIsScanning(true);
        console.log("Rozpoczynam szerokie skanowanie...");

        manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error("Błąd skanowania:", error.message);
                setIsScanning(false);
                return;
            }

            if (device) {
                // Dodajemy urządzenie do listy, omijając duplikaty (sprawdzamy po MAC adresie / ID)
                setScannedDevices((prevDevices) => {
                    const isDuplicate = prevDevices.some(
                        (d) => d.id === device.id
                    );
                    if (!isDuplicate) {
                        return [...prevDevices, device];
                    }
                    return prevDevices;
                });
            }
        });

        setTimeout(() => {
            manager.stopDeviceScan();
            setIsScanning(false);
            console.log("Koniec czasu skanowania.");
        }, 10000);
    };

    const connectToDevice = async (device: Device) => {
        try {
            // Zatrzymujemy skanowanie przed próbą połączenia!
            manager.stopDeviceScan();
            setIsScanning(false);

            console.log(`Łączenie z ${device.name || device.id}...`);
            const connected = await device.connect();
            console.log("Połączono! Odkrywanie serwisów...");

            const discovered =
                await connected.discoverAllServicesAndCharacteristics();
            setConnectedDevice(discovered);

            Alert.alert(
                "Sukces",
                `Połączono z ${device.name || "nieznanym urządzeniem"}!`
            );
        } catch (e) {
            console.error("Błąd połączenia:", e);
            Alert.alert("Błąd", "Nie udało się połączyć.");
        }
    };

    // Funkcja rysująca pojedynczy element na liście
    const renderDeviceItem = ({ item }: { item: Device }) => {
        return (
            <TouchableOpacity
                style={styles.deviceItem}
                onPress={() => connectToDevice(item)}
            >
                <ThemedText style={styles.deviceName}>
                    {item.name || "Nieznane urządzenie"}
                </ThemedText>
                <ThemedText style={styles.deviceId}>{item.id}</ThemedText>
                {/* Pokazujemy siłę sygnału jeśli jest dostępna */}
                <ThemedText style={styles.deviceRssi}>
                    RSSI: {item.rssi}
                </ThemedText>
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={styles.container} safe>
            <View style={styles.header}>
                <ThemedText title={true} style={styles.heading}>
                    Status:{" "}
                    {connectedDevice ? `Połączono 🟢` : "Brak połączenia 🔴"}
                </ThemedText>
                {connectedDevice && (
                    <ThemedText style={{ textAlign: "center" }}>
                        ({connectedDevice.name || connectedDevice.id})
                    </ThemedText>
                )}
            </View>

            <ThemedButton onPress={handleScan} disabled={isScanning}>
                <ThemedText>
                    {isScanning ? "Szukam urządzeń..." : "Skanuj okolicę"}
                </ThemedText>
            </ThemedButton>

            <Spacer />

            <FlatList
                data={scannedDevices}
                keyExtractor={(item) => item.id}
                renderItem={renderDeviceItem}
                style={styles.list}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    !isScanning ? (
                        <ThemedText style={styles.emptyText}>
                            Brak urządzeń do wyświetlenia.
                        </ThemedText>
                    ) : null
                }
            />
        </ThemedView>
    );
};

export default DeviceScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    header: {
        marginBottom: 20,
    },
    heading: {
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
    },
    list: {
        flex: 1,
        width: "100%",
        paddingHorizontal: 20,
    },
    deviceItem: {
        backgroundColor: "rgba(150, 150, 150, 0.1)",
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.3)",
    },
    deviceName: {
        fontWeight: "bold",
        fontSize: 16,
    },
    deviceId: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 4,
    },
    deviceRssi: {
        fontSize: 12,
        opacity: 0.5,
        marginTop: 2,
    },
    emptyText: {
        textAlign: "center",
        opacity: 0.5,
        marginTop: 20,
    },
});

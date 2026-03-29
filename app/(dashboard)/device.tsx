import React, { useState, useEffect } from "react";
import { StyleSheet, Alert, View } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";

import { requestAndroid31Permissions } from "../../lib/utils/bluetoothPermissions";

// Funkcja pomocnicza kodująca tekst do formatu Base64 (wymagane przez BLE-PLX)
const encodeToBase64 = (text: string) => {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let str = text;
    let output = "";
    for (
        let block = 0, charCode, i = 0, map = chars;
        str.charAt(i | 0) || ((map = "="), i % 1);
        output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
    ) {
        charCode = str.charCodeAt((i += 3 / 4));
        block = (block << 8) | charCode;
    }
    return output;
};

const DeviceScreen = () => {
    const [manager] = useState(() => new BleManager());
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

    // Twoje UUID skopiowane z ESP32
    const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
    const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
    const TARGET_DEVICE_NAME = "RopeSync"; // Czego dokładnie szukamy

    useEffect(() => {
        return () => {
            manager.stopDeviceScan();
        };
    }, []);

    const handleAutoConnect = async () => {
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

        setIsScanning(true);
        console.log(`Szukam urządzenia: ${TARGET_DEVICE_NAME}...`);

        manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error("Błąd skanowania:", error.message);
                setIsScanning(false);
                return;
            }

            // Jeśli nazwa urządzenia zgadza się z naszym celem
            if (device && device.name === TARGET_DEVICE_NAME) {
                console.log(
                    "Znaleziono RopeSync! Przerywam skanowanie i łączę..."
                );
                manager.stopDeviceScan();
                setIsScanning(false);
                connectToDevice(device);
            }
        });

        // Timeout, jeśli nie znajdzie po 10 sekundach
        setTimeout(() => {
            if (isScanning) {
                manager.stopDeviceScan();
                setIsScanning(false);
                Alert.alert(
                    "Niepowodzenie",
                    "Nie znaleziono RopeSync w pobliżu."
                );
            }
        }, 10000);
    };

    const connectToDevice = async (device: Device) => {
        try {
            console.log("Nawiązywanie połączenia...");
            const connected = await device.connect();
            console.log("Połączono! Odkrywanie serwisów...");

            const discovered =
                await connected.discoverAllServicesAndCharacteristics();
            setConnectedDevice(discovered);

            Alert.alert("Połączono!", "RopeSync jest gotowe do pracy.");
        } catch (e) {
            console.error("Błąd połączenia:", e);
            Alert.alert("Błąd", "Nie udało się połączyć.");
        }
    };

    // NOWA FUNKCJA: Wysyłanie danych do ESP32
    const handleSendData = async () => {
        if (!connectedDevice) {
            Alert.alert("Błąd", "Najpierw połącz się z urządzeniem!");
            return;
        }

        try {
            // Kodujemy naszą wiadomość do Base64
            const message = "Siema ESP, tutaj aplikacja!";
            const base64Data = encodeToBase64(message);

            console.log("Wysyłam dane...");
            await connectedDevice.writeCharacteristicWithResponseForService(
                SERVICE_UUID,
                CHARACTERISTIC_UUID,
                base64Data
            );

            console.log("Wysłano pomyślnie!");
        } catch (error) {
            console.error("Błąd wysyłania:", error);
            Alert.alert("Błąd", "Nie udało się wysłać danych.");
        }
    };

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

            <ThemedButton
                onPress={handleAutoConnect}
                disabled={isScanning || !!connectedDevice}
            >
                <ThemedText>
                    {isScanning ? "Szukam RopeSync..." : "Połącz z urządzeniem"}
                </ThemedText>
            </ThemedButton>

            <Spacer />

            {/* Ten przycisk pojawi się tylko, jeśli jesteś połączony z urządzeniem */}
            {connectedDevice && (
                <ThemedButton onPress={handleSendData}>
                    <ThemedText>Wyślij testowe dane</ThemedText>
                </ThemedButton>
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
    header: {
        marginBottom: 40,
    },
    heading: {
        fontWeight: "bold",
        fontSize: 20,
        textAlign: "center",
    },
});

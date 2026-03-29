import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { requestAndroid31Permissions } from "../utils/bluetoothPermissions";
import {
    BLE_TARGET_NAME,
    BLE_SERVICE_UUID,
    BLE_CHARACTERISTIC_UUID,
} from "../../constants/bluetooth";
import { encodeToBase64, base64ToArrayBuffer } from "../utils/base64";

export interface SensorData {
    force: number;
    qX: number;
    qY: number;
    qZ: number;
    qW: number;
}

export const useBLE = () => {
    const [manager] = useState(() => new BleManager());
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [sensorData, setSensorData] = useState<SensorData>({
        force: 0,
        qX: 0,
        qY: 0,
        qZ: 0,
        qW: 0,
    });
    const packetCountRef = useRef(0); // Cichy licznik pakietów
    const [updateRate, setUpdateRate] = useState(0); // Stan wyświetlany na ekranie (Hz)
    // Timer (Interwał), który co sekundę sprawdza licznik i go resetuje
    useEffect(() => {
        let interval: NodeJS.Timeout;

        // Uruchamiamy timer tylko, gdy jesteśmy połączeni
        if (connectedDevice) {
            interval = setInterval(() => {
                // Zapisujemy, ile pakietów przyszło przez ostatnią sekundę
                setUpdateRate(packetCountRef.current);
                // Resetujemy cichy licznik na start nowej sekundy
                packetCountRef.current = 0;
            }, 1000);
        }

        // Sprzątanie timera przy odłączeniu
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [connectedDevice]);

    useEffect(() => {
        return () => {
            manager.stopDeviceScan();
        };
    }, [manager]);

    const startStreamingData = (device: Device) => {
        if (!device) return;

        console.log("Zakładam podsłuch na powiadomienia z ESP...");
        device.monitorCharacteristicForService(
            BLE_SERVICE_UUID,
            BLE_CHARACTERISTIC_UUID,
            (error, characteristic) => {
                if (error) {
                    // Ignorujemy błędy po rozłączeniu
                    if (error.errorCode !== 2)
                        console.error("Błąd monitorowania:", error);
                    return;
                }

                if (characteristic?.value) {
                    // większenie licznika do śledzenia przychodzących pakietów
                    packetCountRef.current += 1;

                    // 1. Dekodujemy Base64 na surowe bajty
                    const buffer = base64ToArrayBuffer(characteristic.value);
                    const dataView = new DataView(buffer);

                    // 2. Czytamy kolejne liczby Float (po 4 bajty każda)
                    // Pamiętaj! ESP32 jest "Little Endian" (odwrotna kolejność bajtów), dlatego drugi parametr to "true"
                    const force = dataView.getFloat32(0, true);
                    const qX = dataView.getFloat32(4, true);
                    const qY = dataView.getFloat32(8, true);
                    const qZ = dataView.getFloat32(12, true);
                    const qW = dataView.getFloat32(16, true);

                    // 3. Zapisujemy do stanu (UI się odświeży)
                    setSensorData({ force, qX, qY, qZ, qW });
                }
            }
        );
    };

    const connectToDevice = async (device: Device) => {
        try {
            const connected = await device.connect();
            const discovered =
                await connected.discoverAllServicesAndCharacteristics();
            setConnectedDevice(discovered);
            Alert.alert("Connected!", `${BLE_TARGET_NAME} is ready.`);

            packetCountRef.current = 0;
            setUpdateRate(0);

            startStreamingData(discovered);
        } catch (e) {
            console.error("Connection error:", e);
            Alert.alert("Error", "Unable to connect.");
        }
    };

    const scanForPeripherals = async () => {
        const hasPermissions = await requestAndroid31Permissions();
        if (!hasPermissions) {
            Alert.alert("Error", "Insufficient permissions");
            return;
        }

        const btState = await manager.state();
        if (btState !== "PoweredOn") {
            Alert.alert("Error", "Turn on Bluetooth on your phone!");
            return;
        }

        setIsScanning(true);
        manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error(error.message);
                setIsScanning(false);
                return;
            }

            if (device && device.name === BLE_TARGET_NAME) {
                manager.stopDeviceScan();
                setIsScanning(false);
                connectToDevice(device);
            }
        });

        setTimeout(() => {
            manager.stopDeviceScan();
            setIsScanning(false);
        }, 10000);
    };

    const sendData = async (text: string) => {
        if (!connectedDevice) return;

        try {
            const base64Data = encodeToBase64(text);
            await connectedDevice.writeCharacteristicWithResponseForService(
                BLE_SERVICE_UUID,
                BLE_CHARACTERISTIC_UUID,
                base64Data
            );
        } catch (error) {
            console.error("Send error:", error);
            Alert.alert("Error", "The data could not be sent.");
        }
    };
    const disconnectFromDevice = async () => {
        if (connectedDevice) {
            try {
                const isConnected = await manager.isDeviceConnected(
                    connectedDevice.id
                );
                if (isConnected) {
                    console.log("Rozłączanie z urządzeniem...");
                    await manager.cancelDeviceConnection(connectedDevice.id);
                    console.log("Rozłączono");
                } else {
                    console.log(
                        "Urządzenie rozłączyło się samo w tle (np. utrata zasięgu)."
                    );
                    Alert.alert(
                        "Informacja",
                        "Urządzenie było już rozłączone."
                    );
                }
                setConnectedDevice(null);
                setUpdateRate(0); // Zerujemy wynik na ekranie

                // clean
                setConnectedDevice(null);
                Alert.alert("Rozłączono", "Pomyślnie rozłączono z RopeSync.");
            } catch (error) {
                console.error("Błąd podczas rozłączania:", error);
                Alert.alert("Błąd", "Wystąpił problem przy rozłączaniu.");
                setConnectedDevice(null);
                setUpdateRate(0);
            }
        }
    };

    // To jest to, co nasz Hook "oddaje" do interfejsu
    return {
        scanForPeripherals,
        sendData,
        disconnectFromDevice,
        sensorData,
        isScanning,
        updateRate,
        connectedDevice,
    };
};

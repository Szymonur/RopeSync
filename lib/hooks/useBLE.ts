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
    pressure: number;
    altitude: number;
}

export const useBLE = () => {
    const [manager] = useState(() => new BleManager());
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [sensorData, setSensorData] = useState<SensorData>({
        force: 0, qX: 0, qY: 0, qZ: 0, qW: 0, pressure: 0, altitude: 0,
    });
    
    const packetCountRef = useRef(0);
    const [updateRate, setUpdateRate] = useState(0);
    const baselinePressureRef = useRef<number | null>(null);

    // --- ZMIENNE SYNCHRONIZACJI ---
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0); 
    const syncTotalRef = useRef(0);
    const syncCountRef = useRef(0);
    const syncedDataRef = useRef<SensorData[]>([]);

    useEffect(() => {
        let interval: any;
        if (connectedDevice) {
            interval = setInterval(() => {
                setUpdateRate(packetCountRef.current);
                packetCountRef.current = 0;
            }, 1000);
        }
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
                    if (error.errorCode !== 2) disconnectFromDevice();
                    return;
                }

                if (characteristic?.value) {
                    const buffer = base64ToArrayBuffer(characteristic.value);
                    const bytes = new Uint8Array(buffer);
                    
                    // Próba odczytania wiadomości tekstowych (komendy)
                    // (Ograniczamy odczytywanie tekstu tylko do krótkich wiadomości z komendą)
                    if (bytes.length < 24) {
                        const textValue = String.fromCharCode.apply(null, Array.from(bytes));
                        
                        if (textValue.startsWith("META:")) {
                            const total = parseInt(textValue.split(":")[1]);
                            syncTotalRef.current = total;
                            syncCountRef.current = 0;
                            syncedDataRef.current = [];
                            setIsSyncing(true);
                            setSyncProgress(0);
                            return;
                        }

                        if (textValue.startsWith("END")) {
                            setIsSyncing(false);
                            Alert.alert("Zakończono", `Pomyślnie zsynchronizowano ${syncedDataRef.current.length} rekordów!`);
                            // Pobrane dane historyczne masz teraz w: syncedDataRef.current
                            return;
                        }
                    }

                    // Jeśli wielkość bufora jest wielokrotnością 24 bajtów, przetwarzamy struktury float32
                    if (bytes.length > 0 && bytes.length % 24 === 0) {
                        const recordsInPacket = bytes.length / 24;
                        const dataView = new DataView(buffer);

                        for (let i = 0; i < recordsInPacket; i++) {
                            const offset = i * 24;

                            const force = dataView.getFloat32(offset + 0, true);
                            const qX = dataView.getFloat32(offset + 4, true);
                            const qY = dataView.getFloat32(offset + 8, true);
                            const qZ = dataView.getFloat32(offset + 12, true);
                            const qW = dataView.getFloat32(offset + 16, true);
                            const pressure = dataView.getFloat32(offset + 20, true);

                            // Logika wysokości
                            let altitude = 0;
                            if (pressure > 0) {
                                if (baselinePressureRef.current === null) {
                                    baselinePressureRef.current = pressure;
                                }
                                const p0 = baselinePressureRef.current;
                                altitude = 44330 * (1 - Math.pow(pressure / p0, 1 / 5.255));
                            }

                            const currentRecord: SensorData = { force, qX, qY, qZ, qW, pressure, altitude };

                            // Jeśli trwa synchronizacja -> zbieraj do tablicy
                            if (syncTotalRef.current > 0 && syncCountRef.current < syncTotalRef.current) {
                                syncedDataRef.current.push(currentRecord);
                                syncCountRef.current += 1;
                            } else {
                                // Tryb na żywo -> aktualizuj stan UI
                                packetCountRef.current += 1;
                                setSensorData(currentRecord);
                            }
                        }

                        // Aktualizacja paska postępu w UI (dla optymalizacji co 50 rekordów)
                        if (syncTotalRef.current > 0 && syncCountRef.current <= syncTotalRef.current) {
                            if (syncCountRef.current % 50 === 0 || syncCountRef.current >= syncTotalRef.current) {
                                const percent = Math.round((syncCountRef.current / syncTotalRef.current) * 100);
                                setSyncProgress(percent);
                            }
                        }
                    }
                }
            },
        );
    };

    const connectToDevice = async (device: Device) => {
        try {
            console.log("Łączenie z urządzeniem...");
            const connected = await device.connect();

            // Zwiększamy MTU, aby pozwolić na batching paczek (512 to bezpieczne maksimum)
            console.log("Negocjowanie MTU...");
            await manager.requestMTUForDevice(device.id, 512);

            const discovered = await connected.discoverAllServicesAndCharacteristics();
            setConnectedDevice(discovered);

            packetCountRef.current = 0;
            setUpdateRate(0);
            baselinePressureRef.current = null;

            startStreamingData(discovered);
            console.log("Połączono pomyślnie");
        } catch (e) {
            console.error("Błąd łączenia:", e);
            Alert.alert("Błąd", "Nie udało się połączyć z urządzeniem.");
        }
    };

    const resetAltitude = () => {
        baselinePressureRef.current = null;
    };

    const scanForPeripherals = async () => {
        const hasPermissions = await requestAndroid31Permissions();
        if (!hasPermissions) {
            Alert.alert("Błąd", "Brak uprawnień Bluetooth");
            return;
        }

        const btState = await manager.state();
        if (btState !== "PoweredOn") {
            Alert.alert("Błąd", "Włącz Bluetooth w telefonie!");
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
                base64Data,
            );
        } catch (error) {
            console.error("Błąd wysyłania komendy:", error);
            Alert.alert("Błąd", "Nie udało się wysłać polecenia do ESP.");
        }
    };

    // Funkcja wyzwalająca tryb synchronizacji
    const triggerSync = async () => {
        if (!connectedDevice) return;
        try {
            await sendData("SYNC");
        } catch (e) {
            console.error(e);
        }
    };

    const disconnectFromDevice = async () => {
        if (connectedDevice) {
            try {
                const isConnected = await manager.isDeviceConnected(connectedDevice.id);
                if (isConnected) {
                    await manager.cancelDeviceConnection(connectedDevice.id);
                } else {
                    Alert.alert("Informacja", "Urządzenie było już rozłączone.");
                }
                setConnectedDevice(null);
                setUpdateRate(0);
                Alert.alert("Rozłączono", "Pomyślnie rozłączono z RopeSync.");
            } catch (error) {
                console.error("Błąd podczas rozłączania:", error);
                setConnectedDevice(null);
                setUpdateRate(0);
            }
        }
    };

    return {
        scanForPeripherals,
        sendData,
        disconnectFromDevice,
        resetAltitude,
        sensorData,
        isScanning,
        updateRate,
        connectedDevice,
        triggerSync,
        isSyncing,
        syncProgress,
        syncedData: syncedDataRef.current
    };
};
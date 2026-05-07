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
        force: 0,
        qX: 0,
        qY: 0,
        qZ: 0,
        qW: 0,
        pressure: 0,
        altitude: 0,
    });
    const packetCountRef = useRef(0);
    const [updateRate, setUpdateRate] = useState(0);

    const baselinePressureRef = useRef<number | null>(null);

    useEffect(() => {
        let interval: any;

        // Uruchamiamy timer tylko, gdy jesteśmy połączeni
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
                    if (error.errorCode !== 2)
                        console.error("Błąd monitorowania:", error);
                    return;
                }

                if (characteristic?.value) {
                    packetCountRef.current += 1;

                    // Base64 transfrom
                    const buffer = base64ToArrayBuffer(characteristic.value);
                    const dataView = new DataView(buffer);

                    const force = dataView.getFloat32(0, true);
                    const qX = dataView.getFloat32(4, true);
                    const qY = dataView.getFloat32(8, true);
                    const qZ = dataView.getFloat32(12, true);
                    const qW = dataView.getFloat32(16, true);

                    // Czytamy 6-tą zmienną (bajt 20) z naszej struktury
                    const pressure = dataView.getFloat32(20, true);

                    // LOGIKA BAROMETRII RÓŻNICOWEJ
                    let altitude = 0;
                    if (pressure > 0) {
                        // Zapisujemy pierwsze ciśnienie jako naszą "podłogę"
                        if (baselinePressureRef.current === null) {
                            baselinePressureRef.current = pressure;
                        }

                        // Międzynarodowy Wzór Barometryczny (zwraca metry względem ciśnienia bazowego)
                        // h = 44330 * (1 - (P / P0)^(1/5.255))
                        const p0 = baselinePressureRef.current;
                        altitude =
                            44330 * (1 - Math.pow(pressure / p0, 1 / 5.255));
                    }

                    setSensorData({
                        force,
                        qX,
                        qY,
                        qZ,
                        qW,
                        pressure,
                        altitude,
                    });
                }
            },
        );
    };

    const connectToDevice = async (device: Device) => {
        try {
            console.log("start");

            const connected = await device.connect();

            console.log("Negocjowanie MTU...");
            await manager.requestMTUForDevice(device.id, 128);

            const discovered =
                await connected.discoverAllServicesAndCharacteristics();
            setConnectedDevice(discovered);

            packetCountRef.current = 0;
            setUpdateRate(0);

            baselinePressureRef.current = null;

            startStreamingData(discovered);
            console.log("end");
        } catch (e) {
            console.error("Connection error:", e);
            Alert.alert("Error", "Unable to connect.");
        }
    };

    const resetAltitude = () => {
        baselinePressureRef.current = null;
    };

    const scanForPeripherals = async () => {
        console.log("scanForPeripherals");

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
                base64Data,
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
                    connectedDevice.id,
                );
                if (isConnected) {
                    console.log("Rozłączanie z urządzeniem...");
                    await manager.cancelDeviceConnection(connectedDevice.id);
                    console.log("Rozłączono");
                } else {
                    console.log(
                        "Urządzenie rozłączyło się samo w tle (np. utrata zasięgu).",
                    );
                    Alert.alert(
                        "Informacja",
                        "Urządzenie było już rozłączone.",
                    );
                }
                setConnectedDevice(null);
                setUpdateRate(0);

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

    return {
        scanForPeripherals,
        sendData,
        disconnectFromDevice,
        resetAltitude,
        sensorData,
        isScanning,
        updateRate,
        connectedDevice,
    };
};

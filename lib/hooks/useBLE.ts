import { useState, useEffect, useRef, useCallback } from "react";
import { Alert, Platform } from "react-native";
import { BleManager, ConnectionPriority, Device } from "react-native-ble-plx";
import { useSQLiteContext } from "expo-sqlite";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useQueryClient } from "@tanstack/react-query";
import { requestAndroid31Permissions } from "../utils/bluetoothPermissions";
import {
    BLE_TARGET_NAME,
    BLE_SERVICE_UUID,
    BLE_CHARACTERISTIC_UUID,
} from "../../constants/bluetooth";
import { encodeToBase64, base64ToArrayBuffer } from "../utils/base64";
import { DeviceMessage, REQUIRED_MTU, parseNotification } from "../ble/protocol";
import { RecorderStats, getSessionRecorder } from "../recording/SessionRecorder";
import { useAuth } from "../../contexts/AuthContext";
import { RECORDING_SESSIONS_QUERY_KEY } from "./useRecordingSessions";

export interface SensorData {
    seq: number;
    altitude: number;
    pressure: number;
    ax: number;
    ay: number;
    az: number;
    qW: number;
    qX: number;
    qY: number;
    qZ: number;
    force: number;
}

const EMPTY_SENSOR_DATA: SensorData = {
    seq: 0, altitude: 0, pressure: 0, ax: 0, ay: 0, az: 0, qW: 0, qX: 0, qY: 0, qZ: 0, force: 0,
};

// Jeden BleManager na całą aplikację - kolejne instancje hooka nie tworzą nowych managerów
let sharedManager: BleManager | null = null;
const getBleManager = (): BleManager => {
    if (!sharedManager) {
        sharedManager = new BleManager();
    }
    return sharedManager;
};

// Jak często dane "na żywo" trafiają do stanu Reacta (czujnik nadaje znacznie częściej)
const UI_REFRESH_INTERVAL_MS = 100;
const ACK_TIMEOUT_MS = 3000;
const KEEP_AWAKE_TAG = "ropesync-recording";

type MessageWaiter = {
    predicate: (message: DeviceMessage) => boolean;
    resolve: (message: DeviceMessage | null) => void;
    timer: ReturnType<typeof setTimeout>;
};

export const useBLE = () => {
    const manager = getBleManager();
    const db = useSQLiteContext();
    const recorder = getSessionRecorder(db);
    const queryClient = useQueryClient();
    const { currentUserId } = useAuth();

    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [sensorData, setSensorData] = useState<SensorData>(EMPTY_SENSOR_DATA);
    const [updateRate, setUpdateRate] = useState(0);
    const [deviceRateHz, setDeviceRateHz] = useState<number | null>(null);
    const [mtu, setMtu] = useState<number | null>(null);
    const [invalidPackets, setInvalidPackets] = useState(0);

    // --- Synchronizacja (dane z pamięci ESP) ---
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const syncTotalRef = useRef(0);
    const syncReceivedRef = useRef(0);

    // --- Nagrywanie ---
    const [recorderStats, setRecorderStats] = useState<RecorderStats>(recorder.getStats());
    const [isRecordingBusy, setIsRecordingBusy] = useState(false);

    // Ostatni odczyt trzymamy w refie, a do stanu przepisujemy go z ograniczoną częstotliwością
    const latestSensorRef = useRef<SensorData | null>(null);
    const sampleCountRef = useRef(0);
    const invalidPacketsRef = useRef(0);
    const connectedDeviceRef = useRef<Device | null>(null);
    const monitorSubscriptionRef = useRef<{ remove: () => void } | null>(null);
    const disconnectSubscriptionRef = useRef<{ remove: () => void } | null>(null);
    const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const waitersRef = useRef<MessageWaiter[]>([]);
    const pendingLiveStartRef = useRef(false);
    const mtuRef = useRef<number | null>(null);
    const firmwareRef = useRef<string | null>(null);
    const userIdRef = useRef<number | null>(null);

    useEffect(() => {
        userIdRef.current = currentUserId ? Number(currentUserId) : null;
    }, [currentUserId]);

    useEffect(() => recorder.subscribe(setRecorderStats), [recorder]);

    const isRecording = recorderStats.sessionId !== null && recorderStats.mode === "live";

    // Ekran nie gaśnie podczas nagrania i synchronizacji (Android ogranicza aplikacje w tle)
    useEffect(() => {
        if (isRecording || isSyncing) {
            activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
            return () => {
                deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
            };
        }
    }, [isRecording, isSyncing]);

    useEffect(() => {
        if (!connectedDevice) return;
        const uiInterval = setInterval(() => {
            if (latestSensorRef.current) {
                setSensorData(latestSensorRef.current);
                latestSensorRef.current = null;
            }
        }, UI_REFRESH_INTERVAL_MS);
        const rateInterval = setInterval(() => {
            setUpdateRate(sampleCountRef.current);
            sampleCountRef.current = 0;
            setInvalidPackets(invalidPacketsRef.current);
        }, 1000);
        return () => {
            clearInterval(uiInterval);
            clearInterval(rateInterval);
        };
    }, [connectedDevice]);

    const refreshSessions = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: RECORDING_SESSIONS_QUERY_KEY });
    }, [queryClient]);

    // --- Oczekiwanie na odpowiedzi tekstowe z ESP (ACK) ---

    const waitForMessage = (
        predicate: (message: DeviceMessage) => boolean,
        timeoutMs = ACK_TIMEOUT_MS,
    ): Promise<DeviceMessage | null> =>
        new Promise((resolve) => {
            const waiter: MessageWaiter = {
                predicate,
                resolve,
                timer: setTimeout(() => {
                    waitersRef.current = waitersRef.current.filter((w) => w !== waiter);
                    resolve(null);
                }, timeoutMs),
            };
            waitersRef.current.push(waiter);
        });

    const resolveWaiters = (message: DeviceMessage) => {
        const matching = waitersRef.current.filter((w) => w.predicate(message));
        if (matching.length === 0) return;
        waitersRef.current = waitersRef.current.filter((w) => !matching.includes(w));
        for (const waiter of matching) {
            clearTimeout(waiter.timer);
            waiter.resolve(message);
        }
    };

    // --- Obsługa ramek z ESP ---

    const handleMessage = (message: DeviceMessage) => {
        switch (message.type) {
            case "ackStart":
                setDeviceRateHz(message.sampleRateHz);
                firmwareRef.current = message.firmware;
                // Sesję zakładamy TU, synchronicznie: pierwsza ramka nowej sesji przychodzi zaraz po ACK
                if (pendingLiveStartRef.current && !recorder.isRecording) {
                    pendingLiveStartRef.current = false;
                    recorder
                        .start({
                            mode: "live",
                            userId: userIdRef.current,
                            firmware: message.firmware,
                            sampleRateHz: message.sampleRateHz,
                            mtu: mtuRef.current,
                            sessionTag: message.sessionTag,
                        })
                        .then(refreshSessions)
                        .catch((error) => {
                            console.error("Nie udało się założyć sesji:", error);
                            Alert.alert("Błąd", "Nie udało się rozpocząć zapisu sesji.");
                        });
                }
                break;
            case "ackRate":
                setDeviceRateHz(message.sampleRateHz);
                break;
            case "meta":
                syncTotalRef.current = message.totalRecords;
                syncReceivedRef.current = 0;
                setIsSyncing(true);
                setSyncProgress(0);
                if (!recorder.isRecording) {
                    recorder
                        .start({
                            mode: "sync",
                            userId: userIdRef.current,
                            // Wersję firmware zna tylko ACK:START - przy synchronizacji bez wcześniejszej sesji brak
                            firmware: firmwareRef.current,
                            sampleRateHz: null,
                            mtu: mtuRef.current,
                            sessionTag: null,
                            expectedTotal: message.totalRecords,
                        })
                        .then(refreshSessions)
                        .catch((error) => console.error("Nie udało się założyć sesji synchronizacji:", error));
                }
                break;
            case "end": {
                const total = syncTotalRef.current;
                const received = syncReceivedRef.current;
                setIsSyncing(false);
                setSyncProgress(100);
                if (recorder.activeMode === "sync") {
                    recorder
                        .stop({ deviceSentSamples: total })
                        .then(refreshSessions)
                        .catch((error) => console.error("Błąd zamykania sesji synchronizacji:", error));
                }
                Alert.alert(
                    "Synchronizacja zakończona",
                    `Odebrano ${received} z ${total} rekordów${received < total ? ` (brakuje ${total - received})` : ""}.`,
                );
                break;
            }
        }
        resolveWaiters(message);
    };

    const handleNotification = (base64Value: string, rxMs: number) => {
        const parsed = parseNotification(new Uint8Array(base64ToArrayBuffer(base64Value)));

        if (parsed.kind === "text") {
            handleMessage(parsed.message);
            return;
        }

        if (parsed.kind === "invalid") {
            invalidPacketsRef.current++;
            recorder.reportInvalidPacket();
            if (invalidPacketsRef.current <= 3) {
                console.warn(`Odrzucona ramka BLE: ${parsed.reason}`);
            }
            return;
        }

        const { samples } = parsed;
        if (samples.length === 0) return;

        if (parsed.packetType === "sync") {
            syncReceivedRef.current += samples.length;
            if (recorder.activeMode === "sync") {
                recorder.addSamples(samples, rxMs);
            }
            const total = syncTotalRef.current;
            if (total > 0) {
                const percent = Math.min(100, Math.floor((syncReceivedRef.current / total) * 100));
                setSyncProgress((previous) => (percent !== previous ? percent : previous));
            }
            return;
        }

        sampleCountRef.current += samples.length;
        const last = samples[samples.length - 1];
        latestSensorRef.current = {
            seq: last.seq,
            altitude: last.altRelM,
            pressure: last.pressureHpa,
            ax: last.ax,
            ay: last.ay,
            az: last.az,
            qW: last.qw,
            qX: last.qx,
            qY: last.qy,
            qZ: last.qz,
            force: last.forceN,
        };

        if (recorder.activeMode === "live" && recorder.acceptsSessionTag(parsed.sessionTag)) {
            recorder.addSamples(samples, rxMs);
        }
    };

    const cleanupConnection = () => {
        monitorSubscriptionRef.current?.remove();
        monitorSubscriptionRef.current = null;
        disconnectSubscriptionRef.current?.remove();
        disconnectSubscriptionRef.current = null;
        latestSensorRef.current = null;
        connectedDeviceRef.current = null;
        pendingLiveStartRef.current = false;
        for (const waiter of waitersRef.current) {
            clearTimeout(waiter.timer);
            waiter.resolve(null);
        }
        waitersRef.current = [];
        setConnectedDevice(null);
        setUpdateRate(0);
        setIsSyncing(false);
        setDeviceRateHz(null);
    };

    // Przerwane połączenie: zamykamy otwartą sesję jako przerwaną (zapisane dane zostają)
    const abortActiveSession = () => {
        if (!recorder.isRecording) return;
        recorder
            .stop({ aborted: true })
            .then(refreshSessions)
            .catch((error) => console.error("Błąd zamykania przerwanej sesji:", error));
    };

    useEffect(() => {
        return () => {
            manager.stopDeviceScan();
            if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
            monitorSubscriptionRef.current?.remove();
            monitorSubscriptionRef.current = null;
            disconnectSubscriptionRef.current?.remove();
            disconnectSubscriptionRef.current = null;
            // Bez ekranu urządzenia nikt nie odbiera próbek - nagranie trzeba zamknąć
            if (recorder.isRecording) {
                recorder.stop({ aborted: true }).catch(() => undefined);
            }
        };
    }, [manager, recorder]);

    const startStreamingData = (device: Device) => {
        monitorSubscriptionRef.current?.remove();
        monitorSubscriptionRef.current = device.monitorCharacteristicForService(
            BLE_SERVICE_UUID,
            BLE_CHARACTERISTIC_UUID,
            (error, characteristic) => {
                if (error) {
                    // errorCode 2 = operacja anulowana (np. przy własnym rozłączeniu)
                    if (error.errorCode !== 2) {
                        console.warn("Błąd odbioru BLE:", error.message);
                    }
                    return;
                }
                if (characteristic?.value) {
                    handleNotification(characteristic.value, Date.now());
                }
            },
        );
    };

    const connectToDevice = async (device: Device) => {
        try {
            const connected = await device.connect();

            // Ramka z 5 próbkami ma 244 B - potrzebne MTU >= 247
            const withMtu = await manager.requestMTUForDevice(connected.id, 512);
            mtuRef.current = withMtu.mtu ?? null;
            setMtu(mtuRef.current);

            if (Platform.OS === "android") {
                // Krótszy interwał połączenia = większa przepustowość (kosztem baterii)
                await manager
                    .requestConnectionPriorityForDevice(connected.id, ConnectionPriority.High)
                    .catch(() => undefined);
            }

            const discovered = await connected.discoverAllServicesAndCharacteristics();
            connectedDeviceRef.current = discovered;
            setConnectedDevice(discovered);

            sampleCountRef.current = 0;
            invalidPacketsRef.current = 0;
            setInvalidPackets(0);
            setUpdateRate(0);

            disconnectSubscriptionRef.current?.remove();
            disconnectSubscriptionRef.current = manager.onDeviceDisconnected(discovered.id, () => {
                const wasRecording = recorder.isRecording;
                abortActiveSession();
                cleanupConnection();
                if (wasRecording) {
                    Alert.alert(
                        "Połączenie przerwane",
                        "Sesja została zamknięta jako przerwana. Zapisane próbki są dostępne na liście sesji.",
                    );
                }
            });

            startStreamingData(discovered);

            if (mtuRef.current !== null && mtuRef.current < REQUIRED_MTU) {
                Alert.alert(
                    "Za małe MTU",
                    `Wynegocjowano MTU ${mtuRef.current}, a ramki wymagają co najmniej ${REQUIRED_MTU}. Dane będą odrzucane.`,
                );
            }
        } catch (e) {
            console.error("Błąd łączenia:", e);
            Alert.alert("Błąd", "Nie udało się połączyć z urządzeniem.");
        }
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
                if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                setIsScanning(false);
                connectToDevice(device);
            }
        });

        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => {
            manager.stopDeviceScan();
            setIsScanning(false);
        }, 10000);
    };

    const sendData = async (text: string): Promise<boolean> => {
        const device = connectedDeviceRef.current;
        if (!device) return false;
        try {
            await device.writeCharacteristicWithResponseForService(
                BLE_SERVICE_UUID,
                BLE_CHARACTERISTIC_UUID,
                encodeToBase64(text),
            );
            return true;
        } catch (error) {
            console.error("Błąd wysyłania komendy:", error);
            Alert.alert("Błąd", "Nie udało się wysłać polecenia do ESP.");
            return false;
        }
    };

    // --- Nagrywanie sesji na żywo ---

    const startRecording = async () => {
        if (!connectedDeviceRef.current || recorder.isRecording || isSyncing) return;
        setIsRecordingBusy(true);
        try {
            pendingLiveStartRef.current = true;
            const ackPromise = waitForMessage((m) => m.type === "ackStart");
            if (!(await sendData("START"))) {
                pendingLiveStartRef.current = false;
                return;
            }
            const ack = await ackPromise;
            if (!ack) {
                pendingLiveStartRef.current = false;
                Alert.alert(
                    "Brak odpowiedzi",
                    "ESP nie potwierdziło rozpoczęcia sesji. Sprawdź, czy wgrany jest firmware z protokołem v1.",
                );
            }
        } finally {
            setIsRecordingBusy(false);
        }
    };

    const stopRecording = async () => {
        if (recorder.activeMode !== "live") return;
        setIsRecordingBusy(true);
        try {
            const ackPromise = waitForMessage((m) => m.type === "ackStop");
            const sent = await sendData("STOP");
            const ack = sent ? await ackPromise : null;
            await recorder.stop(
                ack && ack.type === "ackStop"
                    ? { deviceSentSamples: ack.sentSamples, deviceOverruns: ack.overruns }
                    : {},
            );
            refreshSessions();
        } catch (error) {
            console.error("Błąd zatrzymywania nagrania:", error);
            Alert.alert("Błąd", "Nie udało się poprawnie zakończyć sesji.");
        } finally {
            setIsRecordingBusy(false);
        }
    };

    // Częstotliwość próbkowania ESP (test przepustowości). Tylko poza nagraniem.
    const setSampleRate = async (hz: number) => {
        if (recorder.isRecording) return;
        const ackPromise = waitForMessage((m) => m.type === "ackRate");
        if (await sendData(`RATE:${hz}`)) {
            await ackPromise;
        }
    };

    const resetAltitude = () => {
        sendData("TARE");
    };

    // Wysyłka danych zapisanych w pamięci ESP (tryb SYNC)
    const triggerSync = async () => {
        if (!connectedDeviceRef.current) return;
        if (recorder.isRecording) {
            Alert.alert("Trwa nagrywanie", "Zakończ nagrywanie sesji przed synchronizacją.");
            return;
        }
        await sendData("SYNC");
    };

    const disconnectFromDevice = async () => {
        const device = connectedDeviceRef.current;
        if (!device) return;

        if (recorder.activeMode === "live") {
            await stopRecording();
        }

        // Własne rozłączenie - bez komunikatu o przerwanym połączeniu
        disconnectSubscriptionRef.current?.remove();
        disconnectSubscriptionRef.current = null;
        abortActiveSession();

        try {
            const isConnected = await manager.isDeviceConnected(device.id);
            if (isConnected) {
                await manager.cancelDeviceConnection(device.id);
            }
        } catch (error) {
            console.error("Błąd podczas rozłączania:", error);
        } finally {
            cleanupConnection();
        }
    };

    // --- Zdarzenia oznaczane ręcznie (trafiają do nagrywanej sesji) ---

    const recordPointEvent = (label: string, tMs: number) =>
        recorder.activeMode === "live" ? recorder.addPointEvent(label, tMs) : null;

    const openIntervalEvent = (label: string, tMs: number) =>
        recorder.activeMode === "live" ? recorder.openIntervalEvent(label, tMs) : null;

    const closeIntervalEvent = (eventId: string, tMs: number) => {
        recorder.closeIntervalEvent(eventId, tMs);
    };

    return {
        scanForPeripherals,
        sendData,
        disconnectFromDevice,
        resetAltitude,
        sensorData,
        isScanning,
        updateRate,
        deviceRateHz,
        mtu,
        invalidPackets,
        connectedDevice,
        triggerSync,
        isSyncing,
        syncProgress,
        // Nagrywanie
        isRecording,
        isRecordingBusy,
        recorderStats,
        startRecording,
        stopRecording,
        setSampleRate,
        recordPointEvent,
        openIntervalEvent,
        closeIntervalEvent,
    };
};

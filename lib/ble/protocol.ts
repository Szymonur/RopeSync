// Protokół BLE RopeSync v1 - musi zgadzać się z firmware ESP32 (Server-ble.ino).
//
// Ramka binarna (pierwszy bajt < 0x20):
//   [0] typ (0x01 na żywo, 0x02 synchronizacja), [1] wersja, [2] liczba próbek, [3] znacznik sesji
//   [4..] próbki po 48 B, little-endian:
//   uint32 seq, uint32 t_ms, float alt_rel, pressure, ax, ay, az, qw, qx, qy, qz, force
// Wiadomości tekstowe: ACK:START:<tag>:<Hz>:<fw>, ACK:STOP:<tag>:<wysłane>:<przepełnienia>,
//   ACK:RATE:<Hz>, ACK:TARE, META:<n>, END

export const PROTOCOL_VERSION = 1;
export const PACKET_TYPE_LIVE = 0x01;
export const PACKET_TYPE_SYNC = 0x02;
export const PACKET_HEADER_SIZE = 4;
export const SAMPLE_SIZE = 48;
export const SAMPLES_PER_PACKET = 5;
// Największa ramka to 4 + 5 * 48 = 244 B, więc potrzebne MTU >= 247
export const REQUIRED_MTU = PACKET_HEADER_SIZE + SAMPLES_PER_PACKET * SAMPLE_SIZE + 3;

export interface DeviceSample {
    seq: number;
    tDeviceMs: number;
    altRelM: number;
    pressureHpa: number;
    ax: number;
    ay: number;
    az: number;
    qw: number;
    qx: number;
    qy: number;
    qz: number;
    forceN: number;
}

export type ParsedNotification =
    | {
          kind: "samples";
          packetType: "live" | "sync";
          sessionTag: number;
          samples: DeviceSample[];
      }
    | { kind: "text"; message: DeviceMessage }
    | { kind: "invalid"; reason: string; length: number };

export type DeviceMessage =
    | { type: "ackStart"; sessionTag: number; sampleRateHz: number; firmware: string }
    | { type: "ackStop"; sessionTag: number; sentSamples: number; overruns: number }
    | { type: "ackRate"; sampleRateHz: number }
    | { type: "ackTare" }
    | { type: "meta"; totalRecords: number }
    | { type: "end" }
    | { type: "unknown"; text: string };

const toInt = (value: string | undefined): number => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const parseDeviceMessage = (text: string): DeviceMessage => {
    const parts = text.trim().split(":");
    if (parts[0] === "ACK") {
        switch (parts[1]) {
            case "START":
                return {
                    type: "ackStart",
                    sessionTag: toInt(parts[2]),
                    sampleRateHz: toInt(parts[3]),
                    firmware: parts.slice(4).join(":") || "unknown",
                };
            case "STOP":
                return {
                    type: "ackStop",
                    sessionTag: toInt(parts[2]),
                    sentSamples: toInt(parts[3]),
                    overruns: toInt(parts[4]),
                };
            case "RATE":
                return { type: "ackRate", sampleRateHz: toInt(parts[2]) };
            case "TARE":
                return { type: "ackTare" };
        }
    }
    if (parts[0] === "META") return { type: "meta", totalRecords: toInt(parts[1]) };
    if (parts[0] === "END") return { type: "end" };
    return { type: "unknown", text };
};

export const parseNotification = (bytes: Uint8Array): ParsedNotification => {
    if (bytes.length === 0) {
        return { kind: "invalid", reason: "pusta ramka", length: 0 };
    }

    // Tekst: drukowalne ASCII
    if (bytes[0] >= 0x20) {
        let text = "";
        for (let i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
        return { kind: "text", message: parseDeviceMessage(text) };
    }

    if (bytes.length < PACKET_HEADER_SIZE) {
        return { kind: "invalid", reason: "za krótki nagłówek", length: bytes.length };
    }

    const type = bytes[0];
    const version = bytes[1];
    const count = bytes[2];
    const sessionTag = bytes[3];

    if (type !== PACKET_TYPE_LIVE && type !== PACKET_TYPE_SYNC) {
        return { kind: "invalid", reason: `nieznany typ ramki ${type}`, length: bytes.length };
    }
    if (version !== PROTOCOL_VERSION) {
        return { kind: "invalid", reason: `nieobsługiwana wersja protokołu ${version}`, length: bytes.length };
    }
    if (bytes.length !== PACKET_HEADER_SIZE + count * SAMPLE_SIZE) {
        // Najczęściej: MTU za małe i ramka została obcięta
        return { kind: "invalid", reason: `długość ${bytes.length} nie pasuje do ${count} próbek`, length: bytes.length };
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const samples: DeviceSample[] = new Array(count);
    for (let i = 0; i < count; i++) {
        const o = PACKET_HEADER_SIZE + i * SAMPLE_SIZE;
        samples[i] = {
            seq: view.getUint32(o, true),
            tDeviceMs: view.getUint32(o + 4, true),
            altRelM: view.getFloat32(o + 8, true),
            pressureHpa: view.getFloat32(o + 12, true),
            ax: view.getFloat32(o + 16, true),
            ay: view.getFloat32(o + 20, true),
            az: view.getFloat32(o + 24, true),
            qw: view.getFloat32(o + 28, true),
            qx: view.getFloat32(o + 32, true),
            qy: view.getFloat32(o + 36, true),
            qz: view.getFloat32(o + 40, true),
            forceN: view.getFloat32(o + 44, true),
        };
    }

    return {
        kind: "samples",
        packetType: type === PACKET_TYPE_LIVE ? "live" : "sync",
        sessionTag,
        samples,
    };
};

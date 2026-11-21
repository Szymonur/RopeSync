// Czyste funkcje formatujące eksport sesji (bez zależności od Expo - testowalne w Node)

import type { MeasurementSession, SampleRow, SessionEvent } from "./recordingStore";

export const EXPORT_SCHEMA_VERSION = 1;

// Jedna oś czasu w obu plikach: t_ms = milisekundy od startu sesji (zegar ESP)
export const SAMPLES_CSV_COLUMNS = [
    "seq",
    "t_ms",
    "alt_rel_m",
    "ax_ms2",
    "ay_ms2",
    "az_ms2",
    "qw",
    "qx",
    "qy",
    "qz",
    "force_n",
] as const;

export const EVENTS_CSV_COLUMNS = ["label", "t_start_ms", "t_end_ms"] as const;

// float32 ma ok. 7 cyfr znaczących - więcej to tylko szum z konwersji na double
export const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || !Number.isFinite(value)) return "";
    if (Number.isInteger(value)) return String(value);
    return String(Number(value.toPrecision(7)));
};

export const csvField = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const text = typeof value === "number" ? formatNumber(value) : value;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const samplesCsvHeader = (): string => SAMPLES_CSV_COLUMNS.join(",") + "\n";

export const samplesToCsv = (rows: SampleRow[]): string => {
    let out = "";
    for (const r of rows) {
        out +=
            r.seq +
            "," +
            r.t_device_ms +
            "," +
            formatNumber(r.alt_rel_m) +
            "," +
            formatNumber(r.ax) +
            "," +
            formatNumber(r.ay) +
            "," +
            formatNumber(r.az) +
            "," +
            formatNumber(r.qw) +
            "," +
            formatNumber(r.qx) +
            "," +
            formatNumber(r.qy) +
            "," +
            formatNumber(r.qz) +
            "," +
            formatNumber(r.force_n) +
            "\n";
    }
    return out;
};

// Zdarzenia mają czas telefonu - przeliczamy go na oś próbek: t = t_telefonu - offsetMs.
// Zdarzenie punktowe: t_end_ms = t_start_ms. Pusty t_end_ms = przedział, którego nie dało się domknąć.
export const eventsToCsv = (events: SessionEvent[], offsetMs: number): string => {
    const toAxis = (phoneMs: number) => Math.round(phoneMs - offsetMs);
    const sorted = [...events].sort((a, b) => a.t_start_ms - b.t_start_ms);
    let out = EVENTS_CSV_COLUMNS.join(",") + "\n";
    for (const e of sorted) {
        const start = toAxis(e.t_start_ms);
        const end = e.rodzaj === "point" ? start : e.t_end_ms === null ? null : toAxis(e.t_end_ms);
        out += [csvField(e.etykieta), String(start), end === null ? "" : String(end)].join(",") + "\n";
    }
    return out;
};

export interface ClockInfo {
    alignment: "min_receive_delay" | "session_start";
    offsetMs: number;
}

// Wyrównanie zegara ESP do zegara telefonu.
// Na żywo: najmniejsze opóźnienie odbioru (t_rx - t_device) = ramka, która doszła najszybciej.
// Synchronizacja (dane z pamięci ESP): brak wspólnego zegara - liczymy od startu sesji w telefonie.
export const resolveClock = (
    session: Pick<MeasurementSession, "tryb" | "rozpoczeto_ms">,
    minRxDelayMs: number | null,
): ClockInfo => {
    if (session.tryb === "live" && minRxDelayMs !== null) {
        return { alignment: "min_receive_delay", offsetMs: minRxDelayMs };
    }
    return { alignment: "session_start", offsetMs: session.rozpoczeto_ms };
};

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

export const exportFolderName = (session: Pick<MeasurementSession, "id_sesji" | "rozpoczeto_ms">): string => {
    const d = new Date(session.rozpoczeto_ms);
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(
        d.getMinutes(),
    )}${pad(d.getSeconds())}`;
    return `ropesync_${stamp}_${session.id_sesji.slice(0, 8)}`;
};

export const buildMeta = (input: {
    session: MeasurementSession;
    clock: ClockInfo;
    samples: { count: number; firstSeq: number | null; lastSeq: number | null };
    events: SessionEvent[];
    appVersion: string | null;
    exportedAtMs: number;
}) => {
    const { session, clock, samples, events } = input;
    const expectedFromSeq =
        samples.firstSeq !== null && samples.lastSeq !== null ? samples.lastSeq - samples.firstSeq + 1 : 0;
    return {
        schema_version: EXPORT_SCHEMA_VERSION,
        session_id: session.id_sesji,
        mode: session.tryb,
        source: session.zrodlo,
        status: session.status,
        started_at: new Date(session.rozpoczeto_ms).toISOString(),
        ended_at: session.zakonczono_ms ? new Date(session.zakonczono_ms).toISOString() : null,
        user_id: session.id_uzytkownika,
        time_axis:
            "t_ms w samples.csv oraz t_start_ms / t_end_ms w events.csv to milisekundy od startu sesji (zegar ESP).",
        device: {
            firmware: session.firmware,
            protocol_version: 1,
            sample_rate_hz: session.czestotliwosc_hz,
            mtu: session.mtu,
            reported_sent_samples: session.wyslane_przez_urzadzenie,
            reported_overruns: session.przepelnienia_urzadzenia,
        },
        clock: {
            alignment: clock.alignment,
            // czas telefonu (ms epoki Unix) = t_ms + phone_offset_ms
            phone_offset_ms: clock.offsetMs,
            description:
                clock.alignment === "min_receive_delay"
                    ? "Zdarzenia przeliczone z czasu telefonu na oś ESP przez najmniejsze opóźnienie odbioru ramki BLE."
                    : "Dane z pamięci urządzenia (SYNC): brak wspólnego zegara z telefonem.",
        },
        samples: {
            file: "samples.csv",
            count: samples.count,
            first_seq: samples.firstSeq,
            last_seq: samples.lastSeq,
            missing_in_range: Math.max(0, expectedFromSeq - samples.count),
            dropped_total: session.utracone_probki,
            duplicates: session.zduplikowane_probki,
            invalid_packets: session.bledne_ramki,
        },
        events: {
            file: "events.csv",
            count: events.length,
            labels: Array.from(new Set(events.map((e) => e.etykieta))).sort(),
            unclosed_intervals: events.filter((e) => e.rodzaj === "interval" && e.t_end_ms === null).length,
        },
        units: {
            t_ms: "ms od startu sesji",
            alt_rel_m: "m względem startu sesji / TARE",
            ax_ms2: "m/s^2, układ czujnika, z grawitacją",
            ay_ms2: "m/s^2, układ czujnika, z grawitacją",
            az_ms2: "m/s^2, układ czujnika, z grawitacją",
            quaternion: "jednostkowy, kolejność w,x,y,z",
            force_n: "N",
        },
        note: session.notatka,
        app_version: input.appVersion,
        exported_at: new Date(input.exportedAtMs).toISOString(),
    };
};

// UTF-8 bez zależności od TextEncoder (na wypadek silnika JS bez niego)
export const utf8Encode = (text: string): Uint8Array => {
    if (typeof TextEncoder !== "undefined") {
        return new TextEncoder().encode(text);
    }
    const bytes: number[] = [];
    for (let i = 0; i < text.length; i++) {
        let code = text.charCodeAt(i);
        if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
            const low = text.charCodeAt(i + 1);
            if (low >= 0xdc00 && low <= 0xdfff) {
                code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
                i++;
            }
        }
        if (code < 0x80) bytes.push(code);
        else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
        else if (code < 0x10000)
            bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
        else
            bytes.push(
                0xf0 | (code >> 18),
                0x80 | ((code >> 12) & 63),
                0x80 | ((code >> 6) & 63),
                0x80 | (code & 63),
            );
    }
    return Uint8Array.from(bytes);
};

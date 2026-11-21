import type { SQLiteDatabase } from "expo-sqlite";
import { randomUUID } from "expo-crypto";
import type { DeviceSample } from "../ble/protocol";
import {
    BufferedSample,
    SessionCounters,
    SessionMode,
    SessionSource,
    closeEvent,
    closeOpenIntervals,
    createSession,
    finishSession,
    insertEvent,
    insertSamples,
    markInterruptedSessions,
    updateSessionCounters,
} from "./recordingStore";

// Zapis sesji pomiarowej: próbki z BLE trafiają do bufora w pamięci, a co FLUSH_INTERVAL_MS
// do SQLite jednym zapytaniem. Po awarii aplikacji tracimy najwyżej ostatnie pół sekundy.
// Wszystkie zapisy do bazy idą przez jedną kolejkę (writeChain), więc zachowują kolejność.

const FLUSH_INTERVAL_MS = 500;
// Bezpiecznik: przy długotrwałych błędach zapisu nie zjadamy całej pamięci
const MAX_BUFFERED_SAMPLES = 100_000;

export interface RecorderStats {
    sessionId: string | null;
    mode: SessionMode | null;
    startedAtMs: number | null;
    sampleRateHz: number | null;
    // Odebrane z BLE (także duplikaty)
    receivedSamples: number;
    // Zapisane w SQLite
    storedSamples: number;
    // Luki w numeracji seq (zgubione w BLE) + niedobór względem licznika z ESP przy STOP
    droppedSamples: number;
    duplicateSamples: number;
    invalidPackets: number;
    // Próbki utracone przez błędy zapisu do bazy
    lostOnWrite: number;
    pendingSamples: number;
    expectedTotal: number | null;
    lastWriteError: string | null;
}

export interface StartOptions {
    mode: SessionMode;
    userId: number | null;
    firmware: string | null;
    sampleRateHz: number | null;
    mtu: number | null;
    sessionTag: number | null;
    expectedTotal?: number | null;
}

interface ActiveSession {
    id: string;
    mode: SessionMode;
    startedAtMs: number;
    sampleRateHz: number | null;
    sessionTag: number | null;
    expectedTotal: number | null;
    expectedSeq: number;
    received: number;
    stored: number;
    dropped: number;
    duplicates: number;
    invalidPackets: number;
    lostOnWrite: number;
    lastWriteError: string | null;
}

type Listener = (stats: RecorderStats) => void;

const EMPTY_STATS: RecorderStats = {
    sessionId: null,
    mode: null,
    startedAtMs: null,
    sampleRateHz: null,
    receivedSamples: 0,
    storedSamples: 0,
    droppedSamples: 0,
    duplicateSamples: 0,
    invalidPackets: 0,
    lostOnWrite: 0,
    pendingSamples: 0,
    expectedTotal: null,
    lastWriteError: null,
};

// Firmware symulatora przedstawia się wersją "sim-..."; prawdziwe czujniki - każdą inną
export const sourceFromFirmware = (firmware: string | null): SessionSource =>
    !firmware || firmware.startsWith("sim") ? "synthetic" : "sensor";

export class SessionRecorder {
    private readonly db: SQLiteDatabase;
    private active: ActiveSession | null = null;
    private buffer: BufferedSample[] = [];
    private flushTimer: ReturnType<typeof setInterval> | null = null;
    private writeChain: Promise<void> = Promise.resolve();
    private listeners = new Set<Listener>();
    private lastStats: RecorderStats = EMPTY_STATS;

    constructor(db: SQLiteDatabase) {
        this.db = db;
        // Sesje przerwane przy poprzednim uruchomieniu aplikacji
        this.enqueue(() => markInterruptedSessions(this.db));
    }

    get isRecording(): boolean {
        return this.active !== null;
    }

    get activeSessionId(): string | null {
        return this.active?.id ?? null;
    }

    get activeMode(): SessionMode | null {
        return this.active?.mode ?? null;
    }

    // Czy ramka o danym znaczniku sesji z ESP należy do bieżącego nagrania
    acceptsSessionTag(tag: number): boolean {
        return this.active !== null && (this.active.sessionTag === null || this.active.sessionTag === tag);
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        listener(this.lastStats);
        return () => {
            this.listeners.delete(listener);
        };
    }

    getStats(): RecorderStats {
        return this.lastStats;
    }

    async start(options: StartOptions): Promise<string> {
        if (this.active) {
            throw new Error("Nagrywanie już trwa.");
        }
        const session: ActiveSession = {
            id: randomUUID(),
            mode: options.mode,
            startedAtMs: Date.now(),
            sampleRateHz: options.sampleRateHz,
            sessionTag: options.sessionTag,
            expectedTotal: options.expectedTotal ?? null,
            expectedSeq: 0,
            received: 0,
            stored: 0,
            dropped: 0,
            duplicates: 0,
            invalidPackets: 0,
            lostOnWrite: 0,
            lastWriteError: null,
        };

        // Sesja jest aktywna od razu - próbki przychodzące w trakcie INSERT-u sesji trafią do bufora
        this.active = session;
        this.buffer = [];
        try {
            await this.enqueue(() =>
                createSession(this.db, {
                    id: session.id,
                    userId: options.userId,
                    mode: options.mode,
                    source: sourceFromFirmware(options.firmware),
                    startedAtMs: session.startedAtMs,
                    firmware: options.firmware,
                    sampleRateHz: options.sampleRateHz,
                    mtu: options.mtu,
                }),
            );
        } catch (error) {
            this.active = null;
            this.buffer = [];
            this.emit(EMPTY_STATS);
            throw error;
        }

        this.flushTimer = setInterval(() => {
            void this.flush();
        }, FLUSH_INTERVAL_MS);
        this.emit();
        return session.id;
    }

    // Wywoływane z callbacku BLE - tylko operacje w pamięci, bez czekania na bazę
    addSamples(samples: DeviceSample[], rxMs: number): void {
        const session = this.active;
        if (!session) return;

        for (const sample of samples) {
            session.received++;
            if (sample.seq === session.expectedSeq) {
                session.expectedSeq++;
            } else if (sample.seq > session.expectedSeq) {
                session.dropped += sample.seq - session.expectedSeq;
                session.expectedSeq = sample.seq + 1;
            } else {
                // Starszy numer: duplikat (INSERT OR IGNORE go pominie) albo przestawiona ramka
                session.duplicates++;
            }
            this.buffer.push({ sample, rxMs });
        }

        if (this.buffer.length > MAX_BUFFERED_SAMPLES) {
            const overflow = this.buffer.length - MAX_BUFFERED_SAMPLES;
            this.buffer.splice(0, overflow);
            session.lostOnWrite += overflow;
        }
    }

    reportInvalidPacket(): void {
        if (this.active) this.active.invalidPackets++;
    }

    flush(): Promise<void> {
        return this.enqueue(() => this.writeBuffer());
    }

    async stop(
        result: { deviceSentSamples?: number | null; deviceOverruns?: number | null; aborted?: boolean } = {},
    ): Promise<string | null> {
        const session = this.active;
        if (!session) return null;

        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        // Ogon sesji: próbki wysłane przez ESP po ostatniej odebranej
        const deviceSent = result.deviceSentSamples ?? null;
        if (deviceSent !== null && deviceSent > session.expectedSeq) {
            session.dropped += deviceSent - session.expectedSeq;
        }

        const endedAtMs = Date.now();
        await this.enqueue(async () => {
            await this.writeBuffer();
            await closeOpenIntervals(this.db, session.id, endedAtMs);
            await finishSession(this.db, session.id, {
                status: result.aborted ? "aborted" : "finished",
                endedAtMs,
                counters: this.countersOf(session),
                deviceSentSamples: deviceSent,
                deviceOverruns: result.deviceOverruns ?? null,
            });
        });

        this.active = null;
        this.buffer = [];
        this.emit(EMPTY_STATS);
        return session.id;
    }

    // --- Zdarzenia (czas telefonu, Date.now()) ---

    addPointEvent(label: string, tMs: number, note: string | null = null): string | null {
        const session = this.active;
        if (!session) return null;
        const id = randomUUID();
        void this.enqueue(() =>
            insertEvent(this.db, {
                id_zdarzenia: id,
                id_sesji: session.id,
                etykieta: label,
                rodzaj: "point",
                t_start_ms: tMs,
                t_end_ms: null,
                zrodlo: "manual",
                notatka: note,
            }),
        );
        return id;
    }

    // Zdarzenie przedziałowe zapisujemy od razu z t_end = NULL - przerwane nagranie zostawi ślad
    openIntervalEvent(label: string, tMs: number, note: string | null = null): string | null {
        const session = this.active;
        if (!session) return null;
        const id = randomUUID();
        void this.enqueue(() =>
            insertEvent(this.db, {
                id_zdarzenia: id,
                id_sesji: session.id,
                etykieta: label,
                rodzaj: "interval",
                t_start_ms: tMs,
                t_end_ms: null,
                zrodlo: "manual",
                notatka: note,
            }),
        );
        return id;
    }

    closeIntervalEvent(eventId: string, tMs: number): void {
        void this.enqueue(() => closeEvent(this.db, eventId, tMs));
    }

    // --- wewnętrzne ---

    private async writeBuffer(): Promise<void> {
        const session = this.active;
        if (!session || this.buffer.length === 0) {
            this.emit();
            return;
        }
        const batch = this.buffer;
        this.buffer = [];
        try {
            session.stored += await insertSamples(this.db, session.id, batch);
            session.lastWriteError = null;
            await updateSessionCounters(this.db, session.id, this.countersOf(session));
        } catch (error) {
            // Oddaj próbki do bufora - kolejna próba przy następnym zapisie
            this.buffer = batch.concat(this.buffer);
            session.lastWriteError = error instanceof Error ? error.message : String(error);
            console.error("Błąd zapisu próbek sesji:", error);
        }
        this.emit();
    }

    private countersOf(session: ActiveSession): SessionCounters {
        return {
            storedSamples: session.stored,
            droppedSamples: session.dropped + session.lostOnWrite,
            duplicateSamples: session.duplicates,
            invalidPackets: session.invalidPackets,
        };
    }

    private enqueue(task: () => Promise<void>): Promise<void> {
        const next = this.writeChain.then(task, task);
        // Błąd jednego zadania nie może zablokować kolejki
        this.writeChain = next.catch((error) => {
            console.error("Błąd zapisu sesji pomiarowej:", error);
        });
        return next;
    }

    private emit(stats?: RecorderStats): void {
        const session = this.active;
        this.lastStats =
            stats ??
            (session
                ? {
                      sessionId: session.id,
                      mode: session.mode,
                      startedAtMs: session.startedAtMs,
                      sampleRateHz: session.sampleRateHz,
                      receivedSamples: session.received,
                      storedSamples: session.stored,
                      droppedSamples: session.dropped,
                      duplicateSamples: session.duplicates,
                      invalidPackets: session.invalidPackets,
                      lostOnWrite: session.lostOnWrite,
                      pendingSamples: this.buffer.length,
                      expectedTotal: session.expectedTotal,
                      lastWriteError: session.lastWriteError,
                  }
                : EMPTY_STATS);
        for (const listener of this.listeners) listener(this.lastStats);
    }
}

// Jeden rejestrator na bazę (przetrwa przerenderowania i zmianę zakładek)
let sharedRecorder: { db: SQLiteDatabase; recorder: SessionRecorder } | null = null;

export const getSessionRecorder = (db: SQLiteDatabase): SessionRecorder => {
    if (!sharedRecorder || sharedRecorder.db !== db) {
        sharedRecorder = { db, recorder: new SessionRecorder(db) };
    }
    return sharedRecorder.recorder;
};

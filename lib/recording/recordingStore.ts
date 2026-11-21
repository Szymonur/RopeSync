import type { SQLiteDatabase } from "expo-sqlite";
import type { DeviceSample } from "../ble/protocol";

// Operacje SQLite na sesjach pomiarowych (tabele z migracji 9 w database/db.ts)

export type SessionMode = "live" | "sync";
export type SessionSource = "synthetic" | "sensor";
export type SessionStatus = "recording" | "finished" | "aborted";
export type EventKind = "point" | "interval";

export interface MeasurementSession {
    id_sesji: string;
    id_uzytkownika: number | null;
    tryb: SessionMode;
    zrodlo: SessionSource;
    status: SessionStatus;
    rozpoczeto_ms: number;
    zakonczono_ms: number | null;
    firmware: string | null;
    czestotliwosc_hz: number | null;
    mtu: number | null;
    liczba_probek: number;
    utracone_probki: number;
    zduplikowane_probki: number;
    bledne_ramki: number;
    wyslane_przez_urzadzenie: number | null;
    przepelnienia_urzadzenia: number | null;
    notatka: string | null;
    wyeksportowano_ms: number | null;
}

export interface SessionListItem extends MeasurementSession {
    liczba_zdarzen: number;
}

export interface SessionEvent {
    id_zdarzenia: string;
    id_sesji: string;
    etykieta: string;
    rodzaj: EventKind;
    t_start_ms: number;
    t_end_ms: number | null;
    zrodlo: string;
    notatka: string | null;
}

export interface SampleRow {
    seq: number;
    t_device_ms: number;
    t_rx_ms: number;
    alt_rel_m: number | null;
    pressure_hpa: number | null;
    ax: number | null;
    ay: number | null;
    az: number | null;
    qw: number | null;
    qx: number | null;
    qy: number | null;
    qz: number | null;
    force_n: number | null;
}

export interface SessionCounters {
    storedSamples: number;
    droppedSamples: number;
    duplicateSamples: number;
    invalidPackets: number;
}

export interface BufferedSample {
    sample: DeviceSample;
    rxMs: number;
}

const SAMPLE_COLUMNS =
    "id_sesji, seq, t_device_ms, t_rx_ms, alt_rel_m, pressure_hpa, ax, ay, az, qw, qx, qy, qz, force_n";
const SAMPLE_PLACEHOLDER = "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
// 200 wierszy * 14 kolumn = 2800 parametrów (limit SQLite to 32766)
const INSERT_CHUNK = 200;

export async function createSession(
    db: SQLiteDatabase,
    session: {
        id: string;
        userId: number | null;
        mode: SessionMode;
        source: SessionSource;
        startedAtMs: number;
        firmware: string | null;
        sampleRateHz: number | null;
        mtu: number | null;
    },
): Promise<void> {
    await db.runAsync(
        `INSERT INTO Sesje_pomiarowe
            (id_sesji, id_uzytkownika, tryb, zrodlo, status, rozpoczeto_ms, firmware, czestotliwosc_hz, mtu)
         VALUES (?, ?, ?, ?, 'recording', ?, ?, ?, ?)`,
        [
            session.id,
            session.userId,
            session.mode,
            session.source,
            session.startedAtMs,
            session.firmware,
            session.sampleRateHz,
            session.mtu,
        ],
    );
}

// Zapisuje próbki; zwraca liczbę faktycznie wstawionych (duplikaty seq są pomijane).
// Jedno wielowierszowe INSERT jest atomowe - nie potrzeba osobnej transakcji.
export async function insertSamples(
    db: SQLiteDatabase,
    sessionId: string,
    rows: BufferedSample[],
): Promise<number> {
    let inserted = 0;
    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
        const part = rows.slice(i, i + INSERT_CHUNK);
        const values: (string | number)[] = [];
        for (const { sample: s, rxMs } of part) {
            values.push(
                sessionId,
                s.seq,
                s.tDeviceMs,
                rxMs,
                s.altRelM,
                s.pressureHpa,
                s.ax,
                s.ay,
                s.az,
                s.qw,
                s.qx,
                s.qy,
                s.qz,
                s.forceN,
            );
        }
        const result = await db.runAsync(
            `INSERT OR IGNORE INTO Probki_sesji (${SAMPLE_COLUMNS}) VALUES ${part
                .map(() => SAMPLE_PLACEHOLDER)
                .join(", ")}`,
            values,
        );
        inserted += result.changes;
    }
    return inserted;
}

export async function updateSessionCounters(
    db: SQLiteDatabase,
    sessionId: string,
    counters: SessionCounters,
): Promise<void> {
    await db.runAsync(
        `UPDATE Sesje_pomiarowe
         SET liczba_probek = ?, utracone_probki = ?, zduplikowane_probki = ?, bledne_ramki = ?
         WHERE id_sesji = ?`,
        [
            counters.storedSamples,
            counters.droppedSamples,
            counters.duplicateSamples,
            counters.invalidPackets,
            sessionId,
        ],
    );
}

export async function finishSession(
    db: SQLiteDatabase,
    sessionId: string,
    result: {
        status: Exclude<SessionStatus, "recording">;
        endedAtMs: number;
        counters: SessionCounters;
        deviceSentSamples: number | null;
        deviceOverruns: number | null;
    },
): Promise<void> {
    await db.runAsync(
        `UPDATE Sesje_pomiarowe
         SET status = ?, zakonczono_ms = ?,
             liczba_probek = ?, utracone_probki = ?, zduplikowane_probki = ?, bledne_ramki = ?,
             wyslane_przez_urzadzenie = ?, przepelnienia_urzadzenia = ?
         WHERE id_sesji = ?`,
        [
            result.status,
            result.endedAtMs,
            result.counters.storedSamples,
            result.counters.droppedSamples,
            result.counters.duplicateSamples,
            result.counters.invalidPackets,
            result.deviceSentSamples,
            result.deviceOverruns,
            sessionId,
        ],
    );
}

// Sesje pozostawione w stanie "recording" (np. aplikacja została zamknięta w trakcie nagrania)
export async function markInterruptedSessions(db: SQLiteDatabase): Promise<void> {
    await db.runAsync(
        `UPDATE Sesje_pomiarowe
         SET status = 'aborted',
             zakonczono_ms = COALESCE(zakonczono_ms,
                (SELECT MAX(t_rx_ms) FROM Probki_sesji p WHERE p.id_sesji = Sesje_pomiarowe.id_sesji),
                rozpoczeto_ms),
             liczba_probek = (SELECT COUNT(*) FROM Probki_sesji p WHERE p.id_sesji = Sesje_pomiarowe.id_sesji)
         WHERE status = 'recording'`,
    );
    // Przedziały otwarte w przerwanych sesjach kończą się wraz z sesją
    await db.runAsync(
        `UPDATE Zdarzenia_sesji
         SET t_end_ms = MAX(t_start_ms,
             (SELECT s.zakonczono_ms FROM Sesje_pomiarowe s WHERE s.id_sesji = Zdarzenia_sesji.id_sesji))
         WHERE rodzaj = 'interval' AND t_end_ms IS NULL
           AND id_sesji IN (SELECT id_sesji FROM Sesje_pomiarowe WHERE status != 'recording')`,
    );
}

export async function insertEvent(db: SQLiteDatabase, event: SessionEvent): Promise<void> {
    await db.runAsync(
        `INSERT INTO Zdarzenia_sesji
            (id_zdarzenia, id_sesji, etykieta, rodzaj, t_start_ms, t_end_ms, zrodlo, notatka)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            event.id_zdarzenia,
            event.id_sesji,
            event.etykieta,
            event.rodzaj,
            event.t_start_ms,
            event.t_end_ms,
            event.zrodlo,
            event.notatka,
        ],
    );
}

export async function closeEvent(db: SQLiteDatabase, eventId: string, endMs: number): Promise<void> {
    await db.runAsync(
        "UPDATE Zdarzenia_sesji SET t_end_ms = ? WHERE id_zdarzenia = ? AND t_end_ms IS NULL",
        [endMs, eventId],
    );
}

// Domyka przedziały (np. trwający "rest") w chwili zakończenia sesji
export async function closeOpenIntervals(db: SQLiteDatabase, sessionId: string, endMs: number): Promise<void> {
    await db.runAsync(
        `UPDATE Zdarzenia_sesji SET t_end_ms = MAX(?, t_start_ms)
         WHERE id_sesji = ? AND rodzaj = 'interval' AND t_end_ms IS NULL`,
        [endMs, sessionId],
    );
}

export async function listSessions(db: SQLiteDatabase, limit = 50): Promise<SessionListItem[]> {
    return db.getAllAsync<SessionListItem>(
        `SELECT s.*,
            (SELECT COUNT(*) FROM Zdarzenia_sesji z WHERE z.id_sesji = s.id_sesji) AS liczba_zdarzen
         FROM Sesje_pomiarowe s
         ORDER BY s.rozpoczeto_ms DESC
         LIMIT ?`,
        [limit],
    );
}

export async function getSession(db: SQLiteDatabase, sessionId: string): Promise<MeasurementSession | null> {
    return db.getFirstAsync<MeasurementSession>(
        "SELECT * FROM Sesje_pomiarowe WHERE id_sesji = ?",
        [sessionId],
    );
}

export async function getSessionEvents(db: SQLiteDatabase, sessionId: string): Promise<SessionEvent[]> {
    return db.getAllAsync<SessionEvent>(
        "SELECT * FROM Zdarzenia_sesji WHERE id_sesji = ? ORDER BY t_start_ms, id_zdarzenia",
        [sessionId],
    );
}

// Kolejna porcja próbek w kolejności seq (do eksportu bez ładowania całej sesji do pamięci)
export async function getSamplesAfter(
    db: SQLiteDatabase,
    sessionId: string,
    afterSeq: number,
    limit: number,
): Promise<SampleRow[]> {
    return db.getAllAsync<SampleRow>(
        `SELECT seq, t_device_ms, t_rx_ms, alt_rel_m, pressure_hpa, ax, ay, az, qw, qx, qy, qz, force_n
         FROM Probki_sesji
         WHERE id_sesji = ? AND seq > ?
         ORDER BY seq
         LIMIT ?`,
        [sessionId, afterSeq, limit],
    );
}

export async function getSampleStats(
    db: SQLiteDatabase,
    sessionId: string,
): Promise<{
    count: number;
    firstSeq: number | null;
    lastSeq: number | null;
    minRxDelayMs: number | null;
    firstRxMs: number | null;
    lastRxMs: number | null;
}> {
    const row = await db.getFirstAsync<{
        count: number;
        firstSeq: number | null;
        lastSeq: number | null;
        minRxDelayMs: number | null;
        firstRxMs: number | null;
        lastRxMs: number | null;
    }>(
        `SELECT COUNT(*) AS count, MIN(seq) AS firstSeq, MAX(seq) AS lastSeq,
                MIN(t_rx_ms - t_device_ms) AS minRxDelayMs,
                MIN(t_rx_ms) AS firstRxMs, MAX(t_rx_ms) AS lastRxMs
         FROM Probki_sesji WHERE id_sesji = ?`,
        [sessionId],
    );
    return (
        row ?? { count: 0, firstSeq: null, lastSeq: null, minRxDelayMs: null, firstRxMs: null, lastRxMs: null }
    );
}

export async function markExported(db: SQLiteDatabase, sessionId: string, atMs: number): Promise<void> {
    await db.runAsync("UPDATE Sesje_pomiarowe SET wyeksportowano_ms = ? WHERE id_sesji = ?", [
        atMs,
        sessionId,
    ]);
}

export async function deleteSession(db: SQLiteDatabase, sessionId: string): Promise<void> {
    // Klucze obce z ON DELETE CASCADE usuwają próbki i zdarzenia; jawne DELETE na wypadek
    // połączenia z wyłączonymi kluczami obcymi
    await db.withTransactionAsync(async () => {
        await db.runAsync("DELETE FROM Probki_sesji WHERE id_sesji = ?", [sessionId]);
        await db.runAsync("DELETE FROM Zdarzenia_sesji WHERE id_sesji = ?", [sessionId]);
        await db.runAsync("DELETE FROM Sesje_pomiarowe WHERE id_sesji = ?", [sessionId]);
    });
}

import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import Constants from "expo-constants";
import {
    buildMeta,
    eventsToCsv,
    exportFolderName,
    resolveClock,
    samplesCsvHeader,
    samplesToCsv,
    utf8Encode,
} from "./csvFormat";
import {
    getSampleStats,
    getSamplesAfter,
    getSession,
    getSessionEvents,
    markExported,
} from "./recordingStore";

// Eksport sesji pomiarowej do samples.csv, events.csv i meta.json.
// Pliki powstają najpierw w katalogu cache aplikacji, potem są zapisywane w folderze
// wybranym przez użytkownika (Android) albo udostępniane.

const EXPORT_ROOT = "ropesync-export";
const SAMPLES_CHUNK = 5000;
const EXPORT_DIR_STATE_KEY = "recording_export_dir_uri";

export interface ExportedSession {
    sessionId: string;
    folderName: string;
    directory: Directory;
    files: { file: File; mimeType: string }[];
    sampleCount: number;
    eventCount: number;
}

export async function exportSession(db: SQLiteDatabase, sessionId: string): Promise<ExportedSession> {
    const session = await getSession(db, sessionId);
    if (!session) throw new Error("Nie znaleziono sesji.");
    if (session.status === "recording") throw new Error("Zakończ nagrywanie przed eksportem.");

    const [stats, events] = await Promise.all([getSampleStats(db, sessionId), getSessionEvents(db, sessionId)]);
    const clock = resolveClock(session, stats.minRxDelayMs);
    const folderName = exportFolderName(session);

    // Poprzednie eksporty w cache są tylko tymczasowe - sprzątamy je, żeby nie zajmowały miejsca
    const root = new Directory(Paths.cache, EXPORT_ROOT);
    if (root.exists) root.delete();
    root.create({ intermediates: true });
    const directory = new Directory(root, folderName);
    directory.create();

    // samples.csv - porcjami, bez trzymania całej sesji w pamięci
    const samplesFile = new File(directory, "samples.csv");
    samplesFile.create();
    const handle = samplesFile.open();
    let written = 0;
    try {
        handle.writeBytes(utf8Encode(samplesCsvHeader()));
        let afterSeq = -1;
        for (;;) {
            const rows = await getSamplesAfter(db, sessionId, afterSeq, SAMPLES_CHUNK);
            if (rows.length === 0) break;
            handle.writeBytes(utf8Encode(samplesToCsv(rows)));
            written += rows.length;
            afterSeq = rows[rows.length - 1].seq;
        }
    } finally {
        handle.close();
    }

    const eventsFile = new File(directory, "events.csv");
    eventsFile.create();
    eventsFile.write(eventsToCsv(events, clock.offsetMs));

    const exportedAtMs = Date.now();
    const metaFile = new File(directory, "meta.json");
    metaFile.create();
    metaFile.write(
        JSON.stringify(
            buildMeta({
                session,
                clock,
                samples: { count: written, firstSeq: stats.firstSeq, lastSeq: stats.lastSeq },
                events,
                appVersion: Constants.expoConfig?.version ?? null,
                exportedAtMs,
            }),
            null,
            2,
        ),
    );

    await markExported(db, sessionId, exportedAtMs);

    return {
        sessionId,
        folderName,
        directory,
        files: [
            { file: samplesFile, mimeType: "text/csv" },
            { file: eventsFile, mimeType: "text/csv" },
            { file: metaFile, mimeType: "application/json" },
        ],
        sampleCount: written,
        eventCount: events.length,
    };
}

// Android: zapis do folderu wybranego przez użytkownika (np. Pobrane/RopeSync), w podfolderze sesji.
// Zwraca nazwę utworzonego podfolderu albo null, gdy użytkownik anulował wybór.
export async function saveExportToFolder(
    db: SQLiteDatabase,
    exported: ExportedSession,
): Promise<string | null> {
    const saved = await db.getFirstAsync<{ value: string | null }>(
        "SELECT value FROM sync_state WHERE key = ?",
        [EXPORT_DIR_STATE_KEY],
    );

    let parent: Awaited<ReturnType<typeof Directory.pickDirectoryAsync>>;
    try {
        parent = await Directory.pickDirectoryAsync(saved?.value ?? undefined);
    } catch {
        // Anulowanie wyboru folderu
        return null;
    }

    await db.runAsync(
        "INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
        [EXPORT_DIR_STATE_KEY, parent.uri],
    );

    const target = parent.createDirectory(exported.folderName);
    for (const { file, mimeType } of exported.files) {
        const destination = target.createFile(file.name, mimeType);
        destination.write(await file.bytes());
    }
    return exported.folderName;
}

// Udostępnianie plików przez systemowy arkusz (iOS albo gdy nie chcemy wybierać folderu)
export async function shareExport(exported: ExportedSession): Promise<void> {
    if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Udostępnianie plików nie jest dostępne na tym urządzeniu.");
    }
    for (const { file, mimeType } of exported.files) {
        await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: `${exported.folderName}/${file.name}` });
    }
}

export const canSaveToFolder = Platform.OS === "android";

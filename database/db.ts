import { SQLiteDatabase } from "expo-sqlite";
import { DATABASE_SCHEMA, DATABASE_INDEXES } from "./schema";
import { seedMobileDatabase } from '../lib/utils/seedMobile';

const tableExists = async (db: SQLiteDatabase, table: string) =>
    (await db.getFirstAsync<{ ok: number }>(
        "SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ? COLLATE NOCASE",
        [table],
    )) !== null;

const columnExists = async (db: SQLiteDatabase, table: string, column: string) =>
    (await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).some(
        (c) => c.name.toLowerCase() === column.toLowerCase(),
    );

// Migracje krokowe ponad schematem bazowym (wersja 6).
// ZASADY: nigdy nie edytuj już wydanej migracji - dopisz kolejną z wyższym numerem;
// migracje nie mogą usuwać danych użytkownika (Przejscia, Pomiary_wyciagow).
// Nowe kolumny dodawaj TUTAJ, a nie w DATABASE_SCHEMA (to jest zamrożony stan wersji 6).
// isApplied sprawdza faktyczny schemat: migracja wykona się także wtedy, gdy user_version
// jest wyższy niż powinien (np. baza z wcześniejszych wersji deweloperskich).
const MIGRATIONS: {
    version: number;
    isApplied: (db: SQLiteDatabase) => Promise<boolean>;
    up: (db: SQLiteDatabase) => Promise<void>;
}[] = [
    {
        // Status synchronizacji przejścia: liczba prób i ostatni trwały błąd
        version: 7,
        isApplied: async (db) =>
            (await columnExists(db, "Przejscia", "sync_attempts")) &&
            (await columnExists(db, "Przejscia", "sync_error")),
        up: async (db) => {
            if (!(await columnExists(db, "Przejscia", "sync_attempts"))) {
                await db.execAsync("ALTER TABLE Przejscia ADD COLUMN sync_attempts INTEGER NOT NULL DEFAULT 0;");
            }
            if (!(await columnExists(db, "Przejscia", "sync_error"))) {
                await db.execAsync("ALTER TABLE Przejscia ADD COLUMN sync_error TEXT;");
            }
        },
    },
    {
        // Stan synchronizacji (np. kursor ostatnio pobranych zmian per użytkownik)
        version: 8,
        isApplied: (db) => tableExists(db, "sync_state"),
        up: async (db) => {
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS sync_state (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            `);
        },
    },
    {
        // Sesje pomiarowe z urządzenia RopeSync (BLE): surowe próbki i zdarzenia oznaczane ręcznie.
        // Dane do eksportu CSV (np. do uczenia modelu). Nie są synchronizowane z serwerem.
        version: 9,
        isApplied: async (db) =>
            (await tableExists(db, "Sesje_pomiarowe")) &&
            (await tableExists(db, "Probki_sesji")) &&
            (await tableExists(db, "Zdarzenia_sesji")),
        up: async (db) => {
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS Sesje_pomiarowe (
                    id_sesji TEXT PRIMARY KEY,
                    id_uzytkownika INTEGER,
                    tryb TEXT NOT NULL CHECK (tryb IN ('live', 'sync')),
                    zrodlo TEXT NOT NULL DEFAULT 'synthetic' CHECK (zrodlo IN ('synthetic', 'sensor')),
                    status TEXT NOT NULL DEFAULT 'recording' CHECK (status IN ('recording', 'finished', 'aborted')),
                    rozpoczeto_ms INTEGER NOT NULL,
                    zakonczono_ms INTEGER,
                    firmware TEXT,
                    czestotliwosc_hz INTEGER,
                    mtu INTEGER,
                    liczba_probek INTEGER NOT NULL DEFAULT 0,
                    utracone_probki INTEGER NOT NULL DEFAULT 0,
                    zduplikowane_probki INTEGER NOT NULL DEFAULT 0,
                    bledne_ramki INTEGER NOT NULL DEFAULT 0,
                    wyslane_przez_urzadzenie INTEGER,
                    przepelnienia_urzadzenia INTEGER,
                    notatka TEXT,
                    wyeksportowano_ms INTEGER
                );

                CREATE TABLE IF NOT EXISTS Probki_sesji (
                    id_sesji TEXT NOT NULL,
                    seq INTEGER NOT NULL,
                    t_device_ms INTEGER NOT NULL,
                    t_rx_ms INTEGER NOT NULL,
                    alt_rel_m REAL,
                    pressure_hpa REAL,
                    ax REAL,
                    ay REAL,
                    az REAL,
                    qw REAL,
                    qx REAL,
                    qy REAL,
                    qz REAL,
                    force_n REAL,
                    PRIMARY KEY (id_sesji, seq),
                    FOREIGN KEY (id_sesji) REFERENCES Sesje_pomiarowe(id_sesji) ON DELETE CASCADE
                ) WITHOUT ROWID;

                CREATE TABLE IF NOT EXISTS Zdarzenia_sesji (
                    id_zdarzenia TEXT PRIMARY KEY,
                    id_sesji TEXT NOT NULL,
                    etykieta TEXT NOT NULL,
                    rodzaj TEXT NOT NULL CHECK (rodzaj IN ('point', 'interval')),
                    t_start_ms INTEGER NOT NULL,
                    t_end_ms INTEGER,
                    zrodlo TEXT NOT NULL DEFAULT 'manual',
                    notatka TEXT,
                    FOREIGN KEY (id_sesji) REFERENCES Sesje_pomiarowe(id_sesji) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_zdarzenia_sesji ON Zdarzenia_sesji(id_sesji, t_start_ms);
                CREATE INDEX IF NOT EXISTS idx_sesje_pomiarowe_start ON Sesje_pomiarowe(rozpoczeto_ms);
            `);
        },
    },
];

async function runMigrations(db: SQLiteDatabase, fromVersion: number) {
    const latestVersion = MIGRATIONS[MIGRATIONS.length - 1].version;
    let failed = false;

    for (const migration of MIGRATIONS) {
        try {
            if (await migration.isApplied(db)) continue;
            // Każda migracja w osobnej transakcji: albo cała, albo wcale
            await db.withTransactionAsync(async () => {
                await migration.up(db);
            });
            console.log(`Migracja bazy ${migration.version} wykonana (user_version przed: ${fromVersion}).`);
        } catch (error) {
            failed = true;
            // Pozostałe migracje próbujemy dalej - są od siebie niezależne
            console.error(`Błąd migracji bazy ${migration.version}:`, error);
        }
    }

    if (!failed && fromVersion < latestVersion) {
        await db.execAsync(`PRAGMA user_version = ${latestVersion}`);
    }
}

export async function initializeDatabase(db: SQLiteDatabase) {
    // Ustawienia silnika SQLite - obowiązują per połączenie, więc muszą być
    // wykonywane przy KAŻDYM starcie (foreign_keys domyślnie jest wyłączone).
    await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
    `);

    // System migracji
    const result = await db.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version",
    );

    let currentDbVersion = result?.user_version ?? 0;

    if (currentDbVersion < 6) {
        console.log(
            `Inicjalizacja bazy danych: Wymuszam czyszczenie i nowy schemat`,
        );

        try {
            await db.execAsync(`PRAGMA foreign_keys = OFF;`);
            await db.execAsync(`
                DROP TABLE IF EXISTS Pomiary_wyciagow;
                DROP TABLE IF EXISTS Przejscia;
                DROP TABLE IF EXISTS Bouldery_szczegoly;
                DROP TABLE IF EXISTS Trady_szczegoly;
                DROP TABLE IF EXISTS Drogi_sportowe_szczegoly;
                DROP TABLE IF EXISTS Drogi;
                DROP TABLE IF EXISTS Skaly;
                DROP TABLE IF EXISTS Sektory;
                DROP TABLE IF EXISTS Rejony;
                DROP TABLE IF EXISTS Uzytkownicy;
                DROP TABLE IF EXISTS Skale_boulderowe;
                DROP TABLE IF EXISTS Skale_linowe;
                DROP TABLE IF EXISTS Style_przejscia;
                DROP TABLE IF EXISTS Typy_skaly;
                DROP TABLE IF EXISTS Reakcje;
            `);
            await db.execAsync(`PRAGMA foreign_keys = ON;`);
            await db.execAsync(DATABASE_SCHEMA);
			
            await seedMobileDatabase(db);

            currentDbVersion = 6;
            await db.execAsync(`PRAGMA user_version = ${currentDbVersion}`);
        } catch (error) {
            console.error("Błąd podczas inicjalizacji bazy danych:", error);
        }
    }

    // Migracje krokowe (tylko gdy schemat bazowy jest na miejscu)
    if (currentDbVersion >= 6) {
        try {
            await runMigrations(db, currentDbVersion);
        } catch (error) {
            console.error("Błąd podczas migracji bazy danych:", error);
        }
    }

    // Indeksy są idempotentne (IF NOT EXISTS) - nie wymagają podbijania wersji schematu
    try {
        await db.execAsync(DATABASE_INDEXES);
    } catch (error) {
        console.error("Błąd podczas tworzenia indeksów:", error);
    }
}

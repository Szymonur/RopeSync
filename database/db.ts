import { SQLiteDatabase } from "expo-sqlite";
import { DATABASE_SCHEMA, DATABASE_INDEXES } from "./schema";
import { seedMobileDatabase } from '../lib/utils/seedMobile';

// Migracje krokowe ponad schematem bazowym (wersja 6).
// ZASADY: nigdy nie edytuj już wydanej migracji - dopisz kolejną z wyższym numerem;
// migracje nie mogą usuwać danych użytkownika (Przejscia, Pomiary_wyciagow).
// Nowe kolumny dodawaj TUTAJ, a nie w DATABASE_SCHEMA (to jest zamrożony stan wersji 6).
const MIGRATIONS: { version: number; up: (db: SQLiteDatabase) => Promise<void> }[] = [
    {
        // Status synchronizacji przejścia: liczba prób i ostatni trwały błąd
        version: 7,
        up: async (db) => {
            await db.execAsync(`
                ALTER TABLE Przejscia ADD COLUMN sync_attempts INTEGER NOT NULL DEFAULT 0;
                ALTER TABLE Przejscia ADD COLUMN sync_error TEXT;
            `);
        },
    },
];

async function runMigrations(db: SQLiteDatabase, fromVersion: number) {
    let version = fromVersion;
    for (const migration of MIGRATIONS) {
        if (migration.version <= version) continue;
        // Migracja i podbicie wersji w jednej transakcji: albo wszystko, albo nic
        await db.withTransactionAsync(async () => {
            await migration.up(db);
            await db.execAsync(`PRAGMA user_version = ${migration.version}`);
        });
        version = migration.version;
        console.log(`Migracja bazy do wersji ${version} zakończona.`);
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

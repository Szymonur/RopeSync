import { SQLiteDatabase } from "expo-sqlite";
import { DATABASE_SCHEMA, SEED_DATA } from "./schema";

export async function initializeDatabase(db: SQLiteDatabase) {
    // 1. Optymalizacje silnika SQLite
    await db.execAsync(`
        PRAGMA journal_mode = WAL;
    `);

    // 2. System migracji
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
            `);
            await db.execAsync(`PRAGMA foreign_keys = ON;`);
            await db.execAsync(DATABASE_SCHEMA);
            await db.execAsync(SEED_DATA);

            currentDbVersion = 6;
            await db.execAsync(`PRAGMA user_version = ${currentDbVersion}`);
        } catch (error) {
            console.error("Błąd podczas inicjalizacji bazy danych:", error);
        }
    }

    // Migracja z wersji 6 do 7 (Dodanie kolumny synced)
    if (currentDbVersion === 6) {
        console.log("Migracja bazy danych: 6 -> 7 (Dodawanie kolumny synced)");
        try {
            await db.execAsync(`
                ALTER TABLE Przejscia ADD COLUMN synced INTEGER DEFAULT 1;
            `);
            currentDbVersion = 7;
            await db.execAsync(`PRAGMA user_version = ${currentDbVersion}`);
        } catch (error) {
            console.error("Błąd podczas migracji 6 -> 7:", error);
        }
    }

    // Migracja z wersji 7 do 8 (Dodanie kolumny deleted)
    if (currentDbVersion === 7) {
        console.log("Migracja bazy danych: 7 -> 8 (Dodawanie kolumny deleted)");
        try {
            await db.execAsync(`
                ALTER TABLE Przejscia ADD COLUMN deleted INTEGER DEFAULT 0;
            `);
            currentDbVersion = 8;
            await db.execAsync(`PRAGMA user_version = ${currentDbVersion}`);
            console.log("Migracja 7 -> 8 zakończona pomyślnie.");
        } catch (error) {
            console.error("Błąd podczas migracji 7 -> 8:", error);
        }
    }
}

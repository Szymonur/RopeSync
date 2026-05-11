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

    // Zmieniamy na < 6, żeby wymusić wejście w blok i czyszczenie
    if (currentDbVersion < 6) {
        console.log(
            `Inicjalizacja bazy danych: Wymuszam czyszczenie i nowy schemat`,
        );

        try {
            // Wyłączamy sprawdzanie kluczy na chwilę, żeby móc usunąć tabele w dowolnej kolejności
            await db.execAsync(`PRAGMA foreign_keys = OFF;`);

            // Usuwamy wszystkie stare tabele (tzw. "twardy reset" bazy)
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

            // Włączamy klucze obce z powrotem PRZED tworzeniem schematu
            await db.execAsync(`PRAGMA foreign_keys = ON;`);

            // Wykonujemy cały schemat (teraz stworzy świeże tabele)
            await db.execAsync(DATABASE_SCHEMA);

            // Wypełniamy danymi
            await db.execAsync(SEED_DATA);

            // Zapisujemy nową wersję
            currentDbVersion = 6;
            await db.execAsync(`PRAGMA user_version = ${currentDbVersion}`);

            console.log("Baza danych zainicjalizowana pomyślnie (wersja 6).");
        } catch (error) {
            console.error("Błąd podczas inicjalizacji bazy danych:", error);
        }
    }
}

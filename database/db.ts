import { SQLiteDatabase } from "expo-sqlite";
import { DATABASE_SCHEMA, SEED_DATA } from "./schema";

export async function initializeDatabase(db: SQLiteDatabase) {
    // 1. Optymalizacje silnika SQLite
    await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
    `);

    // 2. System migracji
    const result = await db.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version",
    );
    let currentDbVersion = result?.user_version ?? 0;

    // Jeśli wersja jest mniejsza niż 2, inicjalizujemy nowy schemat
    // (Możesz tu też dodać DROP TABLE jeśli chcesz wyczyścić starą bazę)
    if (currentDbVersion < 3) {
        console.log(
            `Inicjalizacja bazy danych RopeSync: Wersja 2 (Nowy model)`,
        );

        try {
            // Wykonujemy cały schemat
            await db.execAsync(DATABASE_SCHEMA);

            // Wypełniamy danymi słownikowymi
            await db.execAsync(SEED_DATA);

            currentDbVersion = 3;
            await db.execAsync(`PRAGMA user_version = ${currentDbVersion}`);
            console.log("Baza danych zainicjalizowana pomyślnie.");
        } catch (error) {
            console.error("Błąd podczas inicjalizacji bazy danych:", error);
        }
    }
}

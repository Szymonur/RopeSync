import { SQLiteDatabase } from "expo-sqlite";
import { DATABASE_SCHEMA, SEED_DATA } from "./schema";
import { seedMobileDatabase } from '../lib/utils/seedMobile';

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
}

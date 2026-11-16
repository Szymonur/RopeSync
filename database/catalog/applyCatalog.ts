import type { SQLiteDatabase } from "expo-sqlite";

export type CatalogRow = Record<string, string | number | boolean | null | undefined>;
export type CatalogTables = Record<string, CatalogRow[] | undefined>;

export const CATALOG_VERSION_KEY = "catalog_version";

// Kolejność = kolejność wstawiania (rodzice przed dziećmi). Klucze odpowiadają
// odpowiedzi GET /sync/catalog na backendzie (routes/Sync.ts).
// replace: false -> tabela jest tylko uzupełniana (style przejść są używane przez Przejscia).
const CATALOG_TABLES: { key: string; table: string; columns: string[]; replace: boolean }[] = [
    { key: "typy_skaly", table: "Typy_skaly", columns: ["materia"], replace: true },
    { key: "skale_linowe", table: "Skale_linowe", columns: ["francuska", "kurtyki", "yds", "przymiotnikowa"], replace: true },
    { key: "skale_boulderowe", table: "Skale_boulderowe", columns: ["font", "hueco", "krakowska_boulderowa"], replace: true },
    { key: "style_przejscia", table: "Style_przejscia", columns: ["nazwa_stylu"], replace: false },
    { key: "rejony", table: "Rejony", columns: ["id_rejonu", "nazwa_rejonu", "kraj", "szerokosc_geograficzna", "dlugosc_geograficzna"], replace: true },
    { key: "sektory", table: "Sektory", columns: ["id_sektoru", "nazwa_sektoru", "id_rejonu", "szerokosc_geograficzna", "dlugosc_geograficzna"], replace: true },
    { key: "skaly", table: "Skaly", columns: ["id_skaly", "id_sektoru", "nazwa_skaly", "szerokosc_geograficzna", "dlugosc_geograficzna", "materia"], replace: true },
    { key: "drogi", table: "Drogi", columns: ["id_drogi", "typ_drogi", "nazwa_drogi", "id_skaly", "data_utworzenia", "opis"], replace: true },
    { key: "drogi_sportowe_szczegoly", table: "Drogi_sportowe_szczegoly", columns: ["id_drogi", "dlugosc_drogi", "liczba_ringow", "stanowisko", "skala_linowa"], replace: true },
    { key: "trady_szczegoly", table: "Trady_szczegoly", columns: ["id_drogi", "dlugosc_drogi", "czy_stanowiska", "potrzebny_sprzet", "skala_linowa"], replace: true },
    { key: "bouldery_szczegoly", table: "Bouldery_szczegoly", columns: ["id_drogi", "wysokosc", "liczba_potrzebnych_crashpadow", "skala_boulderowa"], replace: true },
];

const CHUNK_SIZE = 100;

const toSqlValue = (value: CatalogRow[string]): string | number | null => {
    if (value === undefined || value === null) return null;
    if (typeof value === "boolean") return value ? 1 : 0;
    return value;
};

// Zastępuje lokalny katalog (rejony, sektory, skały, drogi, słowniki) stanem z serwera
// i zapisuje jego wersję. Całość w jednej transakcji - albo nowy katalog, albo stary.
//
// Dlaczego pełna podmiana, a nie upsert: lokalne ID rejonów/sektorów/skał pochodzą z seeda
// (AUTOINCREMENT) i mogą różnić się od ID na serwerze; po podmianie są identyczne.
// ID dróg są deterministyczne, więc przejścia użytkownika dalej wskazują na te same drogi.
//
// Klucze obce są na czas podmiany wyłączone - inaczej DELETE na katalogu skasowałby
// kaskadowo przejścia użytkownika (Przejscia.id_drogi ON DELETE CASCADE).
export async function applyCatalog(
    db: SQLiteDatabase,
    tables: CatalogTables,
    version: string,
): Promise<void> {
    await db.execAsync("PRAGMA foreign_keys = OFF;");
    try {
        await db.withTransactionAsync(async () => {
            for (const { table, replace } of [...CATALOG_TABLES].reverse()) {
                if (replace) {
                    await db.execAsync(`DELETE FROM ${table};`);
                }
            }

            for (const { key, table, columns, replace } of CATALOG_TABLES) {
                const rows = tables[key] ?? [];
                const rowPlaceholder = `(${columns.map(() => "?").join(", ")})`;
                const verb = replace ? "INSERT" : "INSERT OR IGNORE";

                for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
                    const part = rows.slice(i, i + CHUNK_SIZE);
                    const values: (string | number | null)[] = [];
                    for (const row of part) {
                        for (const column of columns) {
                            values.push(toSqlValue(row[column]));
                        }
                    }
                    await db.runAsync(
                        `${verb} INTO ${table} (${columns.join(", ")}) VALUES ${part.map(() => rowPlaceholder).join(", ")}`,
                        values,
                    );
                }
            }

            await db.runAsync(
                "INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
                [CATALOG_VERSION_KEY, version],
            );
        });
    } finally {
        await db.execAsync("PRAGMA foreign_keys = ON;");
    }

    // Przejścia do dróg, których nie ma już w katalogu, zostają (lista pokaże je bez nazwy drogi)
    const orphans = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) AS count FROM Przejscia p
         LEFT JOIN Drogi d ON d.id_drogi = p.id_drogi
         WHERE d.id_drogi IS NULL`,
    );
    if (orphans && orphans.count > 0) {
        console.warn(`Katalog: ${orphans.count} przejść wskazuje na drogi spoza nowego katalogu.`);
    }
}

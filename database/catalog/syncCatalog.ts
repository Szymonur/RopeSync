import type { SQLiteDatabase } from "expo-sqlite";
import api from "../../lib/api/client";
import { applyCatalog, CatalogTables, CATALOG_VERSION_KEY } from "./applyCatalog";

interface CatalogResponse {
    version: string;
    changed: boolean;
    tables?: CatalogTables;
}

// Pobranie całego katalogu może potrwać dłużej niż zwykłe zapytanie
const CATALOG_TIMEOUT_MS = 60000;

// Sprawdza wersję katalogu na serwerze i - jeśli się zmieniła - podmienia lokalny katalog.
// Zwraca true, gdy lokalne dane katalogu zostały zmienione.
// Seed z bundla zostaje "pierwszą paczką": aplikacja działa od razu, a katalog dociąga się przy pierwszej sieci.
export async function syncCatalog(db: SQLiteDatabase): Promise<boolean> {
    const row = await db.getFirstAsync<{ value: string | null }>(
        "SELECT value FROM sync_state WHERE key = ?",
        [CATALOG_VERSION_KEY],
    );
    const localVersion = row?.value ?? null;

    let data: CatalogResponse;
    try {
        const response = await api.get<CatalogResponse>("/sync/catalog", {
            params: localVersion ? { version: localVersion } : undefined,
            timeout: CATALOG_TIMEOUT_MS,
        });
        data = response.data;
    } catch (error: any) {
        // Starszy backend bez tego endpointu - zostajemy przy katalogu lokalnym
        if (error?.response?.status === 404) return false;
        throw error;
    }

    if (!data || typeof data.version !== "string" || !data.changed || !data.tables) {
        return false;
    }

    // Zabezpieczenie: pusty katalog na serwerze nie może wyczyścić katalogu w telefonie
    const routes = data.tables.drogi;
    if (!Array.isArray(routes) || routes.length === 0) {
        console.warn("Katalog: serwer zwrócił pusty katalog dróg - pomijam podmianę.");
        return false;
    }

    await applyCatalog(db, data.tables, data.version);
    return true;
}

import api from "../../../lib/api/client";
import { ApiAscentRepository  } from "../api/APIAscentRepository";
import { Ascent, AscentStyle, UserStats } from '../../../types/ascent';
import { getCurrentUserId } from "../../../lib/utils/authStorage"
import { SQLiteDatabase } from "expo-sqlite";
import { LOCAL_USER_PLACEHOLDER } from "./UserRepository";

const BULK_CHUNK_SIZE = 100;

// W SQLite timeline_data jest tekstem (JSON), a z API przychodzi obiekt.
// Repozytorium zawsze zwraca obiekt albo undefined (pusty obiekt traktujemy jak brak danych).
const normalizeAscent = <T extends Ascent>(row: T): T => {
    const raw = row.timeline_data as unknown;
    if (typeof raw !== "string") return row;
    try {
        const parsed = JSON.parse(raw);
        const hasData = parsed && typeof parsed === "object" && Object.keys(parsed).length > 0;
        return { ...row, timeline_data: hasData ? parsed : undefined };
    } catch {
        return { ...row, timeline_data: undefined };
    }
};

const serializeTimeline = (timeline: unknown): string | null => {
    if (timeline == null) return null;
    return typeof timeline === "string" ? timeline : JSON.stringify(timeline);
};

const chunk = <T,>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
};


const LINEAR_GRADE_ORDER = ["3","4","4+","5a","5a+","5b","5b+","5c","5c+","6a","6a+","6b","6b+","6c","6c+","7a","7a+","7b","7b+","7c","7c+","8a","8a+","8b","8b+","8c","8c+","9a","9a+"];
const BOULDER_GRADE_ORDER = ["4","4+","5","5+","6a","6a+","6b","6b+","6c","6c+","7a","7a+","7b","7b+","7c","7c+","8a","8a+"];

export class MobileAscentRepository extends ApiAscentRepository  {
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
        super();
        this.db = db;
    }

    async getUserStats(userId: number, signal?: AbortSignal): Promise<UserStats> {
        try {
            const counts = await this.db.getFirstAsync<{
                total: number, 
                sport: number, 
                trad: number, 
                mixed_trad: number,
                boulder: number
            }>(
                `SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN d.typ_drogi = 'Sport' THEN 1 END) as sport,
                    COUNT(CASE WHEN d.typ_drogi = 'Trad' THEN 1 END) as trad,
                    COUNT(CASE WHEN d.typ_drogi = 'Mixed trad' THEN 1 END) as mixed_trad,
                    COUNT(CASE WHEN d.typ_drogi = 'Boulder' THEN 1 END) as boulder
                 FROM Przejscia p
                 JOIN Drogi d ON p.id_drogi = d.id_drogi
                 WHERE p.id_uzytkownika = ? AND p.deleted = 0`,
                [userId]
            );

            const bestSport = await this.getBestAscentLocal(userId, 'Sport', LINEAR_GRADE_ORDER);
            const bestTrad = await this.getBestAscentLocal(userId, 'Trad', LINEAR_GRADE_ORDER);
            const bestMixedTrad = await this.getBestAscentLocal(userId, 'Mixed trad', LINEAR_GRADE_ORDER);
            const bestBoulder = await this.getBestAscentLocal(userId, 'Boulder', BOULDER_GRADE_ORDER);

            // Pobieranie wycen przez złączenie ze słownikiem Skale_linowe, aby zawsze mieć 'kurtyki' (Uppercase)
            const gradeChart = await this.db.getAllAsync<{label: string, count: number}>(
                `SELECT 
                    COALESCE(sl.kurtyki, db.skala_boulderowa) as label,
                    COUNT(*) as count
                 FROM Przejscia p
                 JOIN Drogi d ON p.id_drogi = d.id_drogi
                 LEFT JOIN Drogi_sportowe_szczegoly ds ON ds.id_drogi = d.id_drogi
                 LEFT JOIN Trady_szczegoly dt ON dt.id_drogi = d.id_drogi
                 LEFT JOIN Bouldery_szczegoly db ON db.id_drogi = d.id_drogi
                 LEFT JOIN Skale_linowe sl ON sl.francuska = COALESCE(ds.skala_linowa, dt.skala_linowa)
                 WHERE p.id_uzytkownika = ? AND p.deleted = 0
                 GROUP BY label
                 HAVING label IS NOT NULL
                 ORDER BY count DESC, label DESC`,
                [userId]
            );

            const weeklyChartRaw = await this.db.getAllAsync<{data: string}>(
                `SELECT data FROM Przejscia 
                 WHERE id_uzytkownika = ? AND deleted = 0 
                 AND data >= date('now', '-84 days')`,
                [userId]
            );
            
            const weeklyChart = this.processWeeklyChart(weeklyChartRaw.map(r => r.data));

            return {
                totalCount: counts?.total || 0,
                sportCount: counts?.sport || 0,
                tradCount: counts?.trad || 0,
                mixedTradCount: counts?.mixed_trad || 0,
                boulderCount: counts?.boulder || 0,
                
                bestSport: bestSport || undefined,
                bestTrad: bestTrad || undefined,
                bestMixedTrad: bestMixedTrad || undefined,
                bestBoulder: bestBoulder || undefined,
                
                gradeChart: gradeChart,
                weeklyChart: weeklyChart
            };
        } catch (error) {
            console.error("Błąd podczas generowania statystyk lokalnych:", error);
            return await super.getUserStats(userId, signal);
        }
    }

    private async getBestAscentLocal(userId: number, type: string, order: string[]): Promise<Ascent | null> {
        const candidates = await this.db.getAllAsync<Ascent>(
            `SELECT p.*, d.nazwa_drogi, d.typ_drogi,
                COALESCE(sl.kurtyki, db.skala_boulderowa) as wycena
             FROM Przejscia p
             JOIN Drogi d ON p.id_drogi = d.id_drogi
             LEFT JOIN Drogi_sportowe_szczegoly ds ON ds.id_drogi = d.id_drogi
             LEFT JOIN Trady_szczegoly dt ON dt.id_drogi = d.id_drogi
             LEFT JOIN Bouldery_szczegoly db ON db.id_drogi = d.id_drogi
             LEFT JOIN Skale_linowe sl ON sl.francuska = COALESCE(ds.skala_linowa, dt.skala_linowa)
             WHERE p.id_uzytkownika = ? AND d.typ_drogi = ? AND p.deleted = 0`,
            [userId, type]
        );

        if (candidates.length === 0) return null;

        return candidates.reduce((best, current) => {
            const bestIdx = order.indexOf(best.wycena || "");
            const currentIdx = order.indexOf(current.wycena || "");
            
            if (currentIdx > bestIdx) return current;
            if (currentIdx === bestIdx && current.data > best.data) return current;
            return best;
        }, candidates[0]);
    }

    private processWeeklyChart(dates: string[]) {
        const now = new Date();
        const day = now.getDay();
        const mondayShift = day === 0 ? -6 : 1 - day;
        const thisWeekStart = new Date(now);
        thisWeekStart.setHours(0, 0, 0, 0);
        thisWeekStart.setDate(thisWeekStart.getDate() + mondayShift);

        const weekStarts: Date[] = [];
        for (let i = 11; i >= 0; i -= 1) {
            const start = new Date(thisWeekStart);
            start.setDate(start.getDate() - i * 7);
            weekStarts.push(start);
        }

        const toWeekKey = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        const allowedWeekKeys = new Set(weekStarts.map(d => toWeekKey(d)));
        const weeklyCounts = new Map<string, number>();

        dates.forEach(dateStr => {
            const d = new Date(dateStr);
            const dDay = d.getDay();
            const dShift = dDay === 0 ? -6 : 1 - dDay;
            const ws = new Date(d);
            ws.setHours(0, 0, 0, 0);
            ws.setDate(ws.getDate() + dShift);
            const key = toWeekKey(ws);
            if (allowedWeekKeys.has(key)) {
                weeklyCounts.set(key, (weeklyCounts.get(key) || 0) + 1);
            }
        });

        return weekStarts.map(ws => ({
            label: toWeekKey(ws),
            count: weeklyCounts.get(toWeekKey(ws)) || 0
        }));
    }

    async getAscents(): Promise<Ascent[]> {
        try {    
            const currentUserId = await getCurrentUserId();
            const rows = await this.db.getAllAsync<Ascent>(
                `SELECT
                    p.id_przejscia,
                    p.data,
                    p.notatka,
                    p.timeline_data,
                    p.id_uzytkownika,
                    p.nazwa_stylu,
                    p.id_drogi,
                    p.synced,
                    p.deleted,
                    d.nazwa_drogi AS nazwa_drogi,
                    d.typ_drogi AS typ_drogi,
                    COALESCE(
                        sl.kurtyki,
                        db.skala_boulderowa
                    ) AS wycena
                 FROM Przejscia p
                 LEFT JOIN Drogi d ON p.id_drogi = d.id_drogi
                 LEFT JOIN Drogi_sportowe_szczegoly ds ON ds.id_drogi = d.id_drogi
                 LEFT JOIN Trady_szczegoly dt ON dt.id_drogi = d.id_drogi
                 LEFT JOIN Bouldery_szczegoly db ON db.id_drogi = d.id_drogi
                 LEFT JOIN Skale_linowe sl ON sl.francuska = COALESCE(ds.skala_linowa, dt.skala_linowa)
                 WHERE p.id_uzytkownika = ? AND p.deleted = 0
                 ORDER BY p.data DESC, p.id_przejscia DESC`,
                [currentUserId],
            );
            return rows.map(normalizeAscent);
        } catch (error: any) {
            throw new Error(`Wystąpił błąd podczas pobierania przejść z bazy danych. ${error}`);
        }
    }

    async getAscent(ascentId: string, ownerId?: number): Promise<Ascent> {
        const userId = await getCurrentUserId();
        
        if (ownerId && ownerId !== Number(userId)) {
            return await super.getAscent(ascentId); 
        }
        try {    
            const localResult = await this.db.getFirstAsync<Ascent>(
            `SELECT
                p.id_przejscia,
                p.data,
                p.notatka,
                p.timeline_data,
                p.id_uzytkownika,
                p.nazwa_stylu,
                p.id_drogi,
                p.synced,
                p.deleted,
                d.nazwa_drogi AS nazwa_drogi,
                d.typ_drogi AS typ_drogi,
                COALESCE(
                    sl.kurtyki,
                    db.skala_boulderowa
                ) AS wycena
             FROM Przejscia p
             LEFT JOIN Drogi d ON p.id_drogi = d.id_drogi
             LEFT JOIN Drogi_sportowe_szczegoly ds ON ds.id_drogi = d.id_drogi
             LEFT JOIN Trady_szczegoly dt ON dt.id_drogi = d.id_drogi
             LEFT JOIN Bouldery_szczegoly db ON db.id_drogi = d.id_drogi
             LEFT JOIN Skale_linowe sl ON sl.francuska = COALESCE(ds.skala_linowa, dt.skala_linowa)
             WHERE p.id_przejscia = ? AND p.deleted = 0`,
            [ascentId]);

            if (localResult) {
                return normalizeAscent(localResult); 
            }
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania szczegułów przejscia.");
        }
        return await super.getAscent(ascentId);
    }

    async getStyles(): Promise<AscentStyle[]> {
        try {    
            return await this.db.getAllAsync<AscentStyle>(`SELECT nazwa_stylu FROM Style_przejscia ORDER BY nazwa_stylu ASC`);
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania mozliwych styli z bazy danych.");
        }
    }

    // Offline-first: zmiana trafia najpierw do lokalnej bazy i UI dostaje odpowiedź od razu.
    // Wysyłka na serwer idzie w tle; jeśli się nie uda, dokończy ją useSyncManager.
    async deleteAscent(ascentId: string): Promise<void> {
        try {
            await this.markAsDeletedLocal(ascentId);
        } catch (sqliteError) {
            throw new Error("Krytyczny błąd: nie udało się usunąć przejścia lokalnie.");
        }
        void this.pushDeletion(ascentId);
    }

    async addAscent(ascent: Ascent): Promise<void> {
        try {
            await this.addAscentLocal({ ...ascent, synced: 0, deleted: 0 });
        } catch (sqliteError) {
            throw new Error(`Krytyczny błąd: nie udało się dodać przejścia lokalnie. ${sqliteError}`);
        }
        void this.pushAscent(ascent);
    }

    private async pushAscent(ascent: Ascent): Promise<void> {
        try {
            await super.addAscent(ascent);
            await this.markAsSynced(ascent.id_przejscia);
        } catch (error) {
            console.log(`Dodano tylko lokalnie. Czeka na sync. ID: ${ascent.id_przejscia}`);
        }
    }

    private async pushDeletion(ascentId: string): Promise<void> {
        try {
            await super.deleteAscent(ascentId);
            await this.deleteAscentPermanently(ascentId);
        } catch (error) {
            console.log(`Usunięto tylko lokalnie. Czeka na sync. ID: ${ascentId}`);
        }
    }

    // Odsiewa przejścia, których nie da się zapisać (klucze obce są włączone): droga lub styl
    // nieznane lokalnie. Dzięki temu jeden taki rekord nie blokuje całej paczki.
    private async prepareServerAscents(ascents: Ascent[]): Promise<Ascent[]> {
        const [routeRows, styleRows] = await Promise.all([
            this.db.getAllAsync<{ id_drogi: string }>("SELECT id_drogi FROM Drogi"),
            this.db.getAllAsync<{ nazwa_stylu: string }>("SELECT nazwa_stylu FROM Style_przejscia"),
        ]);
        const knownRoutes = new Set(routeRows.map((r) => r.id_drogi));
        const knownStyles = new Set(styleRows.map((s) => s.nazwa_stylu));
        const valid = ascents.filter(
            (a) => knownRoutes.has(a.id_drogi) && knownStyles.has(a.nazwa_stylu),
        );
        if (valid.length < ascents.length) {
            console.warn(
                `Sync: pominięto ${ascents.length - valid.length} przejść do dróg/stylów nieznanych lokalnie.`,
            );
        }

        const userIds = new Set(valid.map((a) => a.id_uzytkownika));
        for (const userId of userIds) {
            await this.ensureUserRow(userId);
        }
        return valid;
    }

    private async writeServerAscents(ascents: Ascent[], onConflict: string): Promise<number> {
        let changes = 0;
        for (const part of chunk(ascents, BULK_CHUNK_SIZE)) {
            const placeholders = part.map(() => "(?, ?, ?, ?, ?, ?, ?, 1, 0)").join(", ");
            const values: (string | number | null)[] = [];
            for (const ascent of part) {
                values.push(
                    ascent.id_przejscia,
                    ascent.data,
                    ascent.notatka ?? null,
                    serializeTimeline(ascent.timeline_data),
                    ascent.id_uzytkownika,
                    ascent.nazwa_stylu,
                    ascent.id_drogi,
                );
            }
            const result = await this.db.runAsync(
                `INSERT INTO Przejscia (id_przejscia, data, notatka, timeline_data, id_uzytkownika, nazwa_stylu, id_drogi, synced, deleted) VALUES ${placeholders} ${onConflict}`,
                values,
            );
            changes += result.changes;
        }
        return changes;
    }

    // Wstawia przejścia pobrane z serwera (istniejące lokalnie zostają bez zmian).
    // Zwraca liczbę faktycznie dodanych wierszy.
    async addAscentsLocal(ascents: Ascent[]): Promise<number> {
        if (ascents.length === 0) return 0;
        try {
            const valid = await this.prepareServerAscents(ascents);
            return await this.writeServerAscents(valid, "ON CONFLICT (id_przejscia) DO NOTHING");
        } catch (sqliteError) {
            throw new Error(`Krytyczny błąd: nie udało się dodać przejść lokalnie. ${sqliteError}`);
        }
    }

    // Synchronizacja różnicowa: wstawia nowe i nadpisuje istniejące przejścia stanem z serwera.
    // Lokalnych zmian czekających na wysyłkę (synced = 0 lub deleted = 1) NIE nadpisuje.
    async applyServerAscents(ascents: Ascent[]): Promise<{ changed: number; skipped: number }> {
        if (ascents.length === 0) return { changed: 0, skipped: 0 };
        try {
            const valid = await this.prepareServerAscents(ascents);
            const changed = await this.writeServerAscents(
                valid,
                `ON CONFLICT (id_przejscia) DO UPDATE SET
                    data = excluded.data,
                    notatka = excluded.notatka,
                    timeline_data = excluded.timeline_data,
                    nazwa_stylu = excluded.nazwa_stylu,
                    id_drogi = excluded.id_drogi
                 WHERE Przejscia.synced = 1 AND Przejscia.deleted = 0`,
            );
            return { changed, skipped: ascents.length - valid.length };
        } catch (sqliteError) {
            throw new Error(`Krytyczny błąd: nie udało się zapisać zmian z serwera. ${sqliteError}`);
        }
    }

    // Kursor ostatnio pobranych zmian z serwera (osobny dla każdego użytkownika)
    async getSyncCursor(userId: number): Promise<string | null> {
        const row = await this.db.getFirstAsync<{ value: string | null }>(
            "SELECT value FROM sync_state WHERE key = ?",
            [`ascents_cursor_${userId}`],
        );
        return row?.value ?? null;
    }

    async setSyncCursor(userId: number, cursor: string): Promise<void> {
        await this.db.runAsync(
            "INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
            [`ascents_cursor_${userId}`, cursor],
        );
    }

    // Usuwa lokalnie przejścia, których serwer już nie ma (np. skasowane z weba).
    // Dotyczy wyłącznie wierszy wcześniej zsynchronizowanych i nieoznaczonych do usunięcia.
    async removeSyncedAscentsLocal(ascentIds: string[]): Promise<number> {
        let removed = 0;
        for (const part of chunk(ascentIds, BULK_CHUNK_SIZE)) {
            const placeholders = part.map(() => "?").join(", ");
            const result = await this.db.runAsync(
                `DELETE FROM Przejscia WHERE synced = 1 AND deleted = 0 AND id_przejscia IN (${placeholders})`,
                part,
            );
            removed += result.changes;
        }
        return removed;
    }

    // Przejście wymaga wiersza użytkownika (klucz obcy). Jeśli profilu nie ma lokalnie,
    // tworzymy zaślepkę - pełne dane uzupełni MobileUserRepository.getCurrentUser().
    private async ensureUserRow(userId: number) {
        await this.db.runAsync(
            `INSERT OR IGNORE INTO Uzytkownicy (id_uzytkownika, login, email, haslo, sol, imie, nazwisko)
             VALUES (?, ?, ?, ?, ?, '', '')`,
            [userId, `user_${userId}`, `user_${userId}@local.invalid`, LOCAL_USER_PLACEHOLDER, LOCAL_USER_PLACEHOLDER],
        );
    }

    private async markAsDeletedLocal(ascentId: string) {
        await this.db.runAsync(
            "UPDATE Przejscia SET deleted = 1, synced = 0 WHERE id_przejscia = ?",
            [ascentId],
        );
    }

    private async addAscentLocal(ascent: Ascent) {
        await this.ensureUserRow(ascent.id_uzytkownika);
        await this.db.runAsync(
            "INSERT INTO Przejscia (id_przejscia, data, notatka, timeline_data, id_uzytkownika, nazwa_stylu, id_drogi, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                ascent.id_przejscia,
                ascent.data,
                ascent.notatka ?? null,
                serializeTimeline(ascent.timeline_data),
                ascent.id_uzytkownika,
                ascent.nazwa_stylu,
                ascent.id_drogi,
                ascent.synced ?? 1,
                ascent.deleted ?? 0,
            ],
        );
    }

    async getAscentsCountLocal(): Promise<number>{
        const userId = await getCurrentUserId();
        const result =  await this.db.getFirstAsync<{count: number}>(
            "SELECT COUNT(*) as count FROM Przejscia WHERE id_uzytkownika = ? AND deleted = 0",
            [userId]
        );
        return result?.count ?? 0;
    }

    async getAscentsUUID(): Promise<string[]>{
        const userId = await getCurrentUserId();
        const rows = await this.db.getAllAsync<{ id_przejscia: string }>(
            "SELECT id_przejscia FROM Przejscia WHERE id_uzytkownika = ?",
            [userId]
        );
        return rows.map(row => row.id_przejscia);
    }

    // ID przejść, które serwer już potwierdził (podstawa do wyznaczania różnic)
    async getSyncedAscentIds(userId: number): Promise<string[]> {
        const rows = await this.db.getAllAsync<{ id_przejscia: string }>(
            "SELECT id_przejscia FROM Przejscia WHERE id_uzytkownika = ? AND synced = 1",
            [userId]
        );
        return rows.map(row => row.id_przejscia);
    }

    async markAsSynced(ascentId: string) {
        await this.db.runAsync(
            "UPDATE Przejscia SET synced = 1 WHERE id_przejscia = ? AND deleted = 0",
            [ascentId],
        );
    }

    async deleteAscentPermanently(ascentId: string) {
        await this.db.runAsync("DELETE FROM Przejscia WHERE id_przejscia = ?", [
            ascentId,
        ]);
    }

    async getUnsyncedAscents(userId: number): Promise<Ascent[]> {
        const rows = await this.db.getAllAsync<Ascent>(
            "SELECT * FROM Przejscia WHERE id_uzytkownika = ? AND synced = 0 AND deleted = 0 AND sync_error IS NULL",
            [userId],
        );
        return rows.map(normalizeAscent);
    }

    // Błąd chwilowy (sieć, 5xx): tylko licznik prób - przejście zostaje w kolejce
    async recordSyncAttempt(ascentId: string) {
        await this.db.runAsync(
            "UPDATE Przejscia SET sync_attempts = sync_attempts + 1 WHERE id_przejscia = ?",
            [ascentId],
        );
    }

    // Błąd trwały (4xx): przejście wypada z kolejki do czasu resetSyncErrors()
    async markSyncFailed(ascentId: string, reason: string) {
        await this.db.runAsync(
            "UPDATE Przejscia SET sync_attempts = sync_attempts + 1, sync_error = ? WHERE id_przejscia = ?",
            [reason, ascentId],
        );
    }

    // Daje odrzuconym przejściom kolejną szansę (np. po aktualizacji aplikacji / katalogu dróg)
    async resetSyncErrors(userId: number) {
        await this.db.runAsync(
            "UPDATE Przejscia SET sync_error = NULL WHERE id_uzytkownika = ? AND sync_error IS NOT NULL",
            [userId],
        );
    }

    async getUnsyncedDeletions(userId: number): Promise<Ascent[]> {
        return await this.db.getAllAsync<Ascent>(
            "SELECT * FROM Przejscia WHERE id_uzytkownika = ? AND synced = 0 AND deleted = 1",
            [userId],
        );
    }
}

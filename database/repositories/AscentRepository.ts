import { SQLiteDatabase } from "expo-sqlite";
import * as Crypto from "expo-crypto";

export interface Ascent {
    id_przejscia: string;
    data: string;
    notatka: string;
    timeline_data: string | null;
    id_uzytkownika: number;
    nazwa_stylu: string;
    id_drogi: string | null;
    synced: number; // 0 = false, 1 = true
    deleted: number; // 0 = false, 1 = true
    nazwa_drogi?: string;
    typ_drogi?: string;
    wycena?: string | null;
}

export interface ManualAscentInput {
    data: string;
    id_drogi: string;
    notatka: string;
    id_uzytkownika: number;
    nazwa_stylu?: string;
    synced?: number;
    deleted?: number;
}

export interface RouteForSelection {
    id_drogi: string;
    nazwa_drogi: string;
    typ_drogi: string;
    wycena: string | null;
    nazwa_rejonu: string;
}

export class AscentRepository {
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
        this.db = db;
    }

    // Pobierz tylko przejścia zalogowanego użytkownika (nieusunięte)
    async getAscentsForUser(userId: number): Promise<Ascent[]> {
        return await this.db.getAllAsync<Ascent>(
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
                    ds.skala_linowa,
                    dt.skala_linowa,
                    db.skala_boulderowa
                ) AS wycena
             FROM Przejscia p
             LEFT JOIN Drogi d ON p.id_drogi = d.id_drogi
             LEFT JOIN Drogi_sportowe_szczegoly ds ON ds.id_drogi = d.id_drogi AND d.typ_drogi = 'sportowa'
             LEFT JOIN Trady_szczegoly dt ON dt.id_drogi = d.id_drogi AND d.typ_drogi = 'trad'
             LEFT JOIN Bouldery_szczegoly db ON db.id_drogi = d.id_drogi AND d.typ_drogi = 'boulder'
             WHERE p.id_uzytkownika = ? AND p.deleted = 0
             ORDER BY p.data DESC, p.id_przejscia DESC`,
            [userId],
        );
    }

    // Pobierz szczegóły konkretnego przejścia wraz z nazwą drogi
    async getAscentDetails(ascentId: string): Promise<Ascent | null> {
        const result = await this.db.getFirstAsync<Ascent>(
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
                    ds.skala_linowa,
                    dt.skala_linowa,
                    db.skala_boulderowa
                ) AS wycena
             FROM Przejscia p
             LEFT JOIN Drogi d ON p.id_drogi = d.id_drogi
             LEFT JOIN Drogi_sportowe_szczegoly ds ON ds.id_drogi = d.id_drogi AND d.typ_drogi = 'sportowa'
             LEFT JOIN Trady_szczegoly dt ON dt.id_drogi = d.id_drogi AND d.typ_drogi = 'trad'
             LEFT JOIN Bouldery_szczegoly db ON db.id_drogi = d.id_drogi AND d.typ_drogi = 'boulder'
             WHERE p.id_przejscia = ? AND p.deleted = 0`,
            [ascentId],
        );
        return result;
    }

    async getRoutesForSelection(): Promise<RouteForSelection[]> {
        return await this.db.getAllAsync<RouteForSelection>(
            `SELECT
                d.id_drogi,
                d.nazwa_drogi,
                d.typ_drogi,
                COALESCE(ds.skala_linowa, dt.skala_linowa, db.skala_boulderowa) AS wycena,
                r.nazwa_rejonu
             FROM Drogi d
             LEFT JOIN Drogi_sportowe_szczegoly ds ON ds.id_drogi = d.id_drogi AND d.typ_drogi = 'sportowa'
             LEFT JOIN Trady_szczegoly dt ON dt.id_drogi = d.id_drogi AND d.typ_drogi = 'trad'
             LEFT JOIN Bouldery_szczegoly db ON db.id_drogi = d.id_drogi AND d.typ_drogi = 'boulder'
             JOIN Skaly s ON d.id_skaly = s.id_skaly
             JOIN Sektory sek ON s.id_sektoru = sek.id_sektoru
             JOIN Rejony r ON sek.id_rejonu = r.id_rejonu
             ORDER BY d.nazwa_drogi ASC`,
        );
    }

    async getStylesForSelection(): Promise<string[]> {
        const result = await this.db.getAllAsync<{ nazwa_stylu: string }>(
            "SELECT nazwa_stylu FROM Style_przejscia ORDER BY nazwa_stylu ASC",
        );
        return result.map((item) => item.nazwa_stylu);
    }

    // Dodaj nowe przejście (automatycznie przypisane do usera)
    async addAscent(
        ascent: Omit<Ascent, "id_przejscia"> & { id_przejscia: string },
    ) {
        await this.db.runAsync(
            "INSERT INTO Przejscia (id_przejscia, data, notatka, timeline_data, id_uzytkownika, nazwa_stylu, id_drogi, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                ascent.id_przejscia,
                ascent.data,
                ascent.notatka,
                ascent.timeline_data,
                ascent.id_uzytkownika,
                ascent.nazwa_stylu,
                ascent.id_drogi,
                ascent.synced ?? 1,
                ascent.deleted ?? 0,
            ],
        );
    }

    async addManualAscent(ascent: ManualAscentInput) {
        const ascentId = Crypto.randomUUID();

        await this.db.runAsync(
            `INSERT INTO Przejscia (
                id_przejscia,
                data,
                notatka,
                timeline_data,
                id_uzytkownika,
                nazwa_stylu,
                id_drogi,
                synced,
                deleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ascentId,
                ascent.data,
                ascent.notatka,
                null,
                ascent.id_uzytkownika,
                ascent.nazwa_stylu ?? "RP",
                ascent.id_drogi,
                ascent.synced ?? 0,
                ascent.deleted ?? 0,
            ],
        );

        return ascentId;
    }

    // Miękkie usuwanie lokalne (oznaczenie do synchronizacji)
    async markAsDeletedLocal(ascentId: string) {
        await this.db.runAsync(
            "UPDATE Przejscia SET deleted = 1, synced = 0 WHERE id_przejscia = ?",
            [ascentId],
        );
    }

    // Twarde usuwanie z bazy lokalnej
    async deleteAscentPermanently(ascentId: string) {
        await this.db.runAsync(
            "DELETE FROM Przejscia WHERE id_przejscia = ?",
            [ascentId],
        );
    }

    // Pobierz przejścia do synchronizacji (nowe)
    async getUnsyncedAscents(userId: number): Promise<Ascent[]> {
        return await this.db.getAllAsync<Ascent>(
            "SELECT * FROM Przejscia WHERE id_uzytkownika = ? AND synced = 0 AND deleted = 0",
            [userId],
        );
    }

    // Pobierz przejścia do usunięcia na serwerze
    async getUnsyncedDeletions(userId: number): Promise<Ascent[]> {
        return await this.db.getAllAsync<Ascent>(
            "SELECT * FROM Przejscia WHERE id_uzytkownika = ? AND synced = 0 AND deleted = 1",
            [userId],
        );
    }

    // Oznacz jako zsynchronizowane
    async markAsSynced(ascentId: string) {
        await this.db.runAsync(
            "UPDATE Przejscia SET synced = 1 WHERE id_przejscia = ?",
            [ascentId],
        );
    }
}

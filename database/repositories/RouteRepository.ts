import { SQLiteDatabase } from "expo-sqlite";

export interface RouteListItem {
    id_drogi: string;
    nazwa_drogi: string;
    typ_drogi: string;
    nazwa_skaly: string;
    skala: string;
}

export interface RouteDetails extends RouteListItem {
    opis?: string;
    dlugosc_drogi?: number;
    liczba_ringow?: number;
    stanowisko?: string;
    czy_stanowiska?: boolean;
    wysokosc?: number;
    liczba_potrzebnych_crashpadow?: number;
    potrzebny_sprzet?: string;
    nazwa_sektoru: string;
    nazwa_rejonu: string;
}

export class RouteRepository {
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
        this.db = db;
    }

    async getRoutesBySector(sectorId: number): Promise<RouteListItem[]> {
        const query = `
            SELECT 
                d.id_drogi, 
                d.nazwa_drogi, 
                d.typ_drogi, 
                s.nazwa_skaly,
                COALESCE(ds.skala_linowa, ts.skala_linowa, bs.skala_boulderowa) as skala
            FROM Drogi d
            JOIN Skaly s ON d.id_skaly = s.id_skaly
            LEFT JOIN Drogi_sportowe_szczegoly ds ON d.id_drogi = ds.id_drogi
            LEFT JOIN Trady_szczegoly ts ON d.id_drogi = ts.id_drogi
            LEFT JOIN Bouldery_szczegoly bs ON d.id_drogi = bs.id_drogi
            WHERE s.id_sektoru = ?
            ORDER BY s.nazwa_skaly ASC, d.nazwa_drogi ASC
        `;
        return await this.db.getAllAsync<RouteListItem>(query, [sectorId]);
    }

    async getRouteDetails(routeId: string): Promise<RouteDetails | null> {
        const query = `
            SELECT 
                d.*, 
                s.nazwa_skaly,
                sek.nazwa_sektoru,
                rej.nazwa_rejonu,
                ds.dlugosc_drogi as sport_dlugosc,
                ds.liczba_ringow,
                ds.stanowisko,
                ds.skala_linowa as sport_skala,
                ts.dlugosc_drogi as trad_dlugosc,
                ts.czy_stanowiska,
                ts.potrzebny_sprzet,
                ts.skala_linowa as trad_skala,
                bs.wysokosc,
                bs.liczba_potrzebnych_crashpadow,
                bs.skala_boulderowa as boulder_skala,
                COALESCE(ds.skala_linowa, ts.skala_linowa, bs.skala_boulderowa) as skala
            FROM Drogi d
            JOIN Skaly s ON d.id_skaly = s.id_skaly
            JOIN Sektory sek ON s.id_sektoru = sek.id_sektoru
            JOIN Rejony rej ON sek.id_rejonu = rej.id_rejonu
            LEFT JOIN Drogi_sportowe_szczegoly ds ON d.id_drogi = ds.id_drogi
            LEFT JOIN Trady_szczegoly ts ON d.id_drogi = ts.id_drogi
            LEFT JOIN Bouldery_szczegoly bs ON d.id_drogi = bs.id_drogi
            WHERE d.id_drogi = ?
        `;

        const result = await this.db.getFirstAsync<any>(query, [routeId]);
        if (!result) return null;

        return {
            ...result,
            dlugosc_drogi: result.sport_dlugosc || result.trad_dlugosc,
        };
    }

    async searchRoutes(query: string): Promise<RouteListItem[]> {
        const sql = `
            SELECT 
                d.id_drogi, 
                d.nazwa_drogi, 
                d.typ_drogi, 
                s.nazwa_skaly,
                COALESCE(ds.skala_linowa, ts.skala_linowa, bs.skala_boulderowa) as skala
            FROM Drogi d
            JOIN Skaly s ON d.id_skaly = s.id_skaly
            LEFT JOIN Drogi_sportowe_szczegoly ds ON d.id_drogi = ds.id_drogi
            LEFT JOIN Trady_szczegoly ts ON d.id_drogi = ts.id_drogi
            LEFT JOIN Bouldery_szczegoly bs ON d.id_drogi = bs.id_drogi
            WHERE d.nazwa_drogi LIKE ?
            ORDER BY d.nazwa_drogi ASC
        `;
        return await this.db.getAllAsync<RouteListItem>(sql, [`%${query}%`]);
    }
}

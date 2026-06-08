import { ApiRouteRepository } from "../api/ApiRouteRepository";
import { RouteListItem, RouteFilters, RouteDetails } from '../../../types/route';
import { SQLiteDatabase } from "expo-sqlite";


export class MobileRouteRepository extends ApiRouteRepository {
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
        super();
        this.db = db;
    }

    async getRoutes(filters?: RouteFilters, signal?: AbortSignal): Promise<RouteListItem[]> {
        try {
            const values = [
                filters?.nazwa_drogi || null,
                filters?.skala || null,
                filters?.typ_drogi || null
            ];
            return await this.db.getAllAsync<RouteListItem>(
                `SELECT 
					d.id_drogi,
					d.typ_drogi,
					d.nazwa_drogi,
					s.nazwa_skaly,
					COALESCE(ds.skala_linowa, dt.skala_linowa, db.skala_boulderowa) AS wycena,
					r.nazwa_rejonu
				FROM Drogi d
				JOIN Skaly s ON d.id_skaly = s.id_skaly
				JOIN Sektory sek ON s.id_sektoru = sek.id_sektoru
				JOIN Rejony r ON sek.id_rejonu = r.id_rejonu
				LEFT JOIN Drogi_sportowe_szczegoly ds ON d.id_drogi = ds.id_drogi
				LEFT JOIN Trady_szczegoly dt ON d.id_drogi = dt.id_drogi
				LEFT JOIN Bouldery_szczegoly db ON d.id_drogi = db.id_drogi
				WHERE 
					(?1 IS NULL OR d.nazwa_drogi LIKE '%' || ?1 || '%')
					AND (?2 IS NULL OR COALESCE(ds.skala_linowa, dt.skala_linowa, db.skala_boulderowa) = ?2)
					AND (?3 IS NULL OR d.typ_drogi = ?3)`,
                values,
            );
        } catch (error: any) {
            throw new Error(`Wystąpił błąd podczas pobierania dróg z bazy danych.`);
        }
    }

    async getRouteDetails(routeId: string, signal?: AbortSignal): Promise<RouteDetails | null> {
        try {
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
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania szczegółów drogi z bazy danych.");
        }
    }

    async searchRoutes(query: string, signal?: AbortSignal): Promise<RouteListItem[]> {
        try {
            const sql = `
                SELECT 
                    d.id_drogi, Rock & { nazwa_sektoru: string }
                    d.nazwa_drogi, 
                    d.typ_drogi, 
                    s.nazwa_skaly,
                    COALESCE(ds.skala_linowa, ts.skala_linowa, bs.skala_boulderowa) as wycena,
                    r.nazwa_rejonu
                FROM Drogi d
                JOIN Skaly s ON d.id_skaly = s.id_skaly
                JOIN Sektory sek ON s.id_sektoru = sek.id_sektoru
                JOIN Rejony r ON sek.id_rejonu = r.id_rejonu
                LEFT JOIN Drogi_sportowe_szczegoly ds ON d.id_drogi = ds.id_drogi
                LEFT JOIN Trady_szczegoly dt ON d.id_drogi = dt.id_drogi
                LEFT JOIN Bouldery_szczegoly db ON d.id_drogi = db.id_drogi
                WHERE d.nazwa_drogi LIKE ?
                ORDER BY d.nazwa_drogi ASC
            `;
            return await this.db.getAllAsync<RouteListItem>(sql, [`%${query}%`]);
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas wyszukiwania dróg w bazie danych.");
        }
    }

    async getRoutesBySector(sectorId: number, signal?: AbortSignal): Promise<RouteListItem[]> {
        try {
            const query = `
                SELECT 
                    d.id_drogi, 
                    d.nazwa_drogi, 
                    d.typ_drogi, 
                    s.nazwa_skaly,
                    COALESCE(ds.skala_linowa, ts.skala_linowa, bs.skala_boulderowa) as wycena
                FROM Drogi d
                JOIN Skaly s ON d.id_skaly = s.id_skaly
                LEFT JOIN Drogi_sportowe_szczegoly ds ON d.id_drogi = ds.id_drogi
                LEFT JOIN Trady_szczegoly ts ON d.id_drogi = ts.id_drogi
                LEFT JOIN Bouldery_szczegoly bs ON d.id_drogi = bs.id_drogi
                WHERE s.id_sektoru = ?
                ORDER BY s.nazwa_skaly ASC, d.nazwa_drogi ASC
            `;
            return await this.db.getAllAsync<RouteListItem>(query, [sectorId]);
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania dróg dla sektora z bazy danych.");
        }
    }
}

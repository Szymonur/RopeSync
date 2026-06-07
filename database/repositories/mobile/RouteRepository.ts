import api from "../../../lib/api/client";
import { ApiRouteRepository} from "../api/ApiRouteRepository";
import { RouteListItem, RouteFilters } from '../../../types/route';
import { getCurrentUserId } from "../../../lib/utils/authStorage"
import { SQLiteDatabase } from "expo-sqlite";


export class MobileRouteRepository extends ApiRouteRepository  {
	private db: SQLiteDatabase;

	constructor(db: SQLiteDatabase) {
		super();
		this.db = db;
	}

	async getRoutes(filters?: RouteFilters): Promise<RouteListItem[]> {
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
			throw new Error(`Wystąpił błąd podczas pobierania dróg z bazy danych. ${error}`);
		}
    }

}
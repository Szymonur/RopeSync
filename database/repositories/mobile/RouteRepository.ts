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
            const response = await api.get<RouteListItem[]>('/routes', {
                params: filters 
            });
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw new Error(error.response.data.message || "Błąd podczas pobierania dróg.");
            }
            throw new Error("Brak połączenia z serwerem lub nieznany błąd.");
        }
    }

}
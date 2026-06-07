import api from "../../../lib/api/client";
import { IRouteRepository } from "../interfaces/IRouteRepository";
import { RouteListItem, RouteFilters } from '../../../types/route';


export class ApiRouteRepository implements IRouteRepository {

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
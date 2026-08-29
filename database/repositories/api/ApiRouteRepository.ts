import api from "../../../lib/api/client";
import { IRouteRepository } from "../interfaces/IRouteRepository";
import { RouteListItem, RouteFilters, RouteDetails } from '../../../types/route';


export class ApiRouteRepository implements IRouteRepository {

    async getRoutes(filters?: RouteFilters, signal?: AbortSignal): Promise<RouteListItem[]> {
        try {
            const response = await api.get<RouteListItem[]>('/routes', {
                params: filters,
                signal
            });
            return response.data;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania dróg.");
        }
    }

    async getRouteDetails(routeId: string, signal?: AbortSignal): Promise<RouteDetails | null> {
        try {
            const response = await api.get<RouteDetails>(`/routes/${routeId}`, { signal });
            return response.data;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania szczegółów drogi.");
        }
    }

    async searchRoutes(query: string, signal?: AbortSignal): Promise<RouteListItem[]> {
        try {
            const response = await api.get<{routes: RouteListItem[]}>('/routes/search', {
                params: { query },
                signal
            });
			
            return response.data.routes;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas wyszukiwania dróg.");
        }
    }

    async getRoutesBySector(sectorId: number, signal?: AbortSignal): Promise<RouteListItem[]> {
        try {
            const response = await api.get<RouteListItem[]>(`/routes`, {
                params: {id_sektoru: sectorId},
                signal
            });
            return response.data;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania dróg dla sektora.");
        }
    }

}

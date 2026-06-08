import { RouteListItem, RouteFilters, RouteDetails } from '../../../types/route';

export interface IRouteRepository {
	getRoutes(filters?: RouteFilters, signal?: AbortSignal): Promise<RouteListItem[]>;
    getRouteDetails(routeId: string, signal?: AbortSignal): Promise<RouteDetails | null>;
    searchRoutes(query: string, signal?: AbortSignal): Promise<RouteListItem[]>;
    getRoutesBySector(sectorId: number, signal?: AbortSignal): Promise<RouteListItem[]>;
}

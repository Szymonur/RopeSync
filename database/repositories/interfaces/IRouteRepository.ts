import { Route, RouteListItem, RouteFilters } from '../../../types/route';

export interface IRouteRepository {
	getRoutes(filters?: RouteFilters, signal?: AbortSignal): Promise<RouteListItem[]>;
}

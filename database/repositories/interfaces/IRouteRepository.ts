import { Route, RouteListItem, RouteFilters } from '../../../types/route';

export interface IRouteRepository {
	getRoutes(filters: RouteFilters): Promise<RouteListItem[]>;
}

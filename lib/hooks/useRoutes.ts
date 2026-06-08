import { useQuery } from "@tanstack/react-query";
import { useRepositories } from "../../contexts/RepositoryContext";
import { RouteFilters } from "../../types/route";

export const useRoutes = (filters?: RouteFilters, options?: { enabled?: boolean }) => {
    const { routeRepository } = useRepositories();

    return useQuery({
        queryKey: ['routes', filters],
        queryFn: ({ signal }) => routeRepository.getRoutes(filters, signal),
        placeholderData: (previousData) => previousData,
        staleTime: 1000 * 60 * 5, // 5 minut
        ...options,
    });
};

export const useRoutesBySector = (sectorId: number, options?: { enabled?: boolean }) => {
    const { routeRepository } = useRepositories();

    return useQuery({
        queryKey: ['routes', 'sector', sectorId],
        queryFn: ({ signal }) => routeRepository.getRoutesBySector(sectorId, signal),
        enabled: !!sectorId && (options?.enabled !== false),
        ...options,
    });
};

export const useRouteDetails = (routeId: string, options?: { enabled?: boolean }) => {
    const { routeRepository } = useRepositories();

    return useQuery({
        queryKey: ['route', routeId],
        queryFn: ({ signal }) => routeRepository.getRouteDetails(routeId, signal),
        enabled: !!routeId && (options?.enabled !== false),
        ...options,
    });
};

export const useSearchRoutes = (query: string, options?: { enabled?: boolean }) => {
    const { routeRepository } = useRepositories();

    return useQuery({
        queryKey: ['routes', 'search', query],
        queryFn: ({ signal }) => routeRepository.searchRoutes(query, signal),
        enabled: query.length > 0 && (options?.enabled !== false),
        ...options,
    });
};

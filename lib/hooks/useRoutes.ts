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

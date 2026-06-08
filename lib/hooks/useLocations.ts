import { useQuery } from "@tanstack/react-query";
import { useRepositories } from "../../contexts/RepositoryContext";

export const useRegions = (options?: { enabled?: boolean }) => {
    const { locationRepository } = useRepositories();

    return useQuery({
        queryKey: ['regions'],
        queryFn: ({ signal }) => locationRepository.getRegions(signal),
        staleTime: 1000 * 60 * 60, // 1 godzina
        ...options,
    });
};

export const useRegionById = (id: number, options?: { enabled?: boolean }) => {
    const { locationRepository } = useRepositories();

    return useQuery({
        queryKey: ['region', id],
        queryFn: ({ signal }) => locationRepository.getRegionById(id, signal),
        enabled: !!id && (options?.enabled !== false),
        ...options,
    });
};

export const useSearchRegions = (query: string, options?: { enabled?: boolean }) => {
    const { locationRepository } = useRepositories();

    return useQuery({
        queryKey: ['regions', 'search', query],
        queryFn: ({ signal }) => locationRepository.searchRegions(query, signal),
        enabled: query.length > 0 && (options?.enabled !== false),
        ...options,
    });
};

export const useSectors = (options?: { enabled?: boolean }) => {
    const { locationRepository } = useRepositories();

    return useQuery({
        queryKey: ['sectors'],
        queryFn: ({ signal }) => locationRepository.getSectors(signal),
        staleTime: 1000 * 60 * 60,
        ...options,
    });
};

export const useSectorsByRegion = (regionId: number, options?: { enabled?: boolean }) => {
    const { locationRepository } = useRepositories();

    return useQuery({
        queryKey: ['sectors', 'region', regionId],
        queryFn: ({ signal }) => locationRepository.getSectorsByRegion(regionId, signal),
        enabled: !!regionId && (options?.enabled !== false),
        ...options,
    });
};

export const useSectorById = (id: number, options?: { enabled?: boolean }) => {
    const { locationRepository } = useRepositories();

    return useQuery({
        queryKey: ['sector', id],
        queryFn: ({ signal }) => locationRepository.getSectorById(id, signal),
        enabled: !!id && (options?.enabled !== false),
        ...options,
    });
};

export const useSearchSectors = (query: string, options?: { enabled?: boolean }) => {
    const { locationRepository } = useRepositories();

    return useQuery({
        queryKey: ['sectors', 'search', query],
        queryFn: ({ signal }) => locationRepository.searchSectors(query, signal),
        enabled: query.length > 0 && (options?.enabled !== false),
        ...options,
    });
};

export const useRocks = (options?: { enabled?: boolean }) => {
    const { locationRepository } = useRepositories();

    return useQuery({
        queryKey: ['rocks'],
        queryFn: ({ signal }) => locationRepository.getRocks(signal),
        staleTime: 1000 * 60 * 60,
        ...options,
    });
};

export const useRocksBySector = (sectorId: number, options?: { enabled?: boolean }) => {
    const { locationRepository } = useRepositories();

    return useQuery({
        queryKey: ['rocks', 'sector', sectorId],
        queryFn: ({ signal }) => locationRepository.getRocksBySector(sectorId, signal),
        enabled: !!sectorId && (options?.enabled !== false),
        ...options,
    });
};

export const useRockById = (id: number, options?: { enabled?: boolean }) => {
    const { locationRepository } = useRepositories();

    return useQuery({
        queryKey: ['rock', id],
        queryFn: ({ signal }) => locationRepository.getRockById(id, signal),
        enabled: !!id && (options?.enabled !== false),
        ...options,
    });
};

export const useSearchRocks = (query: string, options?: { enabled?: boolean }) => {
    const { locationRepository } = useRepositories();

    return useQuery({
        queryKey: ['rocks', 'search', query],
        queryFn: ({ signal }) => locationRepository.searchRocks(query, signal),
        enabled: query.length > 0 && (options?.enabled !== false),
        ...options,
    });
};

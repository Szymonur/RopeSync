import { useState, useEffect, useMemo } from "react";
import { useRepositories } from "../../contexts/RepositoryContext";
import { Region } from "../../types/location";
import { RouteListItem } from "../../types/route";
import { Sector } from "../../types/location";

export const useExploreSearch = (query: string) => {
    const { locationRepository, routeRepository } = useRepositories();
    const [regions, setRegions] = useState<Region[]>([]);
    const [searchResults, setSearchResults] = useState<{
        regions: Region[];
        sectors: (Sector & { nazwa_rejonu: string })[];
        routes: RouteListItem[];
    }>({ regions: [], sectors: [], routes: [] });

    useEffect(() => {
        const loadInitial = async () => {
            try {
                const data = await locationRepository.getRegions();
                setRegions(data);
            } catch (error) {
                console.error("Błąd ładowania regionów:", error);
            }
        };
        loadInitial();
    }, [locationRepository]);

    useEffect(() => {
        const controller = new AbortController();
        const performSearch = async () => {
            if (query.length < 2) {
                setSearchResults({ regions: [], sectors: [], routes: [] });
                return;
            }
            try {
                const [r, s, d] = await Promise.all([
                    locationRepository.searchRegions(query, controller.signal),
                    locationRepository.searchSectors(query, controller.signal),
                    routeRepository.searchRoutes(query, controller.signal),
                ]);
				console.log("r, s, d", r, s, d);
				
                setSearchResults({ regions: r, sectors: s, routes: d });
            } catch (error: any) {
                if (error.name === 'AbortError') return;
                console.error("Błąd wyszukiwania:", error);
            }
        };

        const timer = setTimeout(performSearch, 300);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, locationRepository, routeRepository]);

    const sections = useMemo(() => {
        const results = [];
        if (searchResults.regions.length > 0) {
            results.push({
                title: "Regions",
                data: searchResults.regions,
                type: "region" as const,
            });
        }
        if (searchResults.sectors.length > 0) {
            results.push({
                title: "Sectors",
                data: searchResults.sectors,
                type: "sector" as const,
            });
        }
        if (searchResults.routes.length > 0) {
            results.push({
                title: "Routes",
                data: searchResults.routes,
                type: "route" as const,
            });
        }
        return results;
    }, [searchResults]);

    return { regions, sections };
};

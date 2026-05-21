import { useState, useEffect, useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";
import {
    RegionRepository,
    Region,
} from "../../database/repositories/RegionRepository";
import {
    SectorRepository,
    Sector,
} from "../../database/repositories/SectorRepository";
import {
    RouteRepository,
    RouteListItem,
} from "../../database/repositories/RouteRepository";

export const useExploreSearch = (query: string) => {
    const db = useSQLiteContext();
    const [regions, setRegions] = useState<Region[]>([]);
    const [searchResults, setSearchResults] = useState<{
        regions: Region[];
        sectors: (Sector & { nazwa_rejonu: string })[];
        routes: RouteListItem[];
    }>({ regions: [], sectors: [], routes: [] });

    const regionRepo = useMemo(() => new RegionRepository(db), [db]);
    const sectorRepo = useMemo(() => new SectorRepository(db), [db]);
    const routeRepo = useMemo(() => new RouteRepository(db), [db]);

    useEffect(() => {
        const loadInitial = async () => {
            try {
                const data = await regionRepo.getAllRegions();
                setRegions(data);
            } catch (error) {
                console.error("Błąd ładowania regionów:", error);
            }
        };
        loadInitial();
    }, [regionRepo]);

    useEffect(() => {
        const performSearch = async () => {
            if (query.length < 2) {
                setSearchResults({ regions: [], sectors: [], routes: [] });
                return;
            }
            try {
                const [r, s, d] = await Promise.all([
                    regionRepo.searchRegions(query),
                    sectorRepo.searchSectors(query),
                    routeRepo.searchRoutes(query),
                ]);
                setSearchResults({ regions: r, sectors: s, routes: d });
            } catch (error) {
                console.error("Błąd wyszukiwania:", error);
            }
        };

        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [query, regionRepo, sectorRepo, routeRepo]);

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

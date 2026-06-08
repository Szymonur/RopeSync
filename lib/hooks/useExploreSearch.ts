import { useMemo } from "react";
import { useRegions, useSearchRegions, useSearchSectors } from "./useLocations";
import { useSearchRoutes } from "./useRoutes";

export const useExploreSearch = (query: string) => {
    // Initial regions load
    const { data: regions = [] } = useRegions();

    // Search results
    const isSearchEnabled = query.length >= 2;
    
    const { data: searchRegions = [], isLoading: isSearchRegionsLoading } = useSearchRegions(query, { enabled: isSearchEnabled });
    const { data: searchSectors = [], isLoading: isSearchSectorsLoading } = useSearchSectors(query, { enabled: isSearchEnabled });
    const { data: searchRoutes = [], isLoading: isSearchRoutesLoading } = useSearchRoutes(query, { enabled: isSearchEnabled });

    const sections = useMemo(() => {
        if (!isSearchEnabled) return [];

        const results = [];
        if (searchRegions.length > 0) {
            results.push({
                title: "Regions",
                data: searchRegions,
                type: "region" as const,
            });
        }
        if (searchSectors.length > 0) {
            results.push({
                title: "Sectors",
                data: searchSectors,
                type: "sector" as const,
            });
        }
        if (searchRoutes.length > 0) {
            results.push({
                title: "Routes",
                data: searchRoutes,
                type: "route" as const,
            });
        }
        return results;
    }, [isSearchEnabled, searchRegions, searchSectors, searchRoutes]);

    return { 
        regions, 
        sections,
        isLoading: isSearchRegionsLoading || isSearchSectorsLoading || isSearchRoutesLoading
    };
};

import { Sector, Region, Rock } from "../../../types/location";

export interface ILocationRepository {
    getRegions(signal?: AbortSignal): Promise<Region[]>;
    getRegionById(id: number, signal?: AbortSignal): Promise<Region | null>;
    searchRegions(query: string, signal?: AbortSignal): Promise<Region[]>;

    getSectors(signal?: AbortSignal): Promise<Sector[]>;
    getSectorsByRegion(regionId: number, signal?: AbortSignal): Promise<Sector[]>;
    getSectorById(id: number, signal?: AbortSignal): Promise<Sector | null>;
    searchSectors(query: string, signal?: AbortSignal): Promise<(Sector & { nazwa_rejonu: string })[]>;

    getRocks(signal?: AbortSignal): Promise<Rock[]>;
    getRocksBySector(sectorId: number, signal?: AbortSignal): Promise<Rock[]>;
    getRockById(id: number, signal?: AbortSignal): Promise<Rock | null>;
    searchRocks(query: string, signal?: AbortSignal): Promise<(Rock & { nazwa_sektoru: string })[]>;
}

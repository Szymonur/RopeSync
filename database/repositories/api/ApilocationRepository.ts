import api from "../../../lib/api/client";
import { ILocationRepository } from "../interfaces/IlocationRepository";
import { Sector, Region, Rock } from "../../../types/location";

export class ApiLocationRepository implements ILocationRepository {
    async getRegions(signal?: AbortSignal): Promise<Region[]> {
        try {
            const response = await api.get<{ regions: Region[] }>('/regions', { signal });
            return response.data.regions;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania rejonów.");
        }
    }

    async getRegionById(id: number, signal?: AbortSignal): Promise<Region | null> {
        try {
            const response = await api.get<{ region: Region }>(`/regions/${id}`, { signal });
            return response.data.region;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania rejonu.");
        }
    }

    async searchRegions(query: string, signal?: AbortSignal): Promise<Region[]> {
        try {
            const response = await api.get<{ regions: Region[] }>('/regions/search', {
                params: { query },
                signal
            });
            return response.data.regions;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas wyszukiwania rejonów.");
        }
    }

    async getSectors(signal?: AbortSignal): Promise<Sector[]> {
        try {
            const response = await api.get<{ sectors: Sector[] }>('/sectors', { signal });
            return response.data.sectors;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania sektorów.");
        }
    }

    async getSectorsByRegion(regionId: number, signal?: AbortSignal): Promise<Sector[]> {
        try {
            const response = await api.get<{ sectors: Sector[] }>(`/regions/${regionId}/sectors`, { signal });
            return response.data.sectors;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania sektorów dla rejonu.");
        }
    }

    async getSectorById(id: number, signal?: AbortSignal): Promise<Sector | null> {
        try {
            const response = await api.get<{ sector: Sector }>(`/sectors/${id}`, { signal });
            return response.data.sector;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania sektora.");
        }
    }

    async searchSectors(query: string, signal?: AbortSignal): Promise<(Sector & { nazwa_rejonu: string })[]> {
        try {
            const response = await api.get<{ sectors: (Sector & { nazwa_rejonu: string })[] }>('/sectors/search', {
                params: { query },
                signal
            });
            return response.data.sectors;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas wyszukiwania sektorów.");
        }
    }

    async getRocks(signal?: AbortSignal): Promise<Rock[]> {
        try {
            const response = await api.get<{ rocks: Rock[] }>('/rocks', { signal });
            return response.data.rocks;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania skał.");
        }
    }

    async getRocksBySector(sectorId: number, signal?: AbortSignal): Promise<Rock[]> {
        try {
            const response = await api.get<{ rocks: Rock[] }>(`/sectors/${sectorId}/rocks`, { signal });
            return response.data.rocks;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania skał dla sektora.");
        }
    }

    async getRockById(id: number, signal?: AbortSignal): Promise<Rock | null> {
        try {
            const response = await api.get<{ rock: Rock }>(`/rocks/${id}`, { signal });
            return response.data.rock;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas pobierania skały.");
        }
    }

    async searchRocks(query: string, signal?: AbortSignal): Promise<(Rock & { nazwa_sektoru: string })[]> {
        try {
            const response = await api.get<{ rocks: (Rock & { nazwa_sektoru: string })[] }>('/rocks/search', {
                params: { query },
                signal
            });
            return response.data.rocks;
        } catch (error: any) {
            throw new Error("Wystąpił błąd podczas wyszukiwania skał.");
        }
    }
}

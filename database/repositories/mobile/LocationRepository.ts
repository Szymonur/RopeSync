import { ApiLocationRepository } from "../api/ApilocationRepository";
import { SQLiteDatabase } from "expo-sqlite";
import { Sector, Region, Rock } from "../../../types/location";

export class MobileLocationRepository extends ApiLocationRepository {
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
        super();
        this.db = db;
    }

    async getRegions(signal?: AbortSignal): Promise<Region[]> {
        return await this.db.getAllAsync<Region>(
            "SELECT * FROM Rejony ORDER BY nazwa_rejonu ASC"
        );
    }

    async getRegionById(id: number, signal?: AbortSignal): Promise<Region | null> {
        return await this.db.getFirstAsync<Region>(
            "SELECT * FROM Rejony WHERE id_rejonu = ?",
            [id]
        );
    }

    async searchRegions(query: string, signal?: AbortSignal): Promise<Region[]> {
        return await this.db.getAllAsync<Region>(
            "SELECT * FROM Rejony WHERE nazwa_rejonu LIKE ? ORDER BY nazwa_rejonu ASC",
            [`%${query}%`]
        );
    }

    async getSectors(signal?: AbortSignal): Promise<Sector[]> {
        return await this.db.getAllAsync<Sector>(
            "SELECT * FROM Sektory ORDER BY nazwa_sektoru ASC"
        );
    }

    async getSectorsByRegion(regionId: number, signal?: AbortSignal): Promise<Sector[]> {
        return await this.db.getAllAsync<Sector>(
            "SELECT * FROM Sektory WHERE id_rejonu = ? ORDER BY nazwa_sektoru ASC",
            [regionId]
        );
    }

    async getSectorById(id: number, signal?: AbortSignal): Promise<Sector | null> {
        return await this.db.getFirstAsync<Sector>(
            "SELECT * FROM Sektory WHERE id_sektoru = ?",
            [id]
        );
    }

    async searchSectors(query: string, signal?: AbortSignal): Promise<(Sector & { nazwa_rejonu: string })[]> {
        return await this.db.getAllAsync<any>(
            `SELECT s.*, r.nazwa_rejonu 
             FROM Sektory s 
             JOIN Rejony r ON s.id_rejonu = r.id_rejonu 
             WHERE s.nazwa_sektoru LIKE ? 
             ORDER BY s.nazwa_sektoru ASC`,
            [`%${query}%`]
        );
    }

    async getRocks(signal?: AbortSignal): Promise<Rock[]> {
        return await this.db.getAllAsync<Rock>(
            "SELECT * FROM Skaly ORDER BY nazwa_skaly ASC"
        );
    }

    async getRocksBySector(sectorId: number, signal?: AbortSignal): Promise<Rock[]> {
        return await this.db.getAllAsync<Rock>(
            "SELECT * FROM Skaly WHERE id_sektoru = ? ORDER BY nazwa_skaly ASC",
            [sectorId]
        );
    }

    async getRockById(id: number, signal?: AbortSignal): Promise<Rock | null> {
        return await this.db.getFirstAsync<Rock>(
            "SELECT * FROM Skaly WHERE id_skaly = ?",
            [id]
        );
    }

    async searchRocks(query: string, signal?: AbortSignal): Promise<(Rock & { nazwa_sektoru: string })[]> {
        return await this.db.getAllAsync<any>(
            `SELECT sk.*, s.nazwa_sektoru 
             FROM Skaly sk 
             JOIN Sektory s ON sk.id_sektoru = s.id_sektoru 
             WHERE sk.nazwa_skaly LIKE ? 
             ORDER BY sk.nazwa_skaly ASC`,
            [`%${query}%`]
        );
    }
}

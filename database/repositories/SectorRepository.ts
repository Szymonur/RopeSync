import { SQLiteDatabase } from "expo-sqlite";

export interface Sector {
    id_sektoru: number;
    nazwa_sektoru: string;
    id_rejonu: number;
    szerokosc_geograficzna: number;
    dlugosc_geograficzna: number;
}

export class SectorRepository {
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
        this.db = db;
    }

    async getSectorsByRegion(regionId: number): Promise<Sector[]> {
        return await this.db.getAllAsync<Sector>(
            "SELECT * FROM Sektory WHERE id_rejonu = ? ORDER BY nazwa_sektoru ASC",
            [regionId],
        );
    }

    async getSectorById(id: number): Promise<Sector | null> {
        return await this.db.getFirstAsync<Sector>(
            "SELECT * FROM Sektory WHERE id_sektoru = ?",
            [id],
        );
    }

    async searchSectors(
        query: string,
    ): Promise<(Sector & { nazwa_rejonu: string })[]> {
        return await this.db.getAllAsync<any>(
            `SELECT s.*, r.nazwa_rejonu 
             FROM Sektory s 
             JOIN Rejony r ON s.id_rejonu = r.id_rejonu 
             WHERE s.nazwa_sektoru LIKE ? 
             ORDER BY s.nazwa_sektoru ASC`,
            [`%${query}%`],
        );
    }
}

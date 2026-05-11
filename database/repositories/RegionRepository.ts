import { SQLiteDatabase } from "expo-sqlite";

export interface Region {
    id_rejonu: number;
    nazwa_rejonu: string;
    szerokosc_geograficzna: number;
    dlugosc_geograficzna: number;
    kraj?: string;
}

export class RegionRepository {
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
        this.db = db;
    }

    async getAllRegions(): Promise<Region[]> {
        return await this.db.getAllAsync<Region>(
            "SELECT * FROM Rejony ORDER BY nazwa_rejonu ASC",
        );
    }
}

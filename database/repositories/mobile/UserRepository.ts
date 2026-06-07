import api from "../../../lib/api/client";
import { SQLiteDatabase } from "expo-sqlite";
import { LoginResponse } from '../../../types/user';
import { ApiUserRepository } from "../api/ApiUserRepository";

export class MobileUserRepository extends ApiUserRepository{
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
		super();
        this.db = db;
    }

    async login(username: string, password: string): Promise<LoginResponse> {
		const responseData = await super.login(username, password);
        try {           
            const query = `INSERT OR IGNORE INTO uzytkownicy (id_uzytkownika, email, login, imie, nazwisko) VALUES (?, ?, ?, ?, ?);`;
			await this.db.runAsync(query, [
				responseData.userId,
				responseData.email,
				responseData.username,
				responseData.firstName,
				responseData.lastName,
			]);
            return responseData;
        } catch (error: any) {
			console.error(`Nie udało się zapisać użytkownika w lokalnym SQLite:`, error);
        }
		return responseData;
    }
}


import { SQLiteDatabase } from "expo-sqlite";
import { LoginResponse, User } from '../../../types/user';
import { ApiUserRepository } from "../api/ApiUserRepository";
import { getCurrentUserId } from "../../../lib/utils/authStorage"

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
	async getCurrentUser(): Promise<User> {
		const userId= await getCurrentUserId();
		try {           
            const query = `SELECT 
								id_uzytkownika AS userId,
								login AS username,
								email,
								imie AS firstName,
								nazwisko AS lastName
							FROM uzytkownicy
							WHERE id_uzytkownika = ?;`;
			const result = await this.db.getFirstAsync<User>(query, [userId]);
			if (!result) {
				throw new Error("Brak danych zalogowanego użytkownika w bazie danych.");
			}
            return result;
        } catch (error: any) {
			console.error(`Nie udało się odczytać użytkownika z lokalnego SQLite:`, error);
			throw error;
        }
	}
}


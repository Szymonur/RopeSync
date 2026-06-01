import { SQLiteDatabase } from "expo-sqlite";

export interface User {
    id_uzytkownika: number;
    login: string;
    email: string;
    imie: string;
    nazwisko: string;
}
export class UserRepository {
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
        this.db = db;
    }
    async setUserInfo(user: User) {
        const query = `INSERT OR IGNORE INTO uzytkownicy (id_uzytkownika, email, login, imie, nazwisko) VALUES (?, ?, ?, ?, ?);`;
        const result = await this.db.runAsync(query, [
            user.id_uzytkownika,
            user.email,
            user.login,
            user.imie,
            user.nazwisko,
        ]);
        if (!result) {
            throw new Error(`Nie udało się dodać usera do bazy danych`);
        }
    }

    async getUserInfo(userId: number): Promise<User> {
        const query = `select id_uzytkownika, login, email, imie, nazwisko from uzytkownicy where id_uzytkownika = ?`;
        const result = await this.db.getFirstAsync<User>(query, [userId]);
        if (!result) {
            throw new Error(
                `Użytkownik o ID ${userId} nie został znaleziony w bazie.`,
            );
        }
        return result;
    }
}

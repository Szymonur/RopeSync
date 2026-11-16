import { SQLiteDatabase } from "expo-sqlite";
import { LoginResponse, User } from '../../../types/user';
import { ApiUserRepository } from "../api/ApiUserRepository";
import { getCurrentUserId } from "../../../lib/utils/authStorage"

// Znacznik wiersza-zaślepki tworzonego przez MobileAscentRepository.ensureUserRow
export const LOCAL_USER_PLACEHOLDER = "local_placeholder";

export class MobileUserRepository extends ApiUserRepository {
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
        super();
        this.db = db;
    }

    private async saveUserLocal(user: User): Promise<void> {
        await this.db.runAsync(
            `INSERT INTO Uzytkownicy
                (id_uzytkownika, email, login, haslo, sol, imie, nazwisko)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id_uzytkownika) DO UPDATE SET
                email = excluded.email,
                login = excluded.login,
                haslo = excluded.haslo,
                sol = excluded.sol,
                imie = excluded.imie,
                nazwisko = excluded.nazwisko;`,
            [
                user.userId,
                user.email,
                user.username,
                "mobile_profile",
                "mobile_profile",
                user.firstName,
                user.lastName,
            ],
        );
    }

    async login(username: string, password: string): Promise<LoginResponse> {
        const responseData = await super.login(username, password);
        try {
            await this.saveUserLocal(responseData);
        } catch (error) {
            // Logowanie na serwerze się powiodło - profil lokalny uzupełni getCurrentUser()
            console.error("Nie udało się zapisać użytkownika w lokalnym SQLite:", error);
        }
        return responseData;
    }

    async getCurrentUser(): Promise<User> {
        const userId = await getCurrentUserId();
        if (!userId) {
            throw new Error("Brak identyfikatora zalogowanego użytkownika.");
        }

        const row = await this.db.getFirstAsync<User & { haslo: string }>(
            `SELECT
                id_uzytkownika AS userId,
                login AS username,
                email,
                imie AS firstName,
                nazwisko AS lastName,
                haslo
            FROM Uzytkownicy
            WHERE id_uzytkownika = ?;`,
            [userId],
        );

        if (row && row.haslo !== LOCAL_USER_PLACEHOLDER) {
            const { haslo, ...user } = row;
            return user;
        }

        // Brak pełnego profilu lokalnie (np. po wyczyszczeniu bazy) - pobierz z API i zapisz
        const remoteUser = await super.getCurrentUser();
        try {
            await this.saveUserLocal(remoteUser);
        } catch (error) {
            console.error("Nie udało się zapisać użytkownika w lokalnym SQLite:", error);
        }
        return remoteUser;
    }
}

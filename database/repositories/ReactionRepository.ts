import { SQLiteDatabase } from "expo-sqlite";

export interface Reaction {
    id?: number;
    id_uzytkownika: number;
    id_przejscia: string;
    imie?: string;
    nazwisko?: string;
    username?: string;
    data_reakcji?: string;
    wyswietlono: number; // 0 = unread, 1 = read
}

export interface NotificationItem {
    id: number;
    id_uzytkownika: number;
    id_przejscia: string;
    imie: string;
    nazwisko: string;
    username: string;
    data_reakcji: string;
    wyswietlono: number;
    nazwa_drogi: string;
}

export class ReactionRepository {
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
        this.db = db;
    }

    async addReaction(reaction: Reaction) {
        await this.db.runAsync(
            "INSERT OR IGNORE INTO Reakcje (id_uzytkownika, id_przejscia, imie, nazwisko, username, data_reakcji, wyswietlono) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                reaction.id_uzytkownika,
                reaction.id_przejscia,
                reaction.imie || null,
                reaction.nazwisko || null,
                reaction.username || null,
                reaction.data_reakcji || null,
                reaction.wyswietlono,
            ],
        );
    }

    async removeReaction(userId: number, ascentId: string) {
        await this.db.runAsync(
            "DELETE FROM Reakcje WHERE id_uzytkownika = ? AND id_przejscia = ?",
            [userId, ascentId],
        );
    }

    async getUnreadCount(currentUserId: number): Promise<number> {
        const result = await this.db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count 
             FROM Reakcje r
             JOIN Przejscia p ON r.id_przejscia = p.id_przejscia
             WHERE p.id_uzytkownika = ? AND r.wyswietlono = 0`,
            [currentUserId],
        );
        return result?.count || 0;
    }

    async markAllAsRead(currentUserId: number) {
        await this.db.runAsync(
            `UPDATE Reakcje 
             SET wyswietlono = 1 
             WHERE id_przejscia IN (SELECT id_przejscia FROM Przejscia WHERE id_uzytkownika = ?)`,
            [currentUserId],
        );
    }

    async getNotifications(currentUserId: number): Promise<NotificationItem[]> {
        return await this.db.getAllAsync<NotificationItem>(
            `SELECT r.*, d.nazwa_drogi 
             FROM Reakcje r
             JOIN Przejscia p ON r.id_przejscia = p.id_przejscia
             JOIN Drogi d ON p.id_drogi = d.id_drogi
             WHERE p.id_uzytkownika = ?
             ORDER BY r.data_reakcji DESC, r.id DESC
             LIMIT 50`,
            [currentUserId]
        );
    }

    async getReactionsForAscent(ascentId: string): Promise<Reaction[]> {
        return await this.db.getAllAsync<Reaction>(
            "SELECT * FROM Reakcje WHERE id_przejscia = ?",
            [ascentId],
        );
    }
}

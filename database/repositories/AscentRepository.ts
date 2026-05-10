import { SQLiteDatabase } from 'expo-sqlite';

export interface Ascent {
  id_przejscia: string;
  data: string;
  notatka: string;
  id_uzytkownika: number;
  nazwa_stylu: string;
  id_drogi: string;
}

export class AscentRepository {
  private db: SQLiteDatabase;

  constructor(db: SQLiteDatabase) {
    this.db = db;
  }

  // Pobierz tylko przejścia zalogowanego użytkownika
  async getAscentsForUser(userId: number): Promise<Ascent[]> {
    return await this.db.getAllAsync<Ascent>(
      'SELECT * FROM Przejscia WHERE id_uzytkownika = ? ORDER BY data DESC',
      [userId]
    );
  }

  // Dodaj nowe przejście (automatycznie przypisane do usera)
  async addAscent(ascent: Omit<Ascent, 'id_przejscia'> & { id_przejscia: string }) {
    await this.db.runAsync(
      'INSERT INTO Przejscia (id_przejscia, data, notatka, id_uzytkownika, nazwa_stylu, id_drogi) VALUES (?, ?, ?, ?, ?, ?)',
      [ascent.id_przejscia, ascent.data, ascent.notatka, ascent.id_uzytkownika, ascent.nazwa_stylu, ascent.id_drogi]
    );
  }

  // Usuń przejście (sprawdzając czy należy do usera dla bezpieczeństwa)
  async deleteAscent(ascentId: string, userId: number) {
    await this.db.runAsync(
      'DELETE FROM Przejscia WHERE id_przejscia = ? AND id_uzytkownika = ?',
      [ascentId, userId]
    );
  }
}

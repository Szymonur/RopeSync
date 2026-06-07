import api from "../../../lib/api/client";
import { ApiAscentRepository  } from "../api/APIAscentRepository";
import { Ascent, AscentStyle } from '../../../types/ascent';
import { getCurrentUserId } from "../../../lib/utils/authStorage"
import { SQLiteDatabase } from "expo-sqlite";



export class MobileAscentRepository extends ApiAscentRepository  {
    private db: SQLiteDatabase;
	private currentUserId: string | null = null;

    constructor(db: SQLiteDatabase) {
		super();
        this.db = db;
    }
	private async getUserId(): Promise<string> {
        if (!this.currentUserId) {
            const id = await getCurrentUserId();
            if (!id) throw new Error("Brak zalogowanego użytkownika.");
            this.currentUserId = id;
        }
        return this.currentUserId;
    }

	async getAscents(): Promise<Ascent[]> {
        try {    
			const currentUserId = await getCurrentUserId();
			return await this.db.getAllAsync<Ascent>(
				`SELECT
					p.id_przejscia,
					p.data,
					p.notatka,
					p.timeline_data,
					p.id_uzytkownika,
					p.nazwa_stylu,
					p.id_drogi,
					p.synced,
					p.deleted,
					d.nazwa_drogi AS nazwa_drogi,
					d.typ_drogi AS typ_drogi,
					COALESCE(
						ds.skala_linowa,
						dt.skala_linowa,
						db.skala_boulderowa
					) AS wycena
				 FROM Przejscia p
				 LEFT JOIN Drogi d ON p.id_drogi = d.id_drogi
				 LEFT JOIN Drogi_sportowe_szczegoly ds ON ds.id_drogi = d.id_drogi AND d.typ_drogi = 'sportowa'
				 LEFT JOIN Trady_szczegoly dt ON dt.id_drogi = d.id_drogi AND d.typ_drogi = 'trad'
				 LEFT JOIN Bouldery_szczegoly db ON db.id_drogi = d.id_drogi AND d.typ_drogi = 'boulder'
				 WHERE p.id_uzytkownika = ? AND p.deleted = 0
				 ORDER BY p.data DESC, p.id_przejscia DESC`,
				[currentUserId],
			);
        } catch (error: any) {
        	throw new Error(`Wystąpił błąd podczas pobierania przejść z bazy danych. ${error}`);
        }
    }
	async getAscent(ascentId: string, ownerId?: number): Promise<Ascent> {
		const userId = await this.getUserId();
		
		if (ownerId && ownerId !== Number(userId)) {
            // getAscent from ApiAscentRepository
            return await super.getAscent(ascentId); 
        }
		try {    
			const localResult = await this.db.getFirstAsync<Ascent>(
			`SELECT
				p.id_przejscia,
				p.data,
				p.notatka,
				p.timeline_data,
				p.id_uzytkownika,
				p.nazwa_stylu,
				p.id_drogi,
				p.synced,
				p.deleted,
				d.nazwa_drogi AS nazwa_drogi,
				d.typ_drogi AS typ_drogi,
				COALESCE(
					ds.skala_linowa,
					dt.skala_linowa,
					db.skala_boulderowa
				) AS wycena
			 FROM Przejscia p
			 LEFT JOIN Drogi d ON p.id_drogi = d.id_drogi
			 LEFT JOIN Drogi_sportowe_szczegoly ds ON ds.id_drogi = d.id_drogi AND d.typ_drogi = 'sportowa'
			 LEFT JOIN Trady_szczegoly dt ON dt.id_drogi = d.id_drogi AND d.typ_drogi = 'trad'
			 LEFT JOIN Bouldery_szczegoly db ON db.id_drogi = d.id_drogi AND d.typ_drogi = 'boulder'
			 WHERE p.id_przejscia = ? AND p.deleted = 0`,
			[ascentId]);

			if (localResult) {
                return localResult; 
            }
        } catch (error: any) {
        	throw new Error("Wystąpił błąd podczas pobierania szczegułów przejscia.");
        }
		// FALLBACK - try get it from api if not found in local database 
		return await super.getAscent(ascentId);
	}
	async getStyles(): Promise<AscentStyle[]> {
        try {    
			return await this.db.getAllAsync<AscentStyle>(`SELECT nazwa_stylu FROM Style_przejscia ORDER BY nazwa_stylu ASC`);
        } catch (error: any) {
        	throw new Error("Wystąpił błąd podczas pobierania mozliwych styli z bazy danych.");
        }
	}
	async deleteAscent(ascentId: string): Promise<void> {
		try {
            await this.markAsDeletedLocal(ascentId);
            try {
                await super.deleteAscent(ascentId); 
                await this.deleteAscentPermanently(ascentId);
            } catch (networkError) {
                console.log(`Usunięto tylko lokalnie. Czeka na sync. ID: ${ascentId}`);
            }
        } catch (sqliteError) {
            throw new Error("Krytyczny błąd: nie udało się usunąć przejścia lokalnie.");
        }
	}

	async addAscent(ascent: Ascent): Promise<void>{
		try{
			await this.addAscentLocal(ascent);
			try {
				await super.addAscent(ascent);
				await this.markAsSynced(ascent.id_przejscia)
			} catch (networkError) {
                console.log(`Dodano tylko lokalnie. Czeka na sync. ID: ${ascent.id_przejscia}`);
            }
		} catch (sqliteError) {
			throw new Error(`Krytyczny błąd: nie udało się dodać przejścia lokalnie. ${sqliteError}`);
		}
	}

	// private helpers

    private async markAsDeletedLocal(ascentId: string) {
        await this.db.runAsync(
            "UPDATE Przejscia SET deleted = 1, synced = 0 WHERE id_przejscia = ?",
            [ascentId],
        );
    }
    private async deleteAscentPermanently(ascentId: string) {
        await this.db.runAsync("DELETE FROM Przejscia WHERE id_przejscia = ?", [
            ascentId,
        ]);
    }
	private async addAscentLocal(ascent: Ascent) {
        await this.db.runAsync(
            "INSERT INTO Przejscia (id_przejscia, data, notatka, timeline_data, id_uzytkownika, nazwa_stylu, id_drogi, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                ascent.id_przejscia,
                ascent.data,
                ascent.notatka,
                String(ascent.timeline_data),
                ascent.id_uzytkownika,
                ascent.nazwa_stylu,
                ascent.id_drogi,
                ascent.synced ?? 1,
                ascent.deleted ?? 0,
            ],
        );
    }
	private async markAsSynced(ascentId: string) {
        await this.db.runAsync(
            "UPDATE Przejscia SET synced = 1 WHERE id_przejscia = ?",
            [ascentId],
        );
    }

	// piblic helpers

	async getUnsyncedAscents(userId: number): Promise<Ascent[]> {
		return await this.db.getAllAsync<Ascent>(
			"SELECT * FROM Przejscia WHERE id_uzytkownika = ? AND synced = 0 AND deleted = 0",
			[userId],
		);
	}
	async getUnsyncedDeletions(userId: number): Promise<Ascent[]> {
		return await this.db.getAllAsync<Ascent>(
			"SELECT * FROM Przejscia WHERE id_uzytkownika = ? AND synced = 0 AND deleted = 1",
			[userId],
		);
	}
}
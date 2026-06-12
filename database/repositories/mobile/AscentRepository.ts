import api from "../../../lib/api/client";
import { ApiAscentRepository  } from "../api/APIAscentRepository";
import { Ascent, AscentStyle, UserStats } from '../../../types/ascent';
import { getCurrentUserId } from "../../../lib/utils/authStorage"
import { SQLiteDatabase } from "expo-sqlite";


const LINEAR_GRADE_ORDER = ["3","4","4+","5a","5a+","5b","5b+","5c","5c+","6a","6a+","6b","6b+","6c","6c+","7a","7a+","7b","7b+","7c","7c+","8a","8a+","8b","8b+","8c","8c+","9a","9a+"];
const BOULDER_GRADE_ORDER = ["4","4+","5","5+","6a","6a+","6b","6b+","6c","6c+","7a","7a+","7b","7b+","7c","7c+","8a","8a+"];

export class MobileAscentRepository extends ApiAscentRepository  {
    private db: SQLiteDatabase;

    constructor(db: SQLiteDatabase) {
		super();
        this.db = db;
    }

	async getUserStats(userId: number, signal?: AbortSignal): Promise<UserStats> {
		try {
			// 1. Ogólne liczniki
			const counts = await this.db.getFirstAsync<{
				total: number, 
				sport: number, 
				trad: number, 
				boulder: number
			}>(
				`SELECT 
					COUNT(*) as total,
					COUNT(CASE WHEN d.typ_drogi = 'sportowa' THEN 1 END) as sport,
					COUNT(CASE WHEN d.typ_drogi = 'trad' THEN 1 END) as trad,
					COUNT(CASE WHEN d.typ_drogi = 'boulder' THEN 1 END) as boulder
				 FROM Przejscia p
				 JOIN Drogi d ON p.id_drogi = d.id_drogi
				 WHERE p.id_uzytkownika = ? AND p.deleted = 0`,
				[userId]
			);

			// 2. Najlepsze przejścia (pobieramy potencjalnych kandydatów i wybieramy w TS)
			const bestSport = await this.getBestAscentLocal(userId, 'sportowa', LINEAR_GRADE_ORDER);
			const bestTrad = await this.getBestAscentLocal(userId, 'trad', LINEAR_GRADE_ORDER);
			const bestBoulder = await this.getBestAscentLocal(userId, 'boulder', BOULDER_GRADE_ORDER);

			// 3. Dane do wykresu wycen (Top 7)
			const gradeChart = await this.db.getAllAsync<{label: string, count: number}>(
				`SELECT 
					COALESCE(ds.skala_linowa, dt.skala_linowa, db.skala_boulderowa) as label,
					COUNT(*) as count
				 FROM Przejscia p
				 JOIN Drogi d ON p.id_drogi = d.id_drogi
				 LEFT JOIN Drogi_sportowe_szczegoly ds ON ds.id_drogi = d.id_drogi AND d.typ_drogi = 'sportowa'
				 LEFT JOIN Trady_szczegoly dt ON dt.id_drogi = d.id_drogi AND d.typ_drogi = 'trad'
				 LEFT JOIN Bouldery_szczegoly db ON db.id_drogi = d.id_drogi AND d.typ_drogi = 'boulder'
				 WHERE p.id_uzytkownika = ? AND p.deleted = 0
				 GROUP BY label
				 ORDER BY count DESC, label DESC
				 LIMIT 7`,
				[userId]
			);

			// 4. Dane do wykresu tygodniowego (ostatnie 12 tygodni)
			// SQLite nie ma tak prostych funkcji daty, więc pobieramy surowe dane z ostatnich 84 dni i grupujemy w TS
			const weeklyChartRaw = await this.db.getAllAsync<{data: string}>(
				`SELECT data FROM Przejscia 
				 WHERE id_uzytkownika = ? AND deleted = 0 
				 AND data >= date('now', '-84 days')`,
				[userId]
			);
			
			const weeklyChart = this.processWeeklyChart(weeklyChartRaw.map(r => r.data));

			return {
				totalCount: counts?.total || 0,
				sportCount: counts?.sport || 0,
				tradCount: counts?.trad || 0,
				boulderCount: counts?.boulder || 0,
				bestSport: bestSport || undefined,
				bestTrad: bestTrad || undefined,
				bestBoulder: bestBoulder || undefined,
				gradeChart: gradeChart,
				weeklyChart: weeklyChart
			};
		} catch (error) {
			console.error("Błąd podczas generowania statystyk lokalnych:", error);
			// Jeśli błąd lokalny, spróbuj pobrać z API
			return await super.getUserStats(userId, signal);
		}
	}

	private async getBestAscentLocal(userId: number, type: string, order: string[]): Promise<Ascent | null> {
		const candidates = await this.db.getAllAsync<Ascent>(
			`SELECT p.*, d.nazwa_drogi, d.typ_drogi,
				COALESCE(ds.skala_linowa, dt.skala_linowa, db.skala_boulderowa) as wycena
			 FROM Przejscia p
			 JOIN Drogi d ON p.id_drogi = d.id_drogi
			 LEFT JOIN Drogi_sportowe_szczegoly ds ON ds.id_drogi = d.id_drogi AND d.typ_drogi = 'sportowa'
			 LEFT JOIN Trady_szczegoly dt ON dt.id_drogi = d.id_drogi AND d.typ_drogi = 'trad'
			 LEFT JOIN Bouldery_szczegoly db ON db.id_drogi = d.id_drogi AND d.typ_drogi = 'boulder'
			 WHERE p.id_uzytkownika = ? AND d.typ_drogi = ? AND p.deleted = 0`,
			[userId, type]
		);

		if (candidates.length === 0) return null;

		return candidates.reduce((best, current) => {
			const bestIdx = order.indexOf(best.wycena || "");
			const currentIdx = order.indexOf(current.wycena || "");
			
			if (currentIdx > bestIdx) return current;
			if (currentIdx === bestIdx && current.data > best.data) return current;
			return best;
		}, candidates[0]);
	}

	private processWeeklyChart(dates: string[]) {
		const now = new Date();
		const day = now.getDay();
		const mondayShift = day === 0 ? -6 : 1 - day;
		const thisWeekStart = new Date(now);
		thisWeekStart.setHours(0, 0, 0, 0);
		thisWeekStart.setDate(thisWeekStart.getDate() + mondayShift);

		const weekStarts: Date[] = [];
		for (let i = 11; i >= 0; i -= 1) {
			const start = new Date(thisWeekStart);
			start.setDate(start.getDate() - i * 7);
			weekStarts.push(start);
		}

		const toWeekKey = (date: Date) => {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		};
		const allowedWeekKeys = new Set(weekStarts.map(d => toWeekKey(d)));
		const weeklyCounts = new Map<string, number>();

		dates.forEach(dateStr => {
			const d = new Date(dateStr);
			const dDay = d.getDay();
			const dShift = dDay === 0 ? -6 : 1 - dDay;
			const ws = new Date(d);
			ws.setHours(0, 0, 0, 0);
			ws.setDate(ws.getDate() + dShift);
			const key = toWeekKey(ws);
			if (allowedWeekKeys.has(key)) {
				weeklyCounts.set(key, (weeklyCounts.get(key) || 0) + 1);
			}
		});

		return weekStarts.map(ws => ({
			label: toWeekKey(ws),
			count: weeklyCounts.get(toWeekKey(ws)) || 0
		}));
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
		const userId = await getCurrentUserId();
		
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

	async addAscentsLocal(ascents: Ascent[]): Promise<void>{
		try{
			await this.addAscentsLocalBulkQuery(ascents);
		} catch (sqliteError) {
			throw new Error(`Krytyczny błąd: nie udało się dodać przejść lokalnie. ${sqliteError}`);
		}
	}


	

	// private helpers

    private async markAsDeletedLocal(ascentId: string) {
        await this.db.runAsync(
            "UPDATE Przejscia SET deleted = 1, synced = 0 WHERE id_przejscia = ?",
            [ascentId],
        );
    }

	private async addAscentLocal(ascent: Ascent) {
        await this.db.runAsync(
            "INSERT INTO Przejscia (id_przejscia, data, notatka, timeline_data, id_uzytkownika, nazwa_stylu, id_drogi, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                ascent.id_przejscia,
                ascent.data,
                ascent.notatka,
                ascent.timeline_data ? JSON.stringify(ascent.timeline_data) : null,
                ascent.id_uzytkownika,
                ascent.nazwa_stylu,
                ascent.id_drogi,
                ascent.synced ?? 1,
                ascent.deleted ?? 0,
            ],
        );
    }

	private async addAscentsLocalBulkQuery(ascents: Ascent[]) {
		if (ascents.length === 0) return;

		const placeholders = ascents.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
		
		const query = `INSERT INTO Przejscia (id_przejscia, data, notatka, timeline_data, id_uzytkownika, nazwa_stylu, id_drogi, synced, deleted) VALUES ${placeholders}`;

		const values: any[] = [];
		for (const ascent of ascents) {
			values.push(
				ascent.id_przejscia,
				ascent.data,
				ascent.notatka,
				ascent.timeline_data ? JSON.stringify(ascent.timeline_data) : null,
				ascent.id_uzytkownika,
				ascent.nazwa_stylu,
				ascent.id_drogi,
				ascent.synced ?? 1,
				ascent.deleted ?? 0
			);
		}

    await this.db.runAsync(query, values);
}

	// public helpers

	async getAscentsCountLocal(): Promise<number>{
		const userId = await getCurrentUserId();
		const result =  await this.db.getFirstAsync<{count: number}>(
			"SELECT COUNT(*) as count FROM Przejscia WHERE id_uzytkownika = ?", 
			[userId]
		);
		return result?.count ?? 0;
	}
	async getAscentsUUID(): Promise<string[]>{
		const userId = await getCurrentUserId();
		const rows = await this.db.getAllAsync<{ id_przejscia: string }>(
				"SELECT id_przejscia FROM Przejscia WHERE id_uzytkownika = ?", 
				[userId]
			);
		return rows.map(row => row.id_przejscia);
	}



    async markAsSynced(ascentId: string) {
        await this.db.runAsync(
            "UPDATE Przejscia SET synced = 1 WHERE id_przejscia = ?",
            [ascentId],
        );
    }

    async deleteAscentPermanently(ascentId: string) {
        await this.db.runAsync("DELETE FROM Przejscia WHERE id_przejscia = ?", [
            ascentId,
        ]);
    }

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
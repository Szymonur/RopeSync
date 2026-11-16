import api from "../../../lib/api/client";
import { IAscentRepository } from "../interfaces/IAscentRepository";
import { Ascent, AscentStyle, UserStats, AscenFeedItem } from '../../../types/ascent';

// Błąd odpowiedzi HTTP z zachowanym kodem statusu (potrzebny m.in. synchronizacji,
// żeby odróżnić błąd trwały 4xx od chwilowego braku sieci / 5xx)
export class ApiRequestError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "ApiRequestError";
        this.status = status;
    }
}

export class ApiAscentRepository implements IAscentRepository {
	async getAscents(signal?: AbortSignal): Promise<Ascent[]> {
        try {
            const response = await api.get<{ message: string; ascents: Ascent[] }>(`/ascents`, { signal });   
            return response.data.ascents;
        } catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas pobierania przejść.");
            }
            throw new Error("Problem z połączeniem sieciowym.");
        }
    }
	async getAscentsCount(signal?: AbortSignal): Promise<number>{
		try {
			const response = await api.get<{count: number; }>(`/ascents/count`, { signal });
			return response.data.count;
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas pobierania liczby przejść.", error);
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	// Synchronizacja różnicowa: zmiany od kursora (bez kursora - wszystkie przejścia użytkownika)
	async getChanges(since?: string, signal?: AbortSignal): Promise<{ ascents: Ascent[]; deletedIds: string[]; cursor: string }> {
		try {
			const response = await api.get<{ ascents: Ascent[]; deletedIds: string[]; cursor: string }>(
				`/ascents/changes`,
				{ params: since ? { since } : undefined, signal }
			);
			if (!response.data || typeof response.data.cursor !== "string") {
				// Starszy backend: trasa /ascents/:id przechwytuje "changes" i odpowiada czymś innym
				throw new ApiRequestError("Serwer nie obsługuje synchronizacji różnicowej.", 404);
			}
			return {
				ascents: response.data.ascents ?? [],
				deletedIds: response.data.deletedIds ?? [],
				cursor: response.data.cursor,
			};
		} catch (error: any) {
			if (error instanceof ApiRequestError) throw error;
			if (error.response) {
				throw new ApiRequestError("Wystąpił błąd podczas pobierania zmian przejść.", error.response.status);
			}
			throw new Error("Problem z połączeniem sieciowym.");
		}
	}

	// Różnica względem serwera: przejścia nieznane klientowi + ID, których serwer już nie ma
	async getSyncDiff(ascentsUUID: string[], signal?: AbortSignal): Promise<{ ascents: Ascent[]; missingIds: string[] }> {
		try {
			const response = await api.post<{ message: string; ascents: Ascent[]; missingIds?: string[] }>(
				`/ascents/sync-diff`,
				{ ascentsUUID }, { signal }
			);
			return {
				ascents: response.data.ascents ?? [],
				missingIds: response.data.missingIds ?? [],
			};
		} catch (error: any) {
			if (error.response) {
				throw new Error("Wystąpił błąd podczas wyznaczania różnic synchronizacji.");
			}
			throw new Error("Problem z połączeniem sieciowym.");
		}
	}

	async getUnsynchronisedAscents(ascentsUUID: string[], signal?: AbortSignal): Promise<Ascent[]>{
	     try {
            const response = await api.post<{ message: string; ascents: Ascent[] }>(
                `/ascents/sync-diff`, 
                { ascentsUUID }, { signal }
            );
            return response.data.ascents;
        } catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas wyznaczania różnic synchronizacji.");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
		}
	}


	async getAscent(ascentId: string, ownerId?: number, signal?: AbortSignal): Promise<Ascent> {
		try {
			const response = await api.get<{message: string; ascent: Ascent; }>(`/ascents/${ascentId}`, { signal });
			return response.data.ascent;
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas pobierania szczegułów przejscia.");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	async getStyles(): Promise<AscentStyle[]> {
		try {
			const response = await api.get<{message: string; styles: AscentStyle[]; }>(`/dictionaries/styles`);
			return response.data.styles;
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas pobierania mozliwych styli przejść.");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	async deleteAscent(ascentId: string): Promise<void> {
		try {
			await api.delete<{message: string}>(`/ascents/${ascentId}`);
		} catch (error: any) {
            // Przejścia już nie ma na serwerze - cel osiągnięty (idempotentne usuwanie)
            if (error.response?.status === 404) return;
            if (error.response) {
                throw new Error("Wystąpił błąd podczas usuwania przejscia.");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	async addAscent(ascent: Ascent): Promise<void> {
		try {
			await api.post<{message: string}>(`/ascents/`, ascent);
		} catch (error: any) {
            if (error.response) {
                throw new ApiRequestError("Wystąpił błąd podczas dodawania przejscia.", error.response.status);
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	async getUserStats(userId: number, signal?: AbortSignal): Promise<UserStats>{
		try {
			const response = await api.get<{message: string; stats: UserStats; }>(`/users/${userId}/stats`, { signal });
			return response.data.stats;
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas pobierania statystyk uzytkownika.");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	async getFollowingFeed(signal?: AbortSignal): Promise<AscenFeedItem[]> {
		try {
			const response = await api.get<{message: string; feed: AscenFeedItem[]; }>("/users/me/feed",  { signal });
			return response.data.feed;
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas pobierania feedu");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
}
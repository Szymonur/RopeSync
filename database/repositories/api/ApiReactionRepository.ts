import api from "../../../lib/api/client";
import { IReactionRepository } from "../interfaces/IReactionRepository";
import { Reaction, ReactionNotification } from "../../../types/reaction";

export class ApiReactionRepository implements IReactionRepository {
	async addReaction(ascentId: string, signal?: AbortSignal): Promise<void> {
		try {
			await api.post<{message: string}>(`/ascents/${ascentId}/reactions`, { signal });
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas dodawnia reakcji.");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	async deleteReaction(ascentId: string, signal?: AbortSignal): Promise<void> {
		try {
			await api.delete<{message: string}>(`/ascents/${ascentId}/reactions`, { signal });
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas usuwania reakcji.");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	async getUnreadReactions(): Promise<ReactionNotification[]> {
		try {
			const { data } = await api.get<{ 
				message: string; 
				reactions: ReactionNotification[];}>
				("/notifications", { params: { unread: true } });
			return data.reactions;
		} catch (error: any) {
			if (error.response) {
				throw new Error("Wystąpił błąd podczas pobierania nieprzeczytanych reakcji.");
			}
			throw new Error("Problem z połączeniem sieciowym.");
		}
	}
// /unread/count
	async getUnreadCount(): Promise<number> {
		try {
			const { data } = await api.get<{ 
				count: number; }>
				("/notifications/unread/count");
			return data.count;
		} catch (error: any) {
			if (error.response) {
				throw new Error("Wystąpił błąd podczas pobierania nieprzeczytanych reakcji.");
			}
			throw new Error("Problem z połączeniem sieciowym.");
		}
	}

	async markAllAsRead(): Promise<void> {
		try {
			await api.patch("/notifications");
		} catch (error: any) {
			if (error.response) {
				throw new Error("Wystąpił błąd podczas oznaczania reakcji jako przeczytane.");
			}
			throw new Error("Problem z połączeniem sieciowym.");
		}
	}

	async getNotifications(): Promise<ReactionNotification[]> {
		try {
			const { data } = await api.get<{
				message: string;
				notifications: ReactionNotification[];
			}>("/notifications");
			
			return data.notifications;
		} catch (error: any) {
			if (error.response) {
				throw new Error("Wystąpił błąd podczas pobierania powiadomień.");
			}
			throw new Error("Problem z połączeniem sieciowym.");
		}
	}

	async getReactionsForAscent(ascentId: string): Promise<Reaction[]> {
		try {
			const { data } = await api.get<{
				message: string;
				reactions: Reaction[];
			}>(`/ascents/${ascentId}/reactions`);
			return data.reactions;
		} catch (error: any) {
			if (error.response) {
				throw new Error("Wystąpił błąd podczas pobierania reakcji dla przejścia.");
			}
			throw new Error("Problem z połączeniem sieciowym.");
		}
	}
}

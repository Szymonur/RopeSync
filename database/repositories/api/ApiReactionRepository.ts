import api from "../../../lib/api/client";
import { IReactionRepository } from "../interfaces/IReactionRepository";
import { Reaction, ReactionNotification } from "../../../types/reaction";

export class ApiReactionRepository implements IReactionRepository {
	async toggleReaction(ascentId: string, signal?: AbortSignal): Promise<void> {
		try {
			await api.post<{message: string}>(`/ascents/${ascentId}/toggle-reaction`, { signal });
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas przełączania reakcji.");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}

	async getUnreadReactions(): Promise<ReactionNotification[]> {
		try {
			const { data } = await api.get<{
				message: string;
				reactions: ReactionNotification[];
			}>("/profile/reactions/unread");
			return data.reactions;
		} catch (error: any) {
			if (error.response) {
				throw new Error("Wystąpił błąd podczas pobierania nieprzeczytanych reakcji.");
			}
			throw new Error("Problem z połączeniem sieciowym.");
		}
	}

	async getUnreadCount(currentUserId: number): Promise<number> {
		// Ta metoda w wersji API może pobierać dane z profilu lub dedykowanego endpointu
		// Na razie implementujemy to jako getUnreadReactions().length lub rzucamy błąd jeśli nie ma endpointu
		const reactions = await this.getUnreadReactions();
		return reactions.length;
	}

	async markAllAsRead(currentUserId: number): Promise<void> {
		try {
			await api.post("/profile/reactions/mark-as-read");
		} catch (error: any) {
			if (error.response) {
				throw new Error("Wystąpił błąd podczas oznaczania reakcji jako przeczytane.");
			}
			throw new Error("Problem z połączeniem sieciowym.");
		}
	}

	async getNotifications(currentUserId: number): Promise<ReactionNotification[]> {
		try {
			const { data } = await api.get<{
				message: string;
				notifications: ReactionNotification[];
			}>("/profile/reactions/notifications");
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

	async addReaction(reaction: Reaction): Promise<void> {
		throw new Error("Method addReaction not implemented for API repository.");
	}

	async removeReaction(userId: number, ascentId: string): Promise<void> {
		throw new Error("Method removeReaction not implemented for API repository.");
	}
}

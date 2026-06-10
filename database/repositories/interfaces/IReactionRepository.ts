import { Reaction, ReactionNotification } from "../../../types/reaction";

export interface IReactionRepository {
	addReaction(ascentId: string, signal?: AbortSignal): Promise<void>;
	deleteReaction(ascentId: string, signal?: AbortSignal): Promise<void>;
	getUnreadReactions(): Promise<ReactionNotification[]>;
	getUnreadCount(): Promise<number>;
	markAllAsRead(): Promise<void>;
	getNotifications(): Promise<ReactionNotification[]>;
	getReactionsForAscent(ascentId: string): Promise<Reaction[]>;
}

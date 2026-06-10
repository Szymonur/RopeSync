import { Reaction, ReactionNotification } from "../../../types/reaction";

export interface IReactionRepository {
	toggleReaction(ascentId: string, signal?: AbortSignal): Promise<void>;
	getUnreadReactions(): Promise<ReactionNotification[]>;
	getUnreadCount(currentUserId: number): Promise<number>;
	markAllAsRead(currentUserId: number): Promise<void>;
	getNotifications(currentUserId: number): Promise<ReactionNotification[]>;
	getReactionsForAscent(ascentId: string): Promise<Reaction[]>;
}

import { Ascent, AscentStyle, UserStats, AscenFeedItem } from "../../../types/ascent";

export interface IAscentRepository {
	getAscents(signal?: AbortSignal): Promise<Ascent[]>;
	getAscent(ascentId: string, ownerId?: number, signal?: AbortSignal): Promise<Ascent>;
	getStyles(): Promise<AscentStyle[]>;
	deleteAscent(ascentId: string): Promise<void>;
	addAscent(ascent: Ascent): Promise<void>;
	getUserStats(userId: number, signal?: AbortSignal): Promise<UserStats>
	getFollowingFeed(signal?: AbortSignal): Promise<AscenFeedItem[]>;
}
import { LoginResponse, SearchUser } from '../../../types/user';

export interface IUserRepository {
	login(username: string, password: string): Promise<LoginResponse>;
	register(username: string, password: string, email: string, firstName: string, lastName: string): Promise<void>;
	followUser(userId: number): Promise<void>;
	unfollowUser(userId: number): Promise<void>;
	searchUsers(query: string): Promise<SearchUser[]>;
}

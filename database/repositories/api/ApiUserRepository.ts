import api from "../../../lib/api/client";
import { IUserRepository } from "../interfaces/IUserRepository";
import { LoginResponse, SearchUser, User } from '../../../types/user';

export class ApiUserRepository implements IUserRepository {

    async login(username: string, password: string): Promise<LoginResponse> {
        try {
            const response = await api.post<LoginResponse>(`/auth/login`, { username, password });            
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                throw new Error("Błędne dane logowania!");
            }
            throw new Error(error.response?.data?.message || "Problem z połączeniem sieciowym");
        }
    }

    async register(username: string, password: string, email: string, firstName: string, lastName: string): Promise<void> {
        try {
            const response = await api.post(`/auth/register`, { username, password, email, firstName, lastName });
			return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw new Error(error.response.data.message || "Błąd podczas rejestracji.");
            }
            throw new Error("Brak połączenia z serwerem lub nieznany błąd.");
        }
    }

    async followUser(userId: number): Promise<void> {
        await api.post(`/users/${userId}/followers`);
    }

    async unfollowUser(userId: number): Promise<void> {
        await api.delete(`/users/${userId}/followers`);
    }

    async searchUsers(phrase: string): Promise<SearchUser[]> {
        const { data } = await api.get<{
            message: string;
            users: SearchUser[];
        }>("/users", {
            params: { q: phrase },
        });

        return data.users;
    }
	async getCurrentUser(): Promise<User>{
		const { data } = await api.get<{
            message: string;
            user: User;
        }>("/users/me");

		return data.user;	
	}
}
import { LoginResponse } from '../../../types/user';

export interface IUserRepository {
	login(username: string, password: string): Promise<LoginResponse>;
	register(username: string, password: string, email: string, firstName: string, lastName: string): Promise<void>;
}

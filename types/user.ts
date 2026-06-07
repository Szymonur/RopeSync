export interface User {
    userId: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
}

export interface LoginResponse extends User {
	refreshToken: string;
	accessToken: string;
}
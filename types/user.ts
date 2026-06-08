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

export interface SearchUser {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    isFollowing: boolean;
}
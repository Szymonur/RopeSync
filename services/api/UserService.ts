import api from "../../lib/api/client";

export interface UserProfile {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
}

export const UserService = {
    // Pobiera profil użytkownika o podanym ID
    getUserProfile: async (userId: string): Promise<UserProfile> => {
        const { data } = await api.get<{ message: string; user: UserProfile }>(
            `/profile/${userId}`,
        );
        return data.user;
    },

    // Pobiera profil aktualnie zalogowanego użytkownika

    getCurrentUser: async (): Promise<UserProfile> => {
        const { data } = await api.get<{ message: string; user: UserProfile }>(
            "/profile",
        );
        return data.user;
    },
};

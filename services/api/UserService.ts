import api from "../../lib/api/client";

export interface UserProfile {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface SearchUser {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    isFollowing: boolean;
}

export interface FollowingFeedItem {
    ascentId: string;
    date: string;
    style: string;
    routeId: string;
    routeName: string;
    routeType: string;
    grade: string | null;
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
}

export interface CreateAscentPayload {
    data: string;
    id_drogi: string;
    notatka: string;
    nazwa_stylu?: string;
}

export interface AscentRouteOption {
    id_drogi: string;
    nazwa_drogi: string;
    typ_drogi: string;
    wycena: string | null;
}

export interface MyAscentItem {
    id_przejscia: string;
    data: string;
    notatka: string;
    uri_timeline: string | null;
    id_uzytkownika: number;
    nazwa_stylu: string;
    id_drogi: string;
    nazwa_drogi: string | null;
    typ_drogi: string | null;
    wycena: string | null;
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

    searchUsers: async (phrase: string): Promise<SearchUser[]> => {
        const { data } = await api.get<{ message: string; users: SearchUser[] }>(
            "/profile/search/users",
            {
                params: { q: phrase },
            },
        );

        return data.users;
    },

    followUser: async (userId: number): Promise<void> => {
        await api.post(`/follow/${userId}`);
    },

    unfollowUser: async (userId: number): Promise<void> => {
        await api.delete(`/unfollow/${userId}`);
    },

    getFollowingFeed: async (): Promise<FollowingFeedItem[]> => {
        const { data } = await api.get<{ message: string; feed: FollowingFeedItem[] }>(
            "/follow/me/feed",
        );

        return data.feed;
    },

    createAscent: async (payload: CreateAscentPayload): Promise<void> => {
        await api.post("/ascents", payload);
    },

    getAscentRoutes: async (): Promise<AscentRouteOption[]> => {
        const { data } = await api.get<{ message: string; routes: AscentRouteOption[] }>(
            "/ascents/routes",
        );

        return data.routes;
    },

    getMyAscents: async (): Promise<MyAscentItem[]> => {
        const { data } = await api.get<{ message: string; ascents: MyAscentItem[] }>(
            "/ascents/me",
        );

        return data.ascents;
    },
};

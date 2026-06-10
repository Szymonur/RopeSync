import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "../../contexts/RepositoryContext";
import { useAuth } from "../../contexts/AuthContext";

export const useFollowUser = () => {
    const { userRepository } = useRepositories();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: number) => userRepository.followUser(userId),
        onSuccess: () => {
            // Możesz tutaj inwalidować cache profilu użytkownika lub listy obserwowanych
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            queryClient.invalidateQueries({ queryKey: ['following-feed'] });
            queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
        },
    });
};

export const useUnfollowUser = () => {
    const { userRepository } = useRepositories();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: number) => userRepository.unfollowUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            queryClient.invalidateQueries({ queryKey: ['following-feed'] });
            queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
        },
    });
};

export const useSearchUsers = (query: string, options?: { enabled?: boolean }) => {
    const { userRepository } = useRepositories();

    return useQuery({
        queryKey: ['users', 'search', query],
        queryFn: () => userRepository.searchUsers(query),
        enabled: query.trim().length >= 2 && (options?.enabled !== false),
        ...options,
    });
};

export const useCurrentUser = (userId: number) =>{
    const { userRepository } = useRepositories();

    return useQuery({
        queryKey: ['current-user', userId],
        queryFn: () => userRepository.getCurrentUser(),
		staleTime: 1000 * 60 * 60,
        enabled: !!userId,
    });
}

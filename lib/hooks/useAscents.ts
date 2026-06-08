import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback } from 'react';
import { useRepositories } from "../../contexts/RepositoryContext";
import { Ascent, UserStats, AscenFeedItem } from "../../types/ascent";

export const useAscents = () => {
    const { ascentRepository } = useRepositories();

    return useQuery({
        queryKey: ['ascents'],
        queryFn: ({ signal }) => ascentRepository.getAscents(signal),
        staleTime: 1000 * 60 * 5, 
    });
};

export const useAscentDetails = (ascentId: string, ownerId?: number) => {
    const { ascentRepository } = useRepositories();

    return useQuery({
        queryKey: ['ascent', ascentId],
        queryFn: ({ signal }) => ascentRepository.getAscent(ascentId, ownerId, signal),
        enabled: !!ascentId,
    });
};

export const useUserStats = (userId: number) => {
    const { ascentRepository } = useRepositories();

    return useQuery({
        queryKey: ['user-stats', userId],
        queryFn: ({ signal }) => ascentRepository.getUserStats(userId, signal),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minut
    });
};

export const useAddAscent = () => {
    const { ascentRepository } = useRepositories();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newAscent: Ascent) => ascentRepository.addAscent(newAscent),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ascents'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats', variables.id_uzytkownika] });
        },
    });
};

export const useDeleteAscent = () => {
    const { ascentRepository } = useRepositories();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ascentId: string) => ascentRepository.deleteAscent(ascentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ascents'] });
        },
    });
};

export const useAscentStyles = () => {
    const { ascentRepository } = useRepositories();

    return useQuery({
        queryKey: ['ascent-styles'],
        queryFn: () => ascentRepository.getStyles(),
        staleTime: 1000 * 60 * 60,
    });
};

export const useFollowingFeed = () => {
    const { ascentRepository } = useRepositories();

    return useQuery({
        queryKey: ['following-feed'],
        queryFn: ({ signal }) => ascentRepository.getFollowingFeed(signal),
        staleTime: 1000 * 60 * 5, // 5 minut
    });
};

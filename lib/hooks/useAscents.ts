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

export const useToggleReaction = () => {
    const { ascentRepository } = useRepositories();
    const queryClient = useQueryClient();

    // Referencje do trzymania stanu liczników bez powodowania re-renderów
    const clickCounts = useRef<Record<string, number>>({});
	const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // Sama mutacja zajmuje się teraz tylko wysłaniem danych i obsługą ewentualnego błędu
    const mutation = useMutation({
        mutationFn: (ascentId: string) => ascentRepository.toggleReaction(ascentId),
        onError: (err, ascentId) => {
            // W razie błędu serwera, cofamy zmianę w cache
            queryClient.setQueryData<AscenFeedItem[]>(['following-feed'], (oldFeed) => {
                if (!oldFeed) return [];
                return oldFeed.map((item) =>
                    item.id_przejscia === ascentId
                        ? { ...item, hasReacted: !item.isLiked }
                        : item
                );
            });
        },
    });

    const toggleReaction = useCallback((ascentId: string, options?: { onError?: () => void }) => {
            // NATYCHMIASTOWA ZMIANA UI
            queryClient.setQueryData<AscenFeedItem[]>(['following-feed'], (oldFeed) => {
                if (!oldFeed) return [];
                return oldFeed.map((item) =>
                    item.id_przejscia === ascentId
                        ? { ...item, isLiked: !item.isLiked }
                        : item
                );
            });

            clickCounts.current[ascentId] = (clickCounts.current[ascentId] || 0) + 1;

            // DEBOUNCE (Resetujemy stary timer, jeśli użytkownik szybko klika)
            if (timeoutRefs.current[ascentId]) {
                clearTimeout(timeoutRefs.current[ascentId]);
            }

            // USTAWIANIE NOWEGO TIMERA
            timeoutRefs.current[ascentId] = setTimeout(() => {
                const totalClicks = clickCounts.current[ascentId];

                // Jeśli kliknięto nieparzystą liczbę razy, wysyłamy request
                if (totalClicks % 2 !== 0) {
                    mutation.mutate(ascentId, {
                        onError: () => {
                            if (options?.onError) options.onError();
                        },
                    });
                }

                // Po wyczyszczeniu akcji, zerujemy licznik dla tego posta
                clickCounts.current[ascentId] = 0;
            }, 800);
        },
        [queryClient, mutation]
    );

    return { toggleReaction };
};

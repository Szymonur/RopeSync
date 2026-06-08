import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback } from 'react';
import { useRepositories } from "../../contexts/RepositoryContext";
import { Reaction, ReactionNotification } from "../../types/reaction";
import { AscenFeedItem } from "../../types/ascent";

export const useReactions = () => {
    const { reactionRepository } = useRepositories();

    const unreadReactions = useQuery({
        queryKey: ['unread-reactions'],
        queryFn: () => reactionRepository.getUnreadReactions(),
        staleTime: 1000 * 60, // 1 minuta
    });

    const notifications = useQuery({
        queryKey: ['notifications'],
        queryFn: () => {
            // Zakładamy że mamy dostęp do userId, np. z innego hooka lub kontekstu
            // Tutaj uproszczone wywołanie (id_uzytkownika powinno być przekazane)
            return reactionRepository.getNotifications(0); 
        },
    });

    return { unreadReactions, notifications };
};

export const useToggleReaction = () => {
	
    const { reactionRepository } = useRepositories();
    const queryClient = useQueryClient();

    const clickCounts = useRef<Record<string, number>>({});
	const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});


    const mutation = useMutation({
        mutationFn: (ascentId: string) => reactionRepository.toggleReaction(ascentId),
        onError: (err, ascentId) => {
            queryClient.setQueryData<AscenFeedItem[]>(['following-feed'], (oldFeed) => {
                if (!oldFeed) return [];
                return oldFeed.map((item) =>
                    item.id_przejscia === ascentId
                        ? { ...item, isLiked: !item.isLiked }
                        : item
                );
            });
        },
    });

    const toggleReaction = useCallback((ascentId: string, options?: { onError?: () => void }) => {
            queryClient.setQueryData<AscenFeedItem[]>(['following-feed'], (oldFeed) => {
                if (!oldFeed) return [];
                return oldFeed.map((item) =>
                    item.id_przejscia === ascentId
                        ? { ...item, isLiked: !item.isLiked }
                        : item
                );
            });

            clickCounts.current[ascentId] = (clickCounts.current[ascentId] || 0) + 1;

            if (timeoutRefs.current[ascentId]) {
                clearTimeout(timeoutRefs.current[ascentId]);
            }

            timeoutRefs.current[ascentId] = setTimeout(() => {
                const totalClicks = clickCounts.current[ascentId];
                if (totalClicks % 2 !== 0) {
                    mutation.mutate(ascentId, {
                        onError: () => {
                            if (options?.onError) options.onError();
                        },
                    });
                }
                clickCounts.current[ascentId] = 0;
            }, 800);
        },
        [queryClient, mutation]
    );

    return { toggleReaction };
};

export const useUnreadReactionsCount = (userId: number) => {
    const { reactionRepository } = useRepositories();

    return useQuery({
        queryKey: ['unread-reactions-count', userId],
        queryFn: () => reactionRepository.getUnreadCount(userId),
        enabled: !!userId,
        refetchInterval: 1000 * 60 * 2, // co 2 minuty
    });
};

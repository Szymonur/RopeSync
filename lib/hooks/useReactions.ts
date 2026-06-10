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
            return reactionRepository.getNotifications(); 
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
        mutationFn: ({ ascentId, shouldLike }: { ascentId: string; shouldLike: boolean }) => 
            shouldLike ? reactionRepository.addReaction(ascentId) : reactionRepository.deleteReaction(ascentId),
        onError: (err, { ascentId }) => {
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
            let finalLikeState = false;

            queryClient.setQueryData<AscenFeedItem[]>(['following-feed'], (oldFeed) => {
                if (!oldFeed) return [];
                return oldFeed.map((item) => {
                    if (item.id_przejscia === ascentId) {
                        finalLikeState = !item.isLiked;
                        return { ...item, isLiked: finalLikeState };
                    }
                    return item;
                });
            });

            clickCounts.current[ascentId] = (clickCounts.current[ascentId] || 0) + 1;

            if (timeoutRefs.current[ascentId]) {
                clearTimeout(timeoutRefs.current[ascentId]);
            }

            timeoutRefs.current[ascentId] = setTimeout(() => {
                const totalClicks = clickCounts.current[ascentId];
                if (totalClicks % 2 !== 0) {
                    mutation.mutate({ ascentId, shouldLike: finalLikeState }, {
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
        queryFn: () => reactionRepository.getUnreadCount(),
        enabled: !!userId,
        refetchInterval: 1000 * 60 * 2, // co 2 minuty
    });
};

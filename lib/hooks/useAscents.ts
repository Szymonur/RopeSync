import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "../../contexts/RepositoryContext";
import { Ascent } from "../../types/ascent";

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

export const useAddAscent = () => {
    const { ascentRepository } = useRepositories();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newAscent: Ascent) => ascentRepository.addAscent(newAscent),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ascents'] });
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
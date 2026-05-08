import { useQuery } from "@tanstack/react-query";
import { UserService } from "../../services/api/UserService";

// Hook do pobierania profilu dowolnego użytkownika.
// Dane są traktowane jako świeże przez 2 minuty.

export const useProfile = (userId: string) => {
    return useQuery({
        queryKey: ["user", userId],
        queryFn: () => UserService.getUserProfile(userId),
        staleTime: 1000 * 60 * 2, // 2 minuty
        enabled: !!userId, // Wykonaj zapytanie tylko jeśli mamy ID
    });
};

// Hook do pobierania profilu aktualnego użytkownika.

export const useMe = () => {
    return useQuery({
        queryKey: ["user", "me"],
        queryFn: UserService.getCurrentUser,
        staleTime: 1000 * 60 * 5,
    });
};

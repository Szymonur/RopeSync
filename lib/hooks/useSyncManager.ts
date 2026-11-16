import { useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useQueryClient } from "@tanstack/react-query";
import { useNetwork } from "../../contexts/NetworkContext";
import { useAuth } from "../../contexts/AuthContext";
import { MobileAscentRepository } from "../../database/repositories/mobile/AscentRepository";
import { WebAscentRepository } from "../../database/repositories/web/AscentRepository";
import { ApiRequestError } from "../../database/repositories/api/APIAscentRepository";

// 4xx (poza autoryzacją, timeoutem i limitem zapytań) oznacza, że ponawianie nic nie zmieni
const isPermanentError = (error: unknown): error is ApiRequestError => {
    if (!(error instanceof ApiRequestError) || error.status === undefined) return false;
    const { status } = error;
    return status >= 400 && status < 500 && ![401, 403, 408, 429].includes(status);
};

export const useSyncManager = () => {
    const db = useSQLiteContext();
    const { isConnected, isInternetReachable } = useNetwork();
    const { currentUserId } = useAuth();
    const queryClient = useQueryClient();
    const isSyncing = useRef(false);
    const errorsResetForUser = useRef<number | null>(null);

    const syncAscents = useCallback(async () => {
        if (!currentUserId || !isConnected || isSyncing.current) return;

        const userId = Number(currentUserId);
        const repository = new MobileAscentRepository(db);
        const repositoryWeb = new WebAscentRepository();
        let localDataChanged = false;

        try {
            isSyncing.current = true;

            // Raz na uruchomienie aplikacji (i na użytkownika) ponów przejścia odrzucone wcześniej przez serwer
            if (errorsResetForUser.current !== userId) {
                await repository.resetSyncErrors(userId);
                errorsResetForUser.current = userId;
            }

            // 1. Synchronizacja USUWANIA
            const deletions = await repository.getUnsyncedDeletions(userId);
            for (const ascent of deletions) {
                try {
                    // 404 (już usunięte na serwerze) jest traktowane jako sukces w ApiAscentRepository
                    await repositoryWeb.deleteAscent(ascent.id_przejscia);
                    await repository.deleteAscentPermanently(ascent.id_przejscia);
                } catch (error) {
                    console.error(
                        `Błąd podczas usuwania przejścia ${ascent.id_przejscia} z serwera:`,
                        error,
                    );
                }
            }

            // 2. Synchronizacja DODAWANIA
            const unsynced = await repository.getUnsyncedAscents(userId);
            for (const ascent of unsynced) {
                try {
                    await repositoryWeb.addAscent({
                        id_przejscia: ascent.id_przejscia,
                        id_uzytkownika: userId,
                        data: ascent.data,
                        id_drogi: ascent.id_drogi,
                        // Wysyłamy faktyczny timeline zapisany lokalnie (wcześniej szło tu {})
                        timeline_data: ascent.timeline_data ?? {},
                        notatka: ascent.notatka,
                        nazwa_stylu: ascent.nazwa_stylu,
                    });

                    await repository.markAsSynced(ascent.id_przejscia);
                } catch (error) {
                    try {
                        if (isPermanentError(error)) {
                            await repository.markSyncFailed(ascent.id_przejscia, `HTTP ${error.status}`);
                        } else {
                            await repository.recordSyncAttempt(ascent.id_przejscia);
                        }
                    } catch (dbError) {
                        console.error("Nie udało się zapisać statusu synchronizacji:", dbError);
                    }
                    console.error(
                        `Błąd synchronizacji przejścia ${ascent.id_przejscia}:`,
                        error,
                    );
                }
            }

            // 3. Pobranie zmian z serwera (przejścia dodane / usunięte np. przez web)
            try {
                // Wysyłamy tylko ID już zsynchronizowane - dzięki temu "missingIds"
                // nigdy nie obejmie przejść, które dopiero czekają na wysyłkę.
                const syncedIds = await repository.getSyncedAscentIds(userId);
                const { ascents, missingIds } = await repositoryWeb.getSyncDiff(syncedIds);

                const added = await repository.addAscentsLocal(ascents);
                const removed = await repository.removeSyncedAscentsLocal(missingIds);
                if (added > 0 || removed > 0) {
                    localDataChanged = true;
                }
            } catch (error) {
                console.error("Błąd podczas pobierania zmian ze zdalnej bazy danych:", error);
            }
        } catch (error) {
            console.error("Błąd podczas procesu synchronizacji:", error);
        } finally {
            isSyncing.current = false;
        }

        if (localDataChanged) {
            queryClient.invalidateQueries({ queryKey: ["ascents"] });
            queryClient.invalidateQueries({ queryKey: ["user-stats"] });
        }
    }, [db, isConnected, currentUserId, queryClient]);

    // Synchronizacja po odzyskaniu sieci / potwierdzeniu dostępu do internetu / zalogowaniu
    useEffect(() => {
        if (isConnected && isInternetReachable !== false) {
            syncAscents();
        }
    }, [isConnected, isInternetReachable, syncAscents]);

    // Synchronizacja po powrocie aplikacji na pierwszy plan
    useEffect(() => {
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                syncAscents();
            }
        });
        return () => subscription.remove();
    }, [syncAscents]);

    return { syncAscents };
};

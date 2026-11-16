import { useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useQueryClient } from "@tanstack/react-query";
import { useNetwork } from "../../contexts/NetworkContext";
import { useAuth } from "../../contexts/AuthContext";
import { MobileAscentRepository } from "../../database/repositories/mobile/AscentRepository";
import { WebAscentRepository } from "../../database/repositories/web/AscentRepository";
import { ApiRequestError } from "../../database/repositories/api/APIAscentRepository";
import { syncCatalog } from "../../database/catalog/syncCatalog";

// Zapytania React Query oparte o lokalny katalog - do odświeżenia po jego podmianie
const CATALOG_QUERY_KEYS = ["regions", "region", "sectors", "sector", "rocks", "rock", "routes", "route", "ascent-styles"];

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
        let catalogChanged = false;

        try {
            isSyncing.current = true;

            // Raz na uruchomienie aplikacji (i na użytkownika) ponów przejścia odrzucone wcześniej przez serwer
            if (errorsResetForUser.current !== userId) {
                await repository.resetSyncErrors(userId);
                errorsResetForUser.current = userId;
            }

            // 0. Katalog (rejony, sektory, skały, drogi) - przed przejściami, żeby przejścia
            //    pobierane z serwera trafiały już na aktualne drogi
            try {
                catalogChanged = await syncCatalog(db);
            } catch (error) {
                console.error("Błąd podczas synchronizacji katalogu:", error);
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

            // 3. Pobranie zmian z serwera (przejścia dodane / zmienione / usunięte np. przez web)
            try {
                // ID zsynchronizowane PRZED zapytaniem - tylko one mogą zostać uznane za usunięte na serwerze.
                // Przejścia wysyłane w tle w trakcie tej synchronizacji są dzięki temu bezpieczne.
                const syncedIdsBefore = await repository.getSyncedAscentIds(userId);
                const cursor = await repository.getSyncCursor(userId);

                let changes: Awaited<ReturnType<typeof repositoryWeb.getChanges>> | null = null;
                try {
                    changes = await repositoryWeb.getChanges(cursor ?? undefined);
                } catch (error) {
                    // Serwer odpowiedział błędem (np. starsza wersja bez /ascents/changes) -> stary mechanizm.
                    // Brak sieci przerywa ten krok.
                    if (!(error instanceof ApiRequestError)) throw error;
                }

                let added = 0;
                let removed = 0;

                if (changes) {
                    // 3a. Synchronizacja różnicowa
                    const { changed, skipped } = await repository.applyServerAscents(changes.ascents);
                    added = changed;

                    if (cursor) {
                        removed = await repository.removeSyncedAscentsLocal(changes.deletedIds);
                    } else {
                        // Pierwsza synchronizacja: serwer zwrócił komplet, więc zsynchronizowane
                        // lokalnie przejście, którego w nim nie ma, zostało usunięte na serwerze.
                        const serverIds = new Set(changes.ascents.map((a) => a.id_przejscia));
                        removed = await repository.removeSyncedAscentsLocal(
                            syncedIdsBefore.filter((id) => !serverIds.has(id)),
                        );
                    }

                    // Kursor przesuwamy tylko, gdy wszystko udało się zapisać - pominięte przejścia
                    // (droga nieznana lokalnie) zostaną pobrane ponownie przy następnej synchronizacji.
                    if (skipped === 0) {
                        await repository.setSyncCursor(userId, changes.cursor);
                    }
                } else {
                    // 3b. Starszy backend: porównanie list ID
                    const { ascents, missingIds } = await repositoryWeb.getSyncDiff(syncedIdsBefore);
                    added = await repository.addAscentsLocal(ascents);
                    removed = await repository.removeSyncedAscentsLocal(missingIds);
                }

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

        if (catalogChanged) {
            for (const key of CATALOG_QUERY_KEYS) {
                queryClient.invalidateQueries({ queryKey: [key] });
            }
            localDataChanged = true;
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

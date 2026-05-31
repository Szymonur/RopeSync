import { useEffect, useCallback, useRef } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useNetwork } from "../../contexts/NetworkContext";
import { useAuth } from "../../contexts/AuthContext";
import { AscentRepository } from "../../database/repositories/AscentRepository";
import { UserService } from "../../services/api/UserService";

export const useSyncManager = () => {
    const db = useSQLiteContext();
    const { isConnected } = useNetwork();
    const { currentUserId } = useAuth();
    const isSyncing = useRef(false);

    const syncAscents = useCallback(async () => {
        if (!currentUserId || !isConnected || isSyncing.current) return;

        const repository = new AscentRepository(db);

        try {
            isSyncing.current = true;

            // 1. Synchronizacja USUWANIA
            const deletions = await repository.getUnsyncedDeletions(
                Number(currentUserId),
            );
            if (deletions.length > 0) {
                console.log(
                    `Synchronizacja: Znaleziono ${deletions.length} przejść do usunięcia.`,
                );
                for (const ascent of deletions) {
                    try {
                        await UserService.deleteAscent(ascent.id_przejscia);
                        await repository.deleteAscentPermanently(
                            ascent.id_przejscia,
                        );
                    } catch (error) {
                        console.error(
                            `Błąd podczas usuwania przejścia ${ascent.id_przejscia} z serwera:`,
                            error,
                        );
                    }
                }
            }

            // 2. Synchronizacja DODAWANIA
            const unsynced = await repository.getUnsyncedAscents(
                Number(currentUserId),
            );

            if (unsynced.length === 0) return;

            console.log(
                `Synchronizacja: Znaleziono ${unsynced.length} przejść do wysłania.`,
            );

            for (const ascent of unsynced) {
                try {
                    await UserService.createAscent({
                        id: ascent.id_przejscia,
                        data: ascent.data,
                        id_drogi: ascent.id_drogi!,
                        notatka: ascent.notatka,
                        nazwa_stylu: ascent.nazwa_stylu,
                    });

                    await repository.markAsSynced(ascent.id_przejscia);
                    console.log(
                        `Zsynchronizowano przejście: ${ascent.id_przejscia}`,
                    );
                } catch (error) {
                    console.error(
                        `Błąd synchronizacji przejścia ${ascent.id_przejscia}:`,
                        error,
                    );
                }
            }
        } catch (error) {
            console.error("Błąd podczas procesu synchronizacji:", error);
        } finally {
            isSyncing.current = false;
        }
    }, [db, isConnected, currentUserId]);

    // Uruchom synchronizację przy zmianie statusu sieci na connected
    useEffect(() => {
        if (isConnected) {
            syncAscents();
        }
    }, [isConnected, syncAscents]);

    return { syncAscents };
};

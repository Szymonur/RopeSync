import { useEffect, useCallback, useRef } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useNetwork } from "../../contexts/NetworkContext";
import { useAuth } from "../../contexts/AuthContext";
import { MobileAscentRepository } from "../../database/repositories/mobile/AscentRepository";
import { WebAscentRepository } from "../../database/repositories/web/AscentRepository";
import { MobileReactionRepository } from "../../database/repositories/mobile/ReactionRepository";

export const useSyncManager = () => {
    const db = useSQLiteContext();
    const { isConnected } = useNetwork();
    const { currentUserId } = useAuth();
    const isSyncing = useRef(false);

    const syncAscents = useCallback(async () => {
        if (!currentUserId || !isConnected || isSyncing.current) return;

        const repository = new MobileAscentRepository(db);
        const repositoryWeb = new WebAscentRepository();
        const reactionRepo = new MobileReactionRepository();

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
                        await repositoryWeb.deleteAscent(ascent.id_przejscia);
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

            if (unsynced.length > 0) {
                console.log(
                    `Synchronizacja: Znaleziono ${unsynced.length} przejść do wysłania.`,
                );

                for (const ascent of unsynced) {
                    try {
                        await repositoryWeb.addAscent({
                            id_przejscia: ascent.id_przejscia,
							id_uzytkownika: Number(currentUserId),
                            data: ascent.data,
                            id_drogi: ascent.id_drogi!,
                            timeline_data: {},
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
            }

			// SYNCHRONIZACJA Z PRZEJŚCIAMU DODANYMI TYLKO PRZEZ WEB
			try {
				const [ascentsCountLocal, ascentsCountRemote] = await Promise.all([
					repository.getAscentsCountLocal(),
					repository.getAscentsCount()
				]);
				if (ascentsCountLocal < ascentsCountRemote) {
					const ascentsUUID = await repository.getAscentsUUID();
					const unsyncedAscents = await repository.getUnsynchronisedAscents(ascentsUUID);
					await repository.addAscentsLocal(unsyncedAscents);	
				}
			} catch (error) {
				console.error(`Błąd podczas podbieraia brakującyh przejść ze zdalnej bazy danych, ${error}`)
			}


            // 3. Synchronizacja REAKCJI (Powiadomień) TODO
            try {
                // const reactions = await UserService.getUnreadReactions();
                // for (const reaction of reactions) {
                //     await reactionRepo.addReaction({
                //         id_uzytkownika: reaction.reactorId,
                //         id_przejscia: reaction.ascentId,
                //         imie: reaction.reactorFirstName,
                //         nazwisko: reaction.reactorLastName,
                //         username: reaction.reactorUsername,
                //         data_reakcji: reaction.createdAt,
                //         wyswietlono: 0,
                //     });
                // }
            } catch (error) {
                console.error("Błąd podczas pobierania reakcji:", error);
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

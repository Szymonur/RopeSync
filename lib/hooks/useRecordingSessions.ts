import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { deleteSession, listSessions } from "../recording/recordingStore";
import { exportSession, saveExportToFolder, shareExport } from "../recording/exportSession";

export const RECORDING_SESSIONS_QUERY_KEY = ["recording-sessions"] as const;

export const useRecordingSessions = () => {
    const db = useSQLiteContext();
    return useQuery({
        queryKey: RECORDING_SESSIONS_QUERY_KEY,
        queryFn: () => listSessions(db),
        // Dane lokalne - bez sieci
        networkMode: "always",
    });
};

export const useDeleteRecordingSession = () => {
    const db = useSQLiteContext();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (sessionId: string) => deleteSession(db, sessionId),
        networkMode: "always",
        onSuccess: () => queryClient.invalidateQueries({ queryKey: RECORDING_SESSIONS_QUERY_KEY }),
    });
};

// target "folder": zapis w folderze wybranym przez użytkownika (Android), "share": arkusz udostępniania
export const useExportRecordingSession = () => {
    const db = useSQLiteContext();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ sessionId, target }: { sessionId: string; target: "folder" | "share" }) => {
            const exported = await exportSession(db, sessionId);
            if (target === "folder") {
                const folder = await saveExportToFolder(db, exported);
                return { exported, folder, cancelled: folder === null };
            }
            await shareExport(exported);
            return { exported, folder: null, cancelled: false };
        },
        networkMode: "always",
        onSettled: () => queryClient.invalidateQueries({ queryKey: RECORDING_SESSIONS_QUERY_KEY }),
    });
};

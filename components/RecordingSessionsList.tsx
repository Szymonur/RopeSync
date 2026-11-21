import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import ThemedText from "./ThemedText";
import ThemedButton from "./ThemedButton";
import {
    useDeleteRecordingSession,
    useExportRecordingSession,
    useRecordingSessions,
} from "../lib/hooks/useRecordingSessions";
import { canSaveToFolder } from "../lib/recording/exportSession";
import type { SessionListItem } from "../lib/recording/recordingStore";

const STATUS_LABELS: Record<SessionListItem["status"], string> = {
    recording: "nagrywanie",
    finished: "zakończona",
    aborted: "przerwana",
};

const formatDateTime = (ms: number) => {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDuration = (session: SessionListItem) => {
    if (!session.zakonczono_ms) return "—";
    const seconds = Math.max(0, Math.round((session.zakonczono_ms - session.rozpoczeto_ms) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

// Zgubione względem oczekiwanych (zapisane + zgubione)
const lossPercent = (session: SessionListItem) => {
    const expected = session.liczba_probek + session.utracone_probki;
    return expected > 0 && session.utracone_probki > 0
        ? ` (${((session.utracone_probki / expected) * 100).toFixed(1)}%)`
        : "";
};

const RecordingSessionsList = () => {
    const { data: sessions = [], isLoading } = useRecordingSessions();
    const exportMutation = useExportRecordingSession();
    const deleteMutation = useDeleteRecordingSession();

    const runExport = async (sessionId: string, target: "folder" | "share") => {
        try {
            const result = await exportMutation.mutateAsync({ sessionId, target });
            if (result.cancelled) return;
            if (target === "folder") {
                Alert.alert(
                    "Zapisano",
                    `Folder ${result.folder}\n${result.exported.sampleCount} próbek, ${result.exported.eventCount} zdarzeń.`,
                );
            }
        } catch (error: any) {
            console.error("Błąd eksportu sesji:", error);
            Alert.alert("Błąd eksportu", error?.message ?? "Nie udało się wyeksportować sesji.");
        }
    };

    const confirmDelete = (session: SessionListItem) => {
        Alert.alert(
            "Usunąć sesję?",
            `${formatDateTime(session.rozpoczeto_ms)} · ${session.liczba_probek} próbek. Tej operacji nie można cofnąć.`,
            [
                { text: "Anuluj", style: "cancel" },
                {
                    text: "Usuń",
                    style: "destructive",
                    onPress: () =>
                        deleteMutation.mutate(session.id_sesji, {
                            onError: (error: any) => Alert.alert("Błąd", error?.message ?? "Nie udało się usunąć sesji."),
                        }),
                },
            ],
        );
    };

    const busy = exportMutation.isPending || deleteMutation.isPending;

    return (
        <View style={styles.section}>
            <ThemedText style={styles.title}>Zapisane sesje</ThemedText>
            {isLoading && <ThemedText style={styles.empty}>Wczytywanie...</ThemedText>}
            {!isLoading && sessions.length === 0 && (
                <ThemedText style={styles.empty}>Brak nagranych sesji.</ThemedText>
            )}

            {sessions.map((session) => {
                const exportable = session.status !== "recording";
                return (
                    <View key={session.id_sesji} style={styles.item}>
                        <ThemedText style={styles.itemTitle}>
                            {formatDateTime(session.rozpoczeto_ms)} · {session.tryb === "live" ? "na żywo" : "synchronizacja"}
                        </ThemedText>
                        <ThemedText style={styles.itemText}>
                            {STATUS_LABELS[session.status]} · {session.zrodlo === "synthetic" ? "dane generowane" : "czujniki"} ·{" "}
                            {formatDuration(session)}
                            {session.czestotliwosc_hz ? ` · ${session.czestotliwosc_hz} Hz` : ""}
                        </ThemedText>
                        <ThemedText style={styles.itemText}>
                            próbki: {session.liczba_probek} · zgubione: {session.utracone_probki}
                            {lossPercent(session)} · zdarzenia:{" "}
                            {session.liczba_zdarzen}
                            {session.wyeksportowano_ms ? " · wyeksportowano" : ""}
                        </ThemedText>

                        <View style={styles.actions}>
                            {canSaveToFolder && (
                                <ThemedButton
                                    onPress={() => runExport(session.id_sesji, "folder")}
                                    disabled={!exportable || busy}
                                    style={[styles.actionButton, { backgroundColor: "#2196F3" }]}
                                >
                                    <ThemedText style={styles.buttonText}>Zapisz CSV</ThemedText>
                                </ThemedButton>
                            )}
                            <ThemedButton
                                onPress={() => runExport(session.id_sesji, "share")}
                                disabled={!exportable || busy}
                                style={[styles.actionButton, { backgroundColor: "#009688" }]}
                            >
                                <ThemedText style={styles.buttonText}>Udostępnij</ThemedText>
                            </ThemedButton>
                            <ThemedButton
                                onPress={() => confirmDelete(session)}
                                disabled={!exportable || busy}
                                style={[styles.actionButton, { backgroundColor: "#d32f2f" }]}
                            >
                                <ThemedText style={styles.buttonText}>Usuń</ThemedText>
                            </ThemedButton>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        width: "100%",
        padding: 15,
        borderRadius: 15,
        backgroundColor: "rgba(33, 150, 243, 0.08)",
        borderWidth: 1,
        borderColor: "rgba(33, 150, 243, 0.3)",
        marginBottom: 20,
    },
    title: { fontWeight: "bold", fontSize: 18, marginBottom: 10, textAlign: "center" },
    empty: { textAlign: "center", opacity: 0.7 },
    item: { padding: 10, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.2)", marginBottom: 10 },
    itemTitle: { fontWeight: "bold", marginBottom: 2 },
    itemText: { fontSize: 13, opacity: 0.85 },
    actions: { flexDirection: "row", gap: 6, marginTop: 4 },
    actionButton: { flex: 1, paddingHorizontal: 4, marginVertical: 4 },
    buttonText: { color: "white", textAlign: "center", fontSize: 13 },
});

export default RecordingSessionsList;

import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import ThemedText from "./ThemedText";
import ThemedButton from "./ThemedButton";
import type { RecorderStats } from "../lib/recording/SessionRecorder";

// Częstotliwości do testu przepustowości (ESP przyjmuje 10-200 Hz)
const RATE_OPTIONS = [25, 50, 100, 200];

interface RecordingPanelProps {
    isRecording: boolean;
    isBusy: boolean;
    isSyncing: boolean;
    stats: RecorderStats;
    deviceRateHz: number | null;
    receivedPerSecond: number;
    mtu: number | null;
    invalidPackets: number;
    onStart: () => void;
    onStop: () => void;
    onSetRate: (hz: number) => void;
    // Przyciski zdarzeń (EventLogger) - część tej samej sesji
    children?: ReactNode;
}

const formatDuration = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const RecordingPanel = ({
    isRecording,
    isBusy,
    isSyncing,
    stats,
    deviceRateHz,
    receivedPerSecond,
    mtu,
    invalidPackets,
    onStart,
    onStop,
    onSetRate,
    children,
}: RecordingPanelProps) => {
    const durationMs = stats.startedAtMs ? Date.now() - stats.startedAtMs : 0;
    const expectedSamples = stats.receivedSamples - stats.duplicateSamples + stats.droppedSamples;
    const lossPercent = expectedSamples > 0 ? (stats.droppedSamples / expectedSamples) * 100 : 0;

    return (
        <View style={styles.panel}>
            <ThemedText style={styles.title}>Sesja pomiarowa</ThemedText>
            <ThemedText style={styles.subText}>
                ESP: {deviceRateHz ?? "—"} Hz · odbiór: {receivedPerSecond} próbek/s · MTU: {mtu ?? "—"}
                {invalidPackets > 0 ? ` · odrzucone ramki: ${invalidPackets}` : ""}
            </ThemedText>

            {!isRecording && (
                <View style={styles.rateRow}>
                    {RATE_OPTIONS.map((hz) => (
                        <ThemedButton
                            key={hz}
                            onPress={() => onSetRate(hz)}
                            disabled={isBusy || isSyncing}
                            style={[styles.rateButton, deviceRateHz === hz && styles.rateButtonActive]}
                        >
                            <ThemedText style={styles.buttonText}>{hz} Hz</ThemedText>
                        </ThemedButton>
                    ))}
                </View>
            )}

            {/* Zakończenie wymaga przytrzymania 1 s - przypadkowe dotknięcie nie przerwie sesji */}
            <ThemedButton
                onPress={isRecording ? undefined : onStart}
                onLongPress={isRecording ? onStop : undefined}
                delayLongPress={1000}
                disabled={isBusy || isSyncing}
                style={{ backgroundColor: isRecording ? "#d32f2f" : "#4CAF50", opacity: isBusy || isSyncing ? 0.6 : 1 }}
            >
                <ThemedText style={styles.buttonText}>
                    {isBusy ? "Czekam na ESP..." : isRecording ? "Zakończ sesję (przytrzymaj 1 s)" : "Rozpocznij sesję"}
                </ThemedText>
            </ThemedButton>

            {isRecording && (
                <View style={styles.statsGrid}>
                    <Stat label="Czas" value={formatDuration(durationMs)} />
                    <Stat label="Odebrane" value={String(stats.receivedSamples)} />
                    <Stat label="Zapisane" value={String(stats.storedSamples)} />
                    <Stat
                        label="Zgubione"
                        value={`${stats.droppedSamples} (${lossPercent.toFixed(1)}%)`}
                        warn={stats.droppedSamples > 0}
                    />
                    <Stat label="Duplikaty" value={String(stats.duplicateSamples)} />
                    <Stat label="Błędne ramki" value={String(stats.invalidPackets)} warn={stats.invalidPackets > 0} />
                    <Stat label="W buforze" value={String(stats.pendingSamples)} />
                    <Stat label="Utracone przy zapisie" value={String(stats.lostOnWrite)} warn={stats.lostOnWrite > 0} />
                </View>
            )}

            {isRecording && stats.lastWriteError && (
                <ThemedText style={styles.error}>Błąd zapisu: {stats.lastWriteError}</ThemedText>
            )}

            {children}
        </View>
    );
};

const Stat = ({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) => (
    <View style={styles.stat}>
        <ThemedText style={styles.statLabel}>{label}</ThemedText>
        <ThemedText style={[styles.statValue, warn && styles.warn]}>{value}</ThemedText>
    </View>
);

const styles = StyleSheet.create({
    panel: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(76, 175, 80, 0.3)",
    },
    title: { fontWeight: "bold", fontSize: 18, marginBottom: 6, textAlign: "center" },
    subText: { fontSize: 13, opacity: 0.8, textAlign: "center", marginBottom: 8 },
    rateRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
    rateButton: { flex: 1, backgroundColor: "#555", paddingHorizontal: 4, marginVertical: 4 },
    rateButtonActive: { backgroundColor: "#2196F3" },
    buttonText: { color: "white", textAlign: "center" },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 6 },
    stat: { width: "48%", paddingVertical: 4 },
    statLabel: { fontSize: 12, opacity: 0.7 },
    statValue: { fontSize: 16, fontWeight: "bold", fontFamily: "monospace" },
    warn: { color: "#ff9800" },
    error: { color: "#f44336", marginTop: 6, fontSize: 12 },
});

export default RecordingPanel;

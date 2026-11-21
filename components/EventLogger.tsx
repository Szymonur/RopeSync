import React, { useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform, Pressable, StyleSheet, Vibration, View } from "react-native";
import ThemedText from "./ThemedText";

// Oznaczanie zdarzeń w trakcie sesji pomiarowej. Zdarzenia zapisują się w tej samej sesji
// co dane z czujników (SessionRecorder) i trafiają do events.csv przy eksporcie.
//
// Układ pod obsługę "bez patrzenia" (osoba oznaczająca patrzy na wspinacza):
//  - częste zdarzenia: duże przyciski, każdy rodzaj ma inny kształt obsługi
//      przytrzymanie = trwa, dopóki trzymasz (clip, shortRope, excessSlack)
//      dotknięcie = chwila (fall)
//      przełącznik = dotknij na początku i na końcu (block, rest)
//  - rzadkie (start, anchor, end): małe, osobno, wymagają przytrzymania 0,5 s,
//    a czas zdarzenia to moment dotknięcia (nie koniec przytrzymania)
//  - każde zarejestrowanie potwierdza wibracja (jeśli aplikacja ma uprawnienie VIBRATE)

type HoldCategory = "clip" | "shortRope" | "excessSlack";
type ToggleCategory = "block" | "rest";
type IntervalCategory = HoldCategory | ToggleCategory;

const RARE_EVENTS = ["start", "anchor", "end"] as const;
const RARE_LONG_PRESS_MS = 500;

interface LoggedEvent {
    key: string;
    label: string;
    startMs: number;
    endMs: number | null;
    isInterval: boolean;
}

interface EventLoggerProps {
    isRecording: boolean;
    sessionId: string | null;
    sessionStartedAtMs: number | null;
    onPointEvent: (label: string, tMs: number) => string | null;
    onIntervalStart: (label: string, tMs: number) => string | null;
    onIntervalEnd: (eventId: string, tMs: number) => void;
    // Trwa przytrzymanie - ekran nadrzędny blokuje przewijanie, żeby nie przerwać zdarzenia
    onHoldChange?: (holding: boolean) => void;
}

const MAX_VISIBLE_EVENTS = 15;

const formatRelative = (ms: number) => {
    const safe = Math.max(0, ms);
    const minutes = Math.floor(safe / 60000);
    const seconds = (safe % 60000) / 1000;
    return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
};

// --- wibracja: tylko gdy uprawnienie jest w manifeście (inaczej Android rzuca wyjątek) ---
let vibrationAllowed: boolean | null = null;
const checkVibration = async () => {
    if (vibrationAllowed !== null) return;
    if (Platform.OS !== "android") {
        vibrationAllowed = true;
        return;
    }
    try {
        vibrationAllowed = await PermissionsAndroid.check("android.permission.VIBRATE" as any);
    } catch {
        vibrationAllowed = false;
    }
};
const buzz = (ms: number) => {
    if (!vibrationAllowed) return;
    try {
        Vibration.vibrate(ms);
    } catch {
        vibrationAllowed = false;
    }
};

const EventLogger = ({
    isRecording,
    sessionId,
    sessionStartedAtMs,
    onPointEvent,
    onIntervalStart,
    onIntervalEnd,
    onHoldChange,
}: EventLoggerProps) => {
    const [events, setEvents] = useState<LoggedEvent[]>([]);
    const [openIntervals, setOpenIntervals] = useState<Partial<Record<IntervalCategory, string>>>({});
    // Otwarte przedziały: kategoria -> id zdarzenia w bazie
    const openIdsRef = useRef<Partial<Record<IntervalCategory, string>>>({});
    // Czas dotknięcia rzadkiego przycisku (zatwierdzany po przytrzymaniu)
    const rarePressStartRef = useRef<number | null>(null);

    useEffect(() => {
        checkVibration();
    }, []);

    // Nowa sesja (albo jej koniec) - czysta lista i stan przycisków.
    // Otwarte przedziały domyka w bazie SessionRecorder.stop().
    useEffect(() => {
        setEvents([]);
        setOpenIntervals({});
        openIdsRef.current = {};
        onHoldChange?.(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const updateHolding = () => {
        const ids = openIdsRef.current;
        onHoldChange?.(Boolean(ids.clip || ids.shortRope || ids.excessSlack));
    };

    const addPoint = (label: string, tMs = Date.now()) => {
        if (!isRecording) return;
        const id = onPointEvent(label, tMs);
        if (!id) return;
        buzz(40);
        setEvents((prev) => [{ key: id, label, startMs: tMs, endMs: tMs, isInterval: false }, ...prev]);
    };

    const startInterval = (category: IntervalCategory) => {
        if (!isRecording || openIdsRef.current[category]) return;
        const tMs = Date.now();
        const id = onIntervalStart(category, tMs);
        if (!id) return;
        buzz(30);
        openIdsRef.current[category] = id;
        setOpenIntervals({ ...openIdsRef.current });
        updateHolding();
        setEvents((prev) => [{ key: id, label: category, startMs: tMs, endMs: null, isInterval: true }, ...prev]);
    };

    const endInterval = (category: IntervalCategory) => {
        const id = openIdsRef.current[category];
        if (!id) return;
        const tMs = Date.now();
        onIntervalEnd(id, tMs);
        buzz(15);
        delete openIdsRef.current[category];
        setOpenIntervals({ ...openIdsRef.current });
        updateHolding();
        setEvents((prev) => prev.map((e) => (e.key === id ? { ...e, endMs: tMs } : e)));
    };

    const toggleInterval = (category: ToggleCategory) => {
        if (openIdsRef.current[category]) endInterval(category);
        else startInterval(category);
    };

    const rel = (ms: number) => formatRelative(ms - (sessionStartedAtMs ?? ms));

    const holdButton = (category: HoldCategory, title: string, color: string, style?: object) => {
        const active = Boolean(openIntervals[category]);
        return (
            <Pressable
                onPressIn={() => startInterval(category)}
                onPressOut={() => endInterval(category)}
                disabled={!isRecording}
                style={[styles.big, styles.hold, { backgroundColor: active ? "#ff9800" : color }, style, !isRecording && styles.disabled]}
            >
                <ThemedText style={styles.bigLabel}>{title}</ThemedText>
                <ThemedText style={styles.bigHint}>{active ? "TRWA - puść, by zakończyć" : "przytrzymaj"}</ThemedText>
            </Pressable>
        );
    };

    const toggleButton = (category: ToggleCategory, title: string, color: string) => {
        const active = Boolean(openIntervals[category]);
        return (
            <Pressable
                onPress={() => toggleInterval(category)}
                disabled={!isRecording}
                style={({ pressed }) => [
                    styles.big,
                    styles.toggle,
                    { backgroundColor: active ? "#ff9800" : color },
                    active && styles.toggleActive,
                    pressed && styles.pressed,
                    !isRecording && styles.disabled,
                ]}
            >
                <ThemedText style={styles.bigLabel}>{title}</ThemedText>
                <ThemedText style={styles.bigHint}>{active ? "TRWA - dotknij, by zakończyć" : "dotknij: początek"}</ThemedText>
            </Pressable>
        );
    };

    return (
        <View style={styles.section}>
            {!isRecording && (
                <ThemedText style={styles.hint}>Rozpocznij sesję, aby oznaczać zdarzenia.</ThemedText>
            )}

            {/* Rzadkie: osobno, małe, z przytrzymaniem - trudno trafić przypadkiem */}
            <ThemedText style={styles.groupLabel}>Rzadkie · przytrzymaj 0,5 s</ThemedText>
            <View style={styles.row}>
                {RARE_EVENTS.map((label) => (
                    <Pressable
                        key={label}
                        disabled={!isRecording}
                        delayLongPress={RARE_LONG_PRESS_MS}
                        onPressIn={() => {
                            rarePressStartRef.current = Date.now();
                        }}
                        onLongPress={() => {
                            addPoint(label, rarePressStartRef.current ?? Date.now());
                            rarePressStartRef.current = null;
                        }}
                        style={({ pressed }) => [styles.rare, pressed && styles.rarePressed, !isRecording && styles.disabled]}
                    >
                        <ThemedText style={styles.rareLabel}>{label}</ThemedText>
                    </Pressable>
                ))}
            </View>

            <View style={styles.divider} />

            {/* Częste: duże pola */}
            {holdButton("clip", "CLIP", "#3949ab", styles.clip)}
            <View style={styles.row}>
                {holdButton("shortRope", "SHORT ROPE", "#00796b", styles.half)}
                {holdButton("excessSlack", "EXCESS SLACK", "#0277bd", styles.half)}
            </View>

            <Pressable
                onPress={() => addPoint("fall")}
                disabled={!isRecording}
                style={({ pressed }) => [styles.big, styles.fall, pressed && styles.pressed, !isRecording && styles.disabled]}
            >
                <ThemedText style={styles.bigLabel}>FALL</ThemedText>
                <ThemedText style={styles.bigHint}>dotknij</ThemedText>
            </Pressable>

            <View style={styles.row}>
                <View style={styles.half}>{toggleButton("block", "BLOCK", "#5d4037")}</View>
                <View style={styles.half}>{toggleButton("rest", "REST", "#6a1b9a")}</View>
            </View>

            {events.length > 0 && (
                <View style={styles.list}>
                    <ThemedText style={styles.listTitle}>
                        Oznaczone ({events.length}) · czas od startu sesji
                    </ThemedText>
                    {events.slice(0, MAX_VISIBLE_EVENTS).map((e) => (
                        <ThemedText key={e.key} style={styles.listItem}>
                            {rel(e.startMs)}
                            {e.isInterval ? ` – ${e.endMs === null ? "…" : rel(e.endMs)}` : ""}  {e.label}
                        </ThemedText>
                    ))}
                    {events.length > MAX_VISIBLE_EVENTS && (
                        <ThemedText style={styles.listItem}>… i {events.length - MAX_VISIBLE_EVENTS} wcześniejszych</ThemedText>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "rgba(76, 175, 80, 0.3)",
    },
    hint: { fontSize: 13, opacity: 0.7, textAlign: "center", marginBottom: 8 },
    groupLabel: { fontSize: 12, opacity: 0.6, marginBottom: 6 },
    row: { flexDirection: "row", gap: 10 },
    divider: { height: 1, backgroundColor: "rgba(150,150,150,0.4)", marginVertical: 14 },

    rare: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#9e9e9e",
        backgroundColor: "rgba(158,158,158,0.12)",
        alignItems: "center",
    },
    rarePressed: { backgroundColor: "rgba(158,158,158,0.4)" },
    rareLabel: { fontSize: 14, color: "#bdbdbd", fontWeight: "bold" },

    big: {
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        paddingHorizontal: 6,
    },
    hold: { minHeight: 100 },
    clip: { minHeight: 120 },
    half: { flex: 1 },
    fall: { minHeight: 90, backgroundColor: "#c62828" },
    toggle: { minHeight: 80 },
    toggleActive: { borderWidth: 3, borderColor: "white" },
    pressed: { opacity: 0.6 },
    disabled: { opacity: 0.35 },
    bigLabel: { color: "white", fontSize: 22, fontWeight: "bold", textAlign: "center" },
    bigHint: { color: "white", fontSize: 12, opacity: 0.85, marginTop: 2, textAlign: "center" },

    list: { marginTop: 6, padding: 10, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.2)" },
    listTitle: { fontWeight: "bold", marginBottom: 6, fontSize: 13 },
    listItem: { fontSize: 13, fontFamily: "monospace", marginVertical: 1 },
});

export default EventLogger;

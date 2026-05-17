import { StyleSheet, ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState, useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
    AscentRepository,
    AscentWithRouteDetails,
} from "../../../database/repositories/AscentRepository";
import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import Spacer from "../../../components/Spacer";
import ThemedTimeline from "../../../components/ThemedTimeline";

const AscentDetails = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const db = useSQLiteContext();
    const [ascent, setAscent] = useState<AscentWithRouteDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const repository = useMemo(() => new AscentRepository(db), [db]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                const data = await repository.getAscentDetails(id);
                setAscent(data);
            } catch (error) {
                console.error("Błąd ładowania szczegółów przejścia:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <ThemedView
                style={[styles.container, { justifyContent: "center" }]}
                safe
            >
                <ActivityIndicator size="large" color="#7b0490" />
            </ThemedView>
        );
    }

    if (!ascent) {
        return (
            <ThemedView style={styles.container}>
                <Stack.Screen options={{ title: "Nie znaleziono" }} />
                <Spacer />
                <ThemedText title style={styles.title}>
                    Przejście nie istnieje
                </ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container} scroll>
            <Stack.Screen options={{ title: "" }} />
            <Spacer height={16} />
            <ThemedText title style={styles.title}>
                {ascent.nazwa_drogi}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
                {ascent.typ_drogi.toUpperCase()} • {ascent.nazwa_stylu} •{" "}
                {ascent.data}
            </ThemedText>
            <Spacer height={28} />
            <ThemedText style={styles.noteLabel}>Notatka:</ThemedText>
            <ThemedText style={styles.note}>
                {ascent.notatka || "Brak notatki"}
            </ThemedText>
            {ascent.uri_timeline && (
                <>
                    <Spacer height={8} />
                    <ThemedTimeline uriTimeline={ascent.uri_timeline} />
                </>
            )}

            <Spacer height={20} />
            <ThemedText style={{ opacity: 0.5, fontSize: 12 }}>
                ID Przejścia: {ascent.id_przejscia}
            </ThemedText>
            <Spacer height={40} />
        </ThemedView>
    );
};

export default AscentDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.8,
        fontWeight: "500",
    },
    noteLabel: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 5,
    },
    note: {
        fontSize: 16,
        fontStyle: "italic",
        lineHeight: 24,
    },
    timeline: {
        height: 100,
    },
});

import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedButton from "../../../components/ThemedButton";
import ThemedCard from "../../../components/ThemedCard";
import { useTheme } from "../../../contexts/ThemeContext";
import { Colors } from "../../../constants/Colors";

import { useAuth } from "../../../contexts/AuthContext";

import { useMe } from "../../../lib/hooks/useProfile";
import {
    Ascent,
    AscentRepository,
} from "../../../database/repositories/AscentRepository";
import { UserService } from "../../../services/api/UserService";

const LINEAR_GRADE_ORDER = [
    "3",
    "4",
    "4+",
    "5a",
    "5a+",
    "5b",
    "5b+",
    "5c",
    "5c+",
    "6a",
    "6a+",
    "6b",
    "6b+",
    "6c",
    "6c+",
    "7a",
    "7a+",
    "7b",
    "7b+",
    "7c",
    "7c+",
    "8a",
    "8a+",
    "8b",
    "8b+",
    "8c",
    "8c+",
    "9a",
    "9a+",
] as const;

const BOULDER_GRADE_ORDER = [
    "4",
    "4+",
    "5",
    "5+",
    "6a",
    "6a+",
    "6b",
    "6b+",
    "6c",
    "6c+",
    "7a",
    "7a+",
    "7b",
    "7b+",
    "7c",
    "7c+",
    "8a",
    "8a+",
] as const;

const linearGradeIndex: Map<string, number> = new Map(
    LINEAR_GRADE_ORDER.map((grade, index) => [grade, index]),
);
const boulderGradeIndex: Map<string, number> = new Map(
    BOULDER_GRADE_ORDER.map((grade, index) => [grade, index]),
);

const normalizeGrade = (grade?: string | null) => grade?.trim().toLowerCase() ?? "";

const getGradeRank = (grade: string | null | undefined, routeType: string | undefined) => {
    const normalized = normalizeGrade(grade);
    if (!normalized) return -1;

    if (routeType === "boulder") {
        return boulderGradeIndex.get(normalized) ?? -1;
    }

    return linearGradeIndex.get(normalized) ?? -1;
};

const getBestAscentForType = (ascents: Ascent[], routeType: "boulder" | "sportowa" | "trad") => {
    const candidates = ascents.filter(
        (ascent) => ascent.typ_drogi === routeType && getGradeRank(ascent.wycena, ascent.typ_drogi) >= 0,
    );

    if (candidates.length === 0) return null;

    return candidates.reduce((best, current) => {
        const bestRank = getGradeRank(best.wycena, best.typ_drogi);
        const currentRank = getGradeRank(current.wycena, current.typ_drogi);

        if (currentRank > bestRank) return current;
        if (currentRank < bestRank) return best;

        return current.data > best.data ? current : best;
    });
};

interface ChartPoint {
    label: string;
    count: number;
}

const buildGradeChart = (ascents: Ascent[]): ChartPoint[] => {
    const counts = new Map<string, number>();

    for (const ascent of ascents) {
        const grade = normalizeGrade(ascent.wycena);
        if (!grade) continue;
        counts.set(grade, (counts.get(grade) ?? 0) + 1);
    }

    return Array.from(counts.entries())
        .map(([label, count]) => ({ label: label.toUpperCase(), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 7);
};

const buildMonthlyChart = (ascents: Ascent[]): ChartPoint[] => {
    const now = new Date();
    const day = now.getDay();
    const mondayShift = day === 0 ? -6 : 1 - day;
    const thisWeekStart = new Date(now);
    thisWeekStart.setHours(0, 0, 0, 0);
    thisWeekStart.setDate(thisWeekStart.getDate() + mondayShift);

    const weekStarts: Date[] = [];
    for (let i = 7; i >= 0; i -= 1) {
        const start = new Date(thisWeekStart);
        start.setDate(start.getDate() - i * 7);
        weekStarts.push(start);
    }

    const toWeekKey = (date: Date) => date.toISOString().slice(0, 10);
    const allowedWeekKeys = new Set(weekStarts.map((date) => toWeekKey(date)));

    const weeklyCounts = new Map<string, number>();

    for (const ascent of ascents) {
        if (!ascent.data) continue;
        const ascentDate = new Date(ascent.data);
        if (Number.isNaN(ascentDate.getTime())) continue;

        const ascentDay = ascentDate.getDay();
        const ascentMondayShift = ascentDay === 0 ? -6 : 1 - ascentDay;
        const weekStart = new Date(ascentDate);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() + ascentMondayShift);

        const weekKey = toWeekKey(weekStart);
        if (!allowedWeekKeys.has(weekKey)) continue;

        weeklyCounts.set(weekKey, (weeklyCounts.get(weekKey) ?? 0) + 1);
    }

    return weekStarts.map((weekStart) => {
        const weekKey = toWeekKey(weekStart);
        const dd = String(weekStart.getDate()).padStart(2, "0");
        const mm = String(weekStart.getMonth() + 1).padStart(2, "0");

        return {
            label: `${dd}.${mm}`,
            count: weeklyCounts.get(weekKey) ?? 0,
        };
    });
};

const Profile = () => {
    const { logout } = useAuth();
    const { data: profile, isLoading, error } = useMe();
    const db = useSQLiteContext();
    const repository = useMemo(() => new AscentRepository(db), [db]);

    const [ascents, setAscents] = useState<Ascent[]>([]);
    const [isLoadingAscents, setIsLoadingAscents] = useState(true);
    const [lineChartWidth, setLineChartWidth] = useState(0);

    const router = useRouter();
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const syncAscentsFromServer = useCallback(async () => {
        if (!profile?.id) return;

        try {
            const serverAscents = await UserService.getMyAscents();
            await repository.replaceAscentsForUser(
                Number(profile.id),
                serverAscents.map((item) => ({
                    id_przejscia: item.id_przejscia,
                    data: item.data,
                    notatka: item.notatka ?? "",
                    uri_timeline: item.uri_timeline,
                    id_uzytkownika: item.id_uzytkownika,
                    nazwa_stylu: item.nazwa_stylu,
                    id_drogi: item.id_drogi,
                })),
            );
        } catch (syncError) {
            console.error("Błąd synchronizacji przejść w profilu:", syncError);
        }
    }, [profile?.id, repository]);

    const loadAscents = useCallback(async () => {
        if (!profile?.id) return;

        try {
            const data = await repository.getAscentsForUser(Number(profile.id));
            setAscents(data);
        } catch (loadError) {
            console.error("Błąd ładowania przejść w profilu:", loadError);
        }
    }, [profile?.id, repository]);

    useEffect(() => {
        if (!profile?.id) return;

        (async () => {
            setIsLoadingAscents(true);
            await syncAscentsFromServer();
            await loadAscents();
            setIsLoadingAscents(false);
        })();
    }, [profile?.id, syncAscentsFromServer, loadAscents]);

    const stats = useMemo(() => {
        const sportAscents = ascents.filter((item) => item.typ_drogi === "sportowa");
        const tradAscents = ascents.filter((item) => item.typ_drogi === "trad");
        const boulderAscents = ascents.filter((item) => item.typ_drogi === "boulder");
        const gradeChart = buildGradeChart(ascents);
        const monthlyChart = buildMonthlyChart(ascents);

        return {
            total: ascents.length,
            sportCount: sportAscents.length,
            tradCount: tradAscents.length,
            boulderCount: boulderAscents.length,
            bestSport: getBestAscentForType(ascents, "sportowa"),
            bestTrad: getBestAscentForType(ascents, "trad"),
            bestBoulder: getBestAscentForType(ascents, "boulder"),
            gradeChart,
            monthlyChart,
        };
    }, [ascents]);

    const maxGradeCount = useMemo(
        () => Math.max(1, ...stats.gradeChart.map((item) => item.count)),
        [stats.gradeChart],
    );
    const maxMonthlyCount = useMemo(
        () => Math.max(1, ...stats.monthlyChart.map((item) => item.count)),
        [stats.monthlyChart],
    );

    const linePoints = useMemo(() => {
        const chartHeight = 120;
        const topPadding = 12;
        const bottomPadding = 12;
        const sidePadding = 12;
        const count = stats.monthlyChart.length;
        if (count === 0 || lineChartWidth <= 0) {
            return [] as Array<{ x: number; y: number }>;
        }

        const usableWidth = Math.max(1, lineChartWidth - sidePadding * 2);
        const usableHeight = chartHeight - topPadding - bottomPadding;

        return stats.monthlyChart.map((item, index) => {
            const xRatio = count === 1 ? 0 : index / (count - 1);
            const x = sidePadding + usableWidth * xRatio;
            const yRatio = item.count / maxMonthlyCount;
            const y = topPadding + (1 - yRatio) * usableHeight;
            return { x, y };
        });
    }, [lineChartWidth, maxMonthlyCount, stats.monthlyChart]);

    const polylinePoints = useMemo(
        () => linePoints.map((point) => `${point.x},${point.y}`).join(" "),
        [linePoints],
    );

    if (isLoading)
        return (
            <ThemedView style={styles.container} safe>
                <ThemedText>Ładowanie...</ThemedText>
            </ThemedView>
        );
    if (error)
        return (
            <ThemedView style={styles.container} safe>
                <ThemedText title={true} style={styles.heading}>
                    Coś poszło nie tak!
                </ThemedText>
                <Spacer />
                <ThemedButton onPress={logout}>
                    <ThemedText style={{ textAlign: "center" }}>
                        Wyloguj
                    </ThemedText>
                </ThemedButton>
            </ThemedView>
        );

    return (
        <ThemedView style={styles.content} scroll>
            <Tabs.Screen
                options={{
                    headerTitle: `${profile?.firstName} ${profile?.lastName}`,
                    tabBarLabel: "Profile",
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => router.push("/(dashboard)/settings")}
                            style={{ marginRight: 15 }}
                        >
                            <Ionicons
                                name="settings-outline"
                                color={theme.iconColour}
                                size={24}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ThemedText title style={styles.sectionTitle}>Życiówki</ThemedText>
            <View style={styles.pbSection}>
                <View style={[styles.pbItem, { borderColor: theme.border }] }>
                    <ThemedText style={styles.pbLabel}>Boulder</ThemedText>
                    <ThemedText style={styles.pbValue}>{stats.bestBoulder?.wycena ?? "-"}</ThemedText>
                    <ThemedText style={styles.pbRoute}>{stats.bestBoulder?.nazwa_drogi ?? "Brak danych"}</ThemedText>
                </View>
                <View style={[styles.pbItem, { borderColor: theme.border }] }>
                    <ThemedText style={styles.pbLabel}>Sportowa</ThemedText>
                    <ThemedText style={styles.pbValue}>{stats.bestSport?.wycena ?? "-"}</ThemedText>
                    <ThemedText style={styles.pbRoute}>{stats.bestSport?.nazwa_drogi ?? "Brak danych"}</ThemedText>
                </View>
                <View style={[styles.pbItem, { borderColor: theme.border }] }>
                    <ThemedText style={styles.pbLabel}>Trad</ThemedText>
                    <ThemedText style={styles.pbValue}>{stats.bestTrad?.wycena ?? "-"}</ThemedText>
                    <ThemedText style={styles.pbRoute}>{stats.bestTrad?.nazwa_drogi ?? "Brak danych"}</ThemedText>
                </View>
            </View>

            <ThemedCard style={styles.summaryCard}>
                <ThemedText style={styles.summaryTitle}>Ilość przejść</ThemedText>
                <ThemedText style={styles.summaryLine}>Łącznie: {stats.total}</ThemedText>
                <ThemedText style={styles.summaryLine}>Sportowe: {stats.sportCount}</ThemedText>
                <ThemedText style={styles.summaryLine}>Trad: {stats.tradCount}</ThemedText>
                <ThemedText style={styles.summaryLine}>Bouldery: {stats.boulderCount}</ThemedText>
            </ThemedCard>

            <ThemedCard style={styles.chartCard}>
                <ThemedText style={styles.summaryTitle}>Przejścia wg skali</ThemedText>
                {stats.gradeChart.length === 0 ? (
                    <ThemedText style={styles.emptyText}>Brak danych o wycenach.</ThemedText>
                ) : (
                    stats.gradeChart.map((item) => (
                        <View key={item.label} style={styles.chartRow}>
                            <ThemedText style={styles.chartLabel}>{item.label}</ThemedText>
                            <View style={[styles.chartTrack, { backgroundColor: theme.inputBackground }] }>
                                <View
                                    style={[
                                        styles.chartBar,
                                        {
                                            backgroundColor: theme.accent,
                                            width: `${Math.max(8, (item.count / maxGradeCount) * 100)}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <ThemedText style={styles.chartCount}>{item.count}</ThemedText>
                        </View>
                    ))
                )}
            </ThemedCard>

            <ThemedCard style={styles.chartCard}>
                <ThemedText style={styles.summaryTitle}>Przejścia tygodniowo (8 tygodni)</ThemedText>
                {stats.monthlyChart.length === 0 ? (
                    <ThemedText style={styles.emptyText}>Brak danych czasowych.</ThemedText>
                ) : (
                    <>
                        <View
                            style={[styles.lineChartWrap, { backgroundColor: theme.inputBackground }]}
                            onLayout={(event) => setLineChartWidth(event.nativeEvent.layout.width)}
                        >
                            <Svg width="100%" height={120}>
                                <Line x1="12" y1="108" x2={Math.max(12, lineChartWidth - 12)} y2="108" stroke={theme.border} strokeWidth="1" />
                                <Line x1="12" y1="60" x2={Math.max(12, lineChartWidth - 12)} y2="60" stroke={theme.border} strokeWidth="1" opacity="0.5" />
                                <Line x1="12" y1="12" x2={Math.max(12, lineChartWidth - 12)} y2="12" stroke={theme.border} strokeWidth="1" opacity="0.25" />

                                {linePoints.length > 1 ? (
                                    <Polyline
                                        points={polylinePoints}
                                        fill="none"
                                        stroke={theme.iconColourFocused}
                                        strokeWidth="2.5"
                                    />
                                ) : null}

                                {linePoints.map((point, index) => (
                                    <Circle
                                        key={`point-${index}`}
                                        cx={point.x}
                                        cy={point.y}
                                        r="4"
                                        fill={theme.accent}
                                        stroke={theme.iconColourFocused}
                                        strokeWidth="1.2"
                                    />
                                ))}
                            </Svg>
                        </View>

                        <View style={styles.weeklyLabelsRow}>
                            {stats.monthlyChart.map((item) => (
                                <View key={item.label} style={styles.weeklyLabelCell}>
                                    <ThemedText style={styles.weeklyLabel}>{item.label}</ThemedText>
                                    <ThemedText style={styles.weeklyCount}>{item.count}</ThemedText>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ThemedCard>

            {isLoadingAscents ? (
                <ThemedText style={styles.loading}>Synchronizacja przejść...</ThemedText>
            ) : null}
        </ThemedView>
    );
};

export default Profile;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 30,
    },
    heading: {
        fontWeight: "bold",
        fontSize: 24,
        textAlign: "right",
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    summaryCard: {
        marginTop: 14,
        paddingVertical: 18,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },
    summaryLine: {
        fontSize: 15,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 8,
    },
    pbSection: {
        gap: 8,
    },
    pbItem: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    pbLabel: {
        fontSize: 13,
        opacity: 0.75,
    },
    pbValue: {
        fontSize: 24,
        fontWeight: "700",
        marginTop: 2,
    },
    pbRoute: {
        fontSize: 13,
        marginTop: 2,
        opacity: 0.8,
    },
    chartCard: {
        marginTop: 12,
        paddingVertical: 16,
    },
    chartRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 10,
    },
    chartLabel: {
        width: 56,
        fontSize: 13,
        fontWeight: "600",
    },
    chartTrack: {
        flex: 1,
        height: 10,
        borderRadius: 999,
        overflow: "hidden",
    },
    chartBar: {
        height: "100%",
        borderRadius: 999,
    },
    chartCount: {
        width: 24,
        textAlign: "right",
        fontSize: 13,
        fontWeight: "700",
    },
    lineChartWrap: {
        borderRadius: 12,
        marginTop: 10,
        overflow: "hidden",
    },
    weeklyLabelsRow: {
        marginTop: 8,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    weeklyLabelCell: {
        alignItems: "center",
        flex: 1,
    },
    weeklyLabel: {
        fontSize: 11,
        opacity: 0.85,
    },
    weeklyCount: {
        fontSize: 13,
        fontWeight: "700",
        marginTop: 2,
    },
    emptyText: {
        marginTop: 4,
        opacity: 0.75,
    },
    loading: {
        opacity: 0.75,
        fontSize: 13,
        textAlign: "center",
        marginTop: 12,
    },
});

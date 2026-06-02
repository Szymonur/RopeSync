import React, { useMemo, useState } from "react";
import { StyleSheet, View, LayoutChangeEvent, ScrollView } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import Spacer from "./Spacer";
import { Ascent } from "../database/repositories/AscentRepository";
import ThemedText from "./ThemedText";
import ThemedCard from "./ThemedCard";
import { useTheme } from "../contexts/ThemeContext";
import { Colors } from "../constants/Colors";

import RouteTypeBadge from "../components/Badges/RouteTypeBadge";

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

const normalizeGrade = (grade?: string | null) =>
    grade?.trim().toLowerCase() ?? "";

const getGradeRank = (
    grade: string | null | undefined,
    routeType: string | undefined,
) => {
    const normalized = normalizeGrade(grade);
    if (!normalized) return -1;

    if (routeType === "boulder") {
        return boulderGradeIndex.get(normalized) ?? -1;
    }

    return linearGradeIndex.get(normalized) ?? -1;
};

const getBestAscentForType = (
    ascents: Ascent[],
    routeType: "boulder" | "sportowa" | "trad",
) => {
    const candidates = ascents.filter(
        (ascent) =>
            ascent.typ_drogi === routeType &&
            getGradeRank(ascent.wycena, ascent.typ_drogi) >= 0,
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
        .map(([label, count]) => ({ label: label, count }))
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

interface ProfileStatsProps {
    ascents: Ascent[];
    isLoadingAscents?: boolean;
}

const ProfileStats = ({ ascents, isLoadingAscents }: ProfileStatsProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const [lineChartWidth, setLineChartWidth] = useState(0);

    const stats = useMemo(() => {
        const sportAscents = ascents.filter(
            (item) => item.typ_drogi === "sportowa",
        );
        const tradAscents = ascents.filter((item) => item.typ_drogi === "trad");
        const boulderAscents = ascents.filter(
            (item) => item.typ_drogi === "boulder",
        );
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

    return (
        <ScrollView style={styles.content}>
            <ThemedText title style={styles.sectionTitle}>
                Życiówki
            </ThemedText>
            <View style={styles.pbSection}>
                <View style={[styles.pbItem, { borderColor: theme.border }]}>
                    <ThemedText style={styles.pbLabel}>Boulder</ThemedText>
                    <ThemedText style={styles.pbValue}>
                        {stats.bestBoulder?.wycena ?? "-"}
                    </ThemedText>
                    <ThemedText style={styles.pbRoute}>
                        {stats.bestBoulder?.nazwa_drogi ?? "Brak danych"}
                    </ThemedText>
                </View>
                <View style={[styles.pbItem, { borderColor: theme.border }]}>
                    <ThemedText style={styles.pbLabel}>Sportowa</ThemedText>
                    <ThemedText style={styles.pbValue}>
                        {stats.bestSport?.wycena ?? "-"}
                    </ThemedText>
                    <ThemedText style={styles.pbRoute}>
                        {stats.bestSport?.nazwa_drogi ?? "Brak danych"}
                    </ThemedText>
                </View>
                <View style={[styles.pbItem, { borderColor: theme.border }]}>
                    <ThemedText style={styles.pbLabel}>Trad</ThemedText>
                    <ThemedText style={styles.pbValue}>
                        {stats.bestTrad?.wycena ?? "-"}
                    </ThemedText>
                    <ThemedText style={styles.pbRoute}>
                        {stats.bestTrad?.nazwa_drogi ?? "Brak danych"}
                    </ThemedText>
                </View>
            </View>

            <ThemedCard style={styles.summaryCard}>
                <View style={styles.summaryTitleBar}>
                    <ThemedText style={styles.summaryTitle}>
                        Liczba przejść
                    </ThemedText>
                    <ThemedText
                        style={[
                            styles.summaryTitleNumber,
                            { backgroundColor: Colors.primary },
                        ]}
                    >
                        {stats.total}
                    </ThemedText>
                </View>
                <View style={styles.summaryTypesRow}>
                    <View style={styles.summaryLine}>
                        <ThemedText style={styles.summaryTypeCount}>
                            {stats.sportCount}
                        </ThemedText>
                        <RouteTypeBadge route_type={"sportowa"} />
                    </View>
                    <View style={styles.summaryLine}>
                        <ThemedText style={styles.summaryTypeCount}>
                            {stats.tradCount}
                        </ThemedText>
                        <RouteTypeBadge route_type={"trad"} />
                    </View>
                    <View style={styles.summaryLine}>
                        <ThemedText style={styles.summaryTypeCount}>
                            {stats.boulderCount}
                        </ThemedText>
                        <RouteTypeBadge route_type={"boulder"} />
                    </View>
                </View>
            </ThemedCard>

            <ThemedCard style={styles.chartCard}>
                {/* <ThemedText style={styles.summaryTitle}>
                    Przejścia wg skali
                </ThemedText> */}
                {stats.gradeChart.length === 0 ? (
                    <ThemedText style={styles.emptyText}>
                        Brak danych o wycenach.
                    </ThemedText>
                ) : (
                    stats.gradeChart.map((item) => (
                        <View key={item.label} style={styles.chartRow}>
                            <ThemedText style={styles.chartLabel}>
                                {item.label}
                            </ThemedText>
                            <View
                                style={[
                                    styles.chartTrack,
                                    { backgroundColor: theme.background },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.chartBar,
                                        {
                                            backgroundColor: Colors.primary,
                                            width: `${Math.max(8, (item.count / maxGradeCount) * 100)}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <ThemedText style={styles.chartCount}>
                                {item.count}
                            </ThemedText>
                        </View>
                    ))
                )}
            </ThemedCard>

            <ThemedCard style={styles.chartCard}>
                <ThemedText style={styles.summaryTitle}>
                    Przejścia tygodniowo (8 tygodni)
                </ThemedText>
                {stats.monthlyChart.length === 0 ? (
                    <ThemedText style={styles.emptyText}>
                        Brak danych czasowych.
                    </ThemedText>
                ) : (
                    <>
                        <View
                            style={[
                                styles.lineChartWrap,
                                { backgroundColor: theme.background },
                            ]}
                            onLayout={(event: LayoutChangeEvent) =>
                                setLineChartWidth(
                                    event.nativeEvent.layout.width,
                                )
                            }
                        >
                            <Svg width="100%" height={120}>
                                <Line
                                    x1="12"
                                    y1="108"
                                    x2={Math.max(12, lineChartWidth - 12)}
                                    y2="108"
                                    stroke={theme.border}
                                    strokeWidth="1"
                                />
                                <Line
                                    x1="12"
                                    y1="60"
                                    x2={Math.max(12, lineChartWidth - 12)}
                                    y2="60"
                                    stroke={theme.border}
                                    strokeWidth="1"
                                    opacity="0.5"
                                />
                                <Line
                                    x1="12"
                                    y1="12"
                                    x2={Math.max(12, lineChartWidth - 12)}
                                    y2="12"
                                    stroke={theme.border}
                                    strokeWidth="1"
                                    opacity="0.25"
                                />

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
                                        fill={theme.iconColourFocused}
                                        stroke={theme.iconColourFocused}
                                        strokeWidth="1.2"
                                    />
                                ))}
                            </Svg>
                        </View>

                        <View style={styles.weeklyLabelsRow}>
                            {stats.monthlyChart.map((item) => (
                                <View
                                    key={item.label}
                                    style={styles.weeklyLabelCell}
                                >
                                    <ThemedText style={styles.weeklyLabel}>
                                        {item.label}
                                    </ThemedText>
                                    <ThemedText style={styles.weeklyCount}>
                                        {item.count}
                                    </ThemedText>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ThemedCard>

            {isLoadingAscents ? (
                <ThemedText style={styles.loading}>
                    Synchronizacja przejść...
                </ThemedText>
            ) : null}

            <Spacer height={40} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: {
        width: "100%",
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 30,
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
    summaryTitleNumber: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 8,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 10,
    },
    summaryTitleBar: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    summaryLine: {
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        fontSize: 15,
        marginLeft: 8,
    },
    summaryTypesRow: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 8,
    },
    summaryTypeCount: {
        width: "100%",
        textAlign: "center",
        marginRight: 8,
        fontSize: 22,
        fontWeight: 700,
        marginBottom: 4,
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

export default ProfileStats;

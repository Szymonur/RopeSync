import React, { useMemo, useState } from "react";
import {
    StyleSheet,
    View,
    LayoutChangeEvent,
    ScrollView,
    TouchableOpacity,
    RefreshControlProps,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import Spacer from "./Spacer";
import { UserStats } from "../types/ascent";
import ThemedText from "./ThemedText";
import ThemedCard from "./ThemedCard";
import { useTheme } from "../contexts/ThemeContext";
import { Colors } from "../constants/Colors";

import RouteTypeBadge from "../components/Badges/RouteTypeBadge";

import { useSnackbar } from "../contexts/SnackbarContext";

interface ProfileStatsProps {
    stats: UserStats;
    isLoading?: boolean;
    refreshControl?: React.ReactElement<RefreshControlProps>;
}

const ProfileStats = ({
    stats,
    isLoading,
    refreshControl,
}: ProfileStatsProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const [lineChartWidth, setLineChartWidth] = useState(0);
    const router = useRouter();
    const { showSnackbar } = useSnackbar();
	console.log(stats);
	
    const maxGradeCount = useMemo(
        () => Math.max(1, ...stats.gradeChart.map((item) => item.count)),
        [stats.gradeChart],
    );
    const maxWeeklyCount = useMemo(
        () => Math.max(1, ...stats.weeklyChart.map((item) => item.count)),
        [stats.weeklyChart],
    );

    const linePoints = useMemo(() => {
        const chartHeight = 120;
        const topPadding = 12;
        const bottomPadding = 12;
        const sidePadding = 18;
        const count = stats.weeklyChart.length;
        if (count === 0 || lineChartWidth <= 0) {
            return [] as Array<{ x: number; y: number }>;
        }

        const usableWidth = Math.max(1, lineChartWidth - sidePadding * 2);
        const usableHeight = chartHeight - topPadding - bottomPadding;

        return stats.weeklyChart.map((item, index) => {
            const xRatio = count === 1 ? 0 : index / (count - 1);
            const x = sidePadding + usableWidth * xRatio;
            const yRatio = item.count / maxWeeklyCount;
            const y = topPadding + (1 - yRatio) * usableHeight;
            return { x, y };
        });
    }, [lineChartWidth, maxWeeklyCount, stats.weeklyChart]);

    const polylinePoints = useMemo(
        () => linePoints.map((point) => `${point.x},${point.y}`).join(" "),
        [linePoints],
    );

    return (
        <ScrollView style={styles.content} refreshControl={refreshControl}>
            <ThemedText title style={styles.sectionTitle}>
                Życiówki
            </ThemedText>
            <View style={styles.pbSection}>
                <TouchableOpacity
                    style={styles.pbItemContainer}
                    onPress={() => {
                        stats.bestSport?.id_przejscia
                            ? router.push(
                                  `/(dashboard)/ascent/${stats.bestSport?.id_przejscia}?userId=${stats.bestSport?.id_uzytkownika}`,
                              )
                            : showSnackbar({
                                  message:
                                      "Ten użytkownik nie ma jeszcze przejść sportowych",
                                  type: "warn",
                              });
                    }}
                >
                    <View
                        style={[styles.pbItem, { borderColor: theme.border }]}
                    >
                        <View style={styles.pbBadge}>
                            <RouteTypeBadge route_type={"sportowa"} />
                        </View>
                        <ThemedText style={styles.pbValue}>
                            {stats.bestSport?.wycena ?? "-"}
                        </ThemedText>
                        <ThemedText style={styles.pbRoute}>
                            {stats.bestSport?.nazwa_drogi ?? "Brak danych"}
                        </ThemedText>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.pbItemContainer}
                    onPress={() => {
                        stats.bestTrad?.id_przejscia
                            ? router.push(
                                  `/(dashboard)/ascent/${stats.bestTrad?.id_przejscia}?userId=${stats.bestTrad?.id_uzytkownika}`,
                              )
                            : showSnackbar({
                                  message:
                                      "Ten użytkownik nie ma jeszcze przejść tradowych",
                                  type: "warn",
                              });
                    }}
                >
                    <View
                        style={[styles.pbItem, { borderColor: theme.border }]}
                    >
                        <View style={styles.pbBadge}>
                            <RouteTypeBadge route_type={"trad"} />
                        </View>
                        <ThemedText style={styles.pbValue}>
                            {stats.bestTrad?.wycena ?? "-"}
                        </ThemedText>
                        <ThemedText style={styles.pbRoute}>
                            {stats.bestTrad?.nazwa_drogi ?? "Brak danych"}
                        </ThemedText>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.pbItemContainer}
                    onPress={() => {
                        stats.bestBoulder?.id_przejscia
                            ? router.push(
                                  `/(dashboard)/ascent/${stats.bestBoulder?.id_przejscia}?userId=${stats.bestBoulder?.id_uzytkownika}`,
                              )
                            : showSnackbar({
                                  message:
                                      "Ten użytkownik nie ma jeszcze przejść boulderowych",
                                  type: "warn",
                              });
                    }}
                >
                    <View
                        style={[styles.pbItem, { borderColor: theme.border }]}
                    >
                        <View style={styles.pbBadge}>
                            <RouteTypeBadge route_type={"boulder"} />
                        </View>
                        <ThemedText style={styles.pbValue}>
                            {stats.bestBoulder?.wycena ?? "-"}
                        </ThemedText>
                        <ThemedText style={styles.pbRoute}>
                            {stats.bestBoulder?.nazwa_drogi ?? "Brak danych"}
                        </ThemedText>
                    </View>
                </TouchableOpacity>
            </View>
            <ThemedCard style={styles.summaryCard}>
                <View style={styles.summaryTitleBar}>
                    <ThemedText style={styles.summaryTitle}>
                        Liczba przejść
                    </ThemedText>
                    <ThemedText
                        style={[
                            styles.summaryTitleNumber,
                            {
                                backgroundColor: Colors.primary,
                            },
                        ]}
                    >
                        {stats.totalCount}
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

            <ThemedCard style={[styles.chartCard]}>
                <ThemedText style={styles.summaryTitle}>
                    Przejścia tygodniowo
                </ThemedText>
                {stats.weeklyChart.length === 0 ? (
                    <ThemedText style={styles.emptyText}>
                        Brak danych czasowych.
                    </ThemedText>
                ) : (
					<>
                        <View>
                            <View
                                style={[
                                    styles.lineChartWrap,
                                    { backgroundColor: theme.background, width: "100%" },
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
                                            stroke={Colors.primary}
                                            strokeWidth="2"
                                        />
                                    ) : null}

                                    {linePoints.map((point, index) => (
                                        <Circle
                                            key={`point-${index}`}
                                            cx={point.x}
                                            cy={point.y}
                                            r="3.5"
                                            fill={Colors.primary}
                                            stroke={Colors.primary}
                                            strokeWidth="1.2"
                                        />
                                    ))}
                                </Svg>
                            </View>
                            <View style={styles.weeklyLabelsRow}>
                                {linePoints.map((point, index) => (
                                    <View
                                        key={stats.weeklyChart[index].label}
                                        style={{
                                            position: "absolute",
                                            left: point.x - 35,
                                            width: 70,
                                            alignItems: "center",
                                        }}
                                    >
                                        {/* <ThemedText style={styles.weeklyLabel}>
                                            {stats.weeklyChart[index].label}
                                        </ThemedText> */}
                                        <ThemedText style={styles.weeklyCount}>
                                            {stats.weeklyChart[index].count}
                                        </ThemedText>
                                    </View>
                                ))}
                            </View>
                        </View>
					</>
                )}
            </ThemedCard>

            {isLoading ? (
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
        color: "#e9e9e9",
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
        fontWeight: "700",
        marginBottom: 4,
    },
    pbSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
    },
    pbItemContainer: {
        flexGrow: 1,
        minWidth: "30%",
    },
    pbItem: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    pbBadge: {
        display: "flex",
        alignItems: "flex-start",
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
    },
    chartRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 5,
        marginBottom: 5,
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
        minHeight: 45,
        position: "relative",
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

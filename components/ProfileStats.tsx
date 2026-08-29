import React, { useMemo, useState, useEffect } from "react";
import {
    StyleSheet,
    View,
    LayoutChangeEvent,
    ScrollView,
    TouchableOpacity,
    RefreshControlProps,
	Platform
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Circle, Line, Polyline, Text as SvgText, Rect, Polygon } from "react-native-svg";
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
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        if (stats.weeklyChart && stats.weeklyChart.length > 0) {
            setSelectedIndex(stats.weeklyChart.length - 1);
        }
    }, [stats.weeklyChart]);
	
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
        const leftPadding = 12;
        const rightPadding = 35;
        const count = stats.weeklyChart.length;
        if (count === 0 || lineChartWidth <= 0) {
            return [] as Array<{ x: number; y: number }>;
        }

        const usableWidth = Math.max(1, lineChartWidth - leftPadding - rightPadding);
        const usableHeight = chartHeight - topPadding - bottomPadding;

        return stats.weeklyChart.map((item, index) => {
            const xRatio = count === 1 ? 0 : index / (count - 1);
            const x = leftPadding + usableWidth * xRatio;
            const yRatio = maxWeeklyCount === 0 ? 0 : item.count / maxWeeklyCount;
            const y = topPadding + (1 - yRatio) * usableHeight;
            return { x, y };
        });
    }, [lineChartWidth, maxWeeklyCount, stats.weeklyChart]);

    const polylinePoints = useMemo(
        () => linePoints.map((point) => `${point.x},${point.y}`).join(" "),
        [linePoints],
    );

    const fillPoints = useMemo(() => {
        if (linePoints.length < 2) return "";
        const first = linePoints[0];
        const last = linePoints[linePoints.length - 1];
        const baseline = 108; // Poziom osi X na wykresie
        return `${first.x},${baseline} ${polylinePoints} ${last.x},${baseline}`;
    }, [linePoints, polylinePoints]);

    return (
        <ScrollView style={styles.content} refreshControl={refreshControl} showsVerticalScrollIndicator={false}>
			{Platform.OS == "web" &&
				<Spacer/>
			}
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
                            <RouteTypeBadge route_type={"Sport"} />
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
                        stats.bestMixedTrad?.id_przejscia
                            ? router.push(
                                  `/(dashboard)/ascent/${stats.bestMixedTrad?.id_przejscia}?userId=${stats.bestMixedTrad?.id_uzytkownika}`,
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
                            <RouteTypeBadge route_type={"Mixed trad"} />
                        </View>
                        <ThemedText style={styles.pbValue}>
                            {stats.bestMixedTrad?.wycena ?? "-"}
                        </ThemedText>
                        <ThemedText style={styles.pbRoute}>
                            {stats.bestMixedTrad?.nazwa_drogi ?? "Brak danych"}
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
                            <RouteTypeBadge route_type={"Trad"} />
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
                            <RouteTypeBadge route_type={"Boulder"} />
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
                        <RouteTypeBadge route_type={"Sport"} />
                    </View>
					<View style={styles.summaryLine}>
                        <ThemedText style={styles.summaryTypeCount}>
                            {stats.mixedTradCount}
                        </ThemedText>
                        <RouteTypeBadge route_type={"Mixed trad"} />
                    </View>
                    <View style={styles.summaryLine}>
                        <ThemedText style={styles.summaryTypeCount}>
                            {stats.tradCount}
                        </ThemedText>
                        <RouteTypeBadge route_type={"Trad"} />
                    </View>
                    <View style={styles.summaryLine}>
                        <ThemedText style={styles.summaryTypeCount}>
                            {stats.boulderCount}
                        </ThemedText>
                        <RouteTypeBadge route_type={"Boulder"} />
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
                {stats.weeklyChart.length === 0 ? (
                    <ThemedText style={styles.emptyText}>
                        Brak danych czasowych.
                    </ThemedText>
                ) : (
					<>
                        {selectedIndex >= 0 && selectedIndex < stats.weeklyChart.length && (
                            <View style={styles.selectedWeekHeader}>
                                <ThemedText style={styles.selectedWeekDate}>
                                    {(() => {
                                        const label = stats.weeklyChart[selectedIndex].label;
                                        // Parsowanie ręczne YYYY-MM-DD
                                        const parts = label.split('-');
                                        const startDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                        
                                        if (isNaN(startDate.getTime())) return label;

                                        const months = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

                                        const formatDateShort = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;

                                        // Oblicz poniedziałek bieżącego tygodnia
                                        const now = new Date();
                                        const day = now.getDay();
                                        const mondayShift = day === 0 ? -6 : 1 - day;
                                        const currentMonday = new Date(now);
                                        currentMonday.setHours(0, 0, 0, 0);
                                        currentMonday.setDate(currentMonday.getDate() + mondayShift);
                                        
                                        const toISO = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

                                        if (label === toISO(currentMonday)) {
                                            return "W tym tygodniu";
                                        }

                                        // Oblicz niedzielę (koniec tygodnia)
                                        const endDate = new Date(startDate);
                                        endDate.setDate(endDate.getDate() + 6);
                                        
                                        return `${formatDateShort(startDate)} - ${formatDateShort(endDate)} ${endDate.getFullYear()}`;
                                    })()}
                                </ThemedText>
                                <View style={styles.selectedWeekStats}>
                                    <ThemedText style={[styles.summaryTitleNumber, {backgroundColor: Colors.primary},]}>
										{stats.weeklyChart[selectedIndex].count}
									</ThemedText>
                                </View>
                            </View>
                        )}
                        <View>
                            <View style={{ width: "100%"}}>
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
                                            x2={Math.max(12, lineChartWidth - 35)}
                                            y2="108"
                                            stroke={theme.border}
                                            strokeWidth="1"
                                        />
                                        <Line
                                            x1="12"
                                            y1="60"
                                            x2={Math.max(12, lineChartWidth - 35)}
                                            y2="60"
                                            stroke={theme.border}
                                            strokeWidth="1"
                                            opacity="0.5"
                                        />
                                        <Line
                                            x1="12"
                                            y1="12"
                                            x2={Math.max(12, lineChartWidth - 35)}
                                            y2="12"
                                            stroke={theme.border}
                                            strokeWidth="1"
                                            opacity="0.25"
                                        />

                                        <SvgText x={Math.max(12, lineChartWidth - 22)} y="110" fill={theme.text} fontSize="12" opacity={0.7}>
                                            0
                                        </SvgText>
                                        <SvgText x={Math.max(12, lineChartWidth - 22)} y="64" fill={theme.text} fontSize="12" opacity={0.7}>
                                            {Math.ceil(maxWeeklyCount / 2)}
                                        </SvgText>
                                        <SvgText x={Math.max(12, lineChartWidth - 22)} y="16" fill={theme.text} fontSize="12" opacity={0.7}>
                                            {maxWeeklyCount}
                                        </SvgText>

                                        {fillPoints ? (
                                            <Polygon
                                                points={fillPoints}
                                                fill={Colors.primary}
                                                opacity={0.5}
                                            />
                                        ) : null}

                                        {linePoints.length > 1 ? (
                                            <Polyline
                                                points={polylinePoints}
                                                fill="none"
                                                stroke={Colors.primary}
                                                strokeWidth="2"
                                            />
                                        ) : null}

                                        {linePoints.map((point, index) => {
                                            const isSelected = selectedIndex === index;
                                            const touchWidth = Math.max(15, (lineChartWidth - 47) / Math.max(1, stats.weeklyChart.length));
                                            return (
                                                <React.Fragment key={`point-${index}`}>
                                                    {isSelected && (
                                                        <Line
                                                            x1={point.x}
                                                            y1="12"
                                                            x2={point.x}
                                                            y2="108"
                                                            stroke={theme.iconColourFocused}
                                                            strokeWidth="2"
                                                            strokeDasharray="6 4"
                                                            opacity="0.7"
                                                        />
                                                    )}
                                                    <Circle
                                                        cx={point.x}
                                                        cy={point.y}
                                                        r={isSelected ? "5" : "3.5"}
                                                        fill={Colors.primary}
                                                        stroke={Colors.primary}
                                                        strokeWidth={isSelected ? "2.5" : "1.2"}
                                                    />
                                                    <Rect
                                                        x={point.x - touchWidth / 2}
                                                        y="0"
                                                        width={touchWidth}
                                                        height="120"
                                                        fill="transparent"
                                                        onPress={() => setSelectedIndex(index)}
                                                    />
                                                </React.Fragment>
                                            );
                                        })}
                                    </Svg>
                                </View>
                                <View style={styles.weeklyLabelsRow}>
                                    {stats.weeklyChart.map((item, index) => {
                                        const months = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
                                        const parts = item.label.split('-');
                                        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                        const monthStr = months[date.getMonth()];
                                        
                                        let prevMonthStr = null;
                                        if (index > 0) {
                                            const prevParts = stats.weeklyChart[index - 1].label.split('-');
                                            const prevDate = new Date(parseInt(prevParts[0]), parseInt(prevParts[1]) - 1, parseInt(prevParts[2]));
                                            prevMonthStr = months[prevDate.getMonth()];
                                        }
                                        
                                        const isNewMonth = monthStr !== prevMonthStr;

                                        if (!isNewMonth) return null;

                                        const point = linePoints[index];
                                        if (!point) return null;

                                        return (
                                            <View
                                                key={`month-${index}`}
                                                style={{
                                                    position: "absolute",
                                                    left: point.x - 20,
                                                    width: 40,
                                                    alignItems: "center",
                                                }}
                                            >
                                                <ThemedText style={styles.weeklyLabel}>{monthStr}</ThemedText>
                                            </View>
                                        );
                                    })}
                                </View>
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
        paddingTop: Platform.select({ ios: 18, android: 18, web: 0 }),
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
        minWidth: "20%",
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
		textTransform: "uppercase",
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
		textTransform: "uppercase",
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
        minHeight: 16,
        position: "relative",
    },
    weeklyLabelCell: {
        alignItems: "center",
        flex: 1,
    },
    weeklyLabel: {
        fontSize: 11,
        opacity: 0.85,
        textTransform: "capitalize",
    },
    weeklyCount: {
        fontSize: 13,
        fontWeight: "700",
        marginTop: 2,
    },
    selectedWeekHeader: {
		display: "flex",
		flexDirection:"row",
		justifyContent: "space-between",
        paddingHorizontal: 10,
		paddingBottom: 10,
        borderRadius: 8,
    },
    selectedWeekDate: {
		display: "flex",
		alignItems: "center",
		textAlignVertical: "center",
        fontSize: 18,
        fontWeight: 700,
    },
    selectedWeekStats: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    selectedWeekCount: {
        fontSize: 18,
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

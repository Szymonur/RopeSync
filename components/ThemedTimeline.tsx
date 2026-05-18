import React, { useEffect, useState, useMemo, useRef } from "react";
import {
    StyleSheet,
    View,
    ScrollView,
    ActivityIndicator,
    PanResponder,
    Animated,
} from "react-native";
import { File, Directory, Paths } from "expo-file-system";
import ThemedText from "./ThemedText";
import Spacer from "../components/Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

// Konfiguracja wizualna
const EVENT_CARD_HEIGHT = 60;

const CARD_MIN_GAP = 70; // Minimalny odstęp między początkami kart (w pikselach)
const SCALE_COLLISION_THRESHOLD = 15; // Próg kolizji ze skalą (w pikselach)

interface ThemedTimelineProps {
    uriTimeline: string;
}

const ThemedTimeline = ({ uriTimeline }: ThemedTimelineProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const [timelineData, setTimelineData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scaleFactor, setScaleFactor] = useState<number>(45);
    const [initialZoomDistance, setInitialZoomDistance] = useState<number>(0);
    const [prevZoomDistance, setPrevZoomDistance] = useState<number>(0);
    const [maxTimelineHeight, setMaxTimelineHeight] = useState<number>(0);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const [contentHeightRatio, setContentHeightRatio] = useState<number>(0);

    const [isDuringZoom, setIsDuringZoom] = useState<boolean>(false);

    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        const loadTimeline = async () => {
            if (!uriTimeline) {
                setError("Brak ścieżki do danych timeline.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const file = new File(Paths.document, uriTimeline);

                if (!file.exists) {
                    throw new Error(
                        `Plik wspinaczki nie istnieje (${uriTimeline})`,
                    );
                }

                const content = await file.textSync();
                const jsonContent = JSON.parse(content);

                setTimelineData(jsonContent);

                // Dynamiczne obliczanie max wysokości
                if (
                    jsonContent.timeline &&
                    Array.isArray(jsonContent.timeline)
                ) {
                    const highestPoint = Math.max(
                        ...jsonContent.timeline.map((item: any) => item.height),
                        0,
                    );
                    setMaxTimelineHeight(Math.ceil(highestPoint));
                }
            } catch (err: any) {
                console.error("Błąd ładowania timeline:", err);
                setError(`Błąd: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadTimeline();
    }, [uriTimeline]);

    // 1. Logika obliczania pozycji zdarzeń (unikanie kolizji)
    const processedEvents = useMemo(() => {
        if (!timelineData?.timeline) return [];

        // Sortujemy po wysokości (od dołu do góry)
        const sorted = [...timelineData.timeline].sort(
            (a, b) => a.height - b.height,
        );

        let lastDisplayY = -Infinity;

        return sorted.map((item) => {
            const idealY = item.height * scaleFactor;
            // Karta musi być przynajmniej CARD_MIN_GAP powyżej poprzedniej
            const displayY = Math.max(idealY, lastDisplayY + CARD_MIN_GAP);
            lastDisplayY = displayY;

            return {
                ...item,
                idealY,
                displayY,
                hasStalk: displayY > idealY + 5, // Czy rysować linię łączącą
            };
        });
    }, [timelineData, scaleFactor]);

    // 2. Logika sprawdzania kolizji ze skalą
    const shouldShowScaleMark = (height: number) => {
        const scaleY = height * scaleFactor;
        // Ukryj jeśli dowolne zdarzenie jest zbyt blisko (idealY to miejsce etykiety metrażu zdarzenia)
        return !processedEvents.some(
            (event) =>
                Math.abs(event.idealY - scaleY) < SCALE_COLLISION_THRESHOLD,
        );
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case "fall":
                return Colors.warning;
            case "clip":
                return "#44AAFF";
            case "anchor":
                return "#44FF44";
            default:
                return theme.iconColour;
        }
    };

    const getDistance = (touches: any[]) => {
        const dx = Math.abs(touches[0].locationX - touches[1].locationX);
        const dy = Math.abs(touches[0].locationY - touches[1].locationY);
        return Math.sqrt(dx * dx + dy * dy);
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (evt) =>
            evt.nativeEvent.touches.length >= 2, // aktywacja tylko gdy są 2 pukty dotyku

        onPanResponderGrant: (event, gestureState) => {
            const touches = event.nativeEvent.touches;
            if (touches.length >= 2) {
                setIsDuringZoom(true);
                const touches = event.nativeEvent.touches;
                const distance = getDistance(touches);
                setInitialZoomDistance(distance);
            }
        },

        onPanResponderMove: (event, gestureState) => {
            const touches = event.nativeEvent.touches;

            if (touches.length >= 2) {
                const distance =
                    getDistance(touches) - // róznica dystansu między palcami
                    initialZoomDistance - // odejmujemy początkowy dystans aby liczyła się tylko róznica
                    prevZoomDistance; // odejmujmey poprzednią róznicę dystansu aby zapobiec kumulowaniu się przyblizena

                const isNegative = distance < 0;
                const zoom =
                    (Math.sqrt(Math.abs(distance)) * (isNegative ? -1 : 1)) / 2; // pierwastek i dzielenie aby spowolnić i wygładzić przyblianie
                const finalScaleFactor = zoom + scaleFactor;
                if (finalScaleFactor > 40 && finalScaleFactor < 200) {
                    setScaleFactor(zoom + scaleFactor);
                }
                handeFixLauoutWhenZoom();
                setPrevZoomDistance(distance);
            }
        },
        onPanResponderRelease: () => {
            setIsDuringZoom(false);
        },
    });

    const handeFixLauoutWhenZoom = () => {
        scrollViewRef.current?.scrollTo({
            x: 0,
            y: contentHeightRatio * contentHeight,
            animated: false,
        });
    };

    if (loading) {
        return (
            <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="large" color={theme.text} />
                <ThemedText style={{ marginTop: 10 }}>
                    Ładowanie danych...
                </ThemedText>
            </View>
        );
    }

    if (error || !timelineData) {
        return (
            <View style={{ padding: 20, alignItems: "center" }}>
                <Ionicons
                    name="alert-circle-outline"
                    size={40}
                    color={Colors.warning}
                />
                <ThemedText
                    style={{
                        color: Colors.warning,
                        textAlign: "center",
                        marginTop: 10,
                    }}
                >
                    {error || "Błąd danych."}
                </ThemedText>
            </View>
        );
    }

    return (
        <>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={24}
                style={{ transform: [{ scaleY: -1 }] }}
                onContentSizeChange={(contentWidth, contentHeight) => {
                    setContentHeight(contentHeight);
                }}
                onScroll={(e) => {
                    if (!isDuringZoom) {
                        setContentHeightRatio(
                            e.nativeEvent.contentOffset.y / contentHeight,
                        );
                    }
                }}
            >
                <View
                    style={[
                        styles.container,
                        {
                            height: Math.max(
                                maxTimelineHeight * scaleFactor,
                                (processedEvents[processedEvents.length - 1]
                                    ?.displayY || 0) + 100,
                            ),
                            transform: [{ scaleY: -1 }],
                        },
                    ]}
                    {...panResponder.panHandlers}
                >
                    {/* Oś pionowa */}
                    <View
                        style={[
                            styles.verticalLine,
                            { backgroundColor: theme.text },
                        ]}
                    />

                    {/* Skala wysokości (tylko te co nie kolidują) */}
                    {Array.from({
                        length: Math.ceil(maxTimelineHeight / 5) + 1,
                    }).map((_, i) => {
                        const h = i * 5;
                        if (!shouldShowScaleMark(h)) return null;
                        return (
                            <View
                                key={h}
                                style={[
                                    styles.scaleMark,
                                    { bottom: h * scaleFactor },
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.scaleText,
                                        { color: theme.iconColour },
                                    ]}
                                >
                                    {h} m —
                                </ThemedText>
                            </View>
                        );
                    })}

                    {/* Eventy */}
                    {processedEvents.map((item: any, index: number) => {
                        const event = item.events[0];
                        const eventColor = getEventColor(event.type);

                        return (
                            <React.Fragment key={index}>
                                {/* 1. Kropka i etykieta wysokości na osi (zawsze w idealnym miejscu) */}
                                <View
                                    style={[
                                        styles.axisPoint,
                                        { bottom: item.idealY },
                                    ]}
                                >
                                    <View style={styles.heightLabelWrapper}>
                                        <ThemedText
                                            style={styles.heightLabelText}
                                        >
                                            {item.height} m
                                        </ThemedText>
                                    </View>
                                    <View
                                        style={[
                                            styles.dot,
                                            {
                                                backgroundColor: eventColor,
                                                borderColor: theme.background,
                                            },
                                        ]}
                                    />
                                </View>

                                {/* 2. Stałka (łącznik) jeśli jest przesunięcie */}
                                {item.hasStalk && (
                                    <>
                                        <View
                                            style={[
                                                styles.stalkVertical,
                                                {
                                                    bottom: item.idealY + 10,
                                                    height:
                                                        item.displayY -
                                                        item.idealY,
                                                    backgroundColor: eventColor,
                                                    opacity: 0.6,
                                                },
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.stalkHorizontal,
                                                {
                                                    bottom: item.displayY + 10,
                                                    backgroundColor: eventColor,
                                                    opacity: 0.6,
                                                },
                                            ]}
                                        />
                                    </>
                                )}

                                {/* 3. Karta zdarzenia (może być przesunięta w górę) */}
                                <View
                                    style={[
                                        styles.cardWrapper,
                                        {
                                            bottom:
                                                10 +
                                                item.displayY -
                                                EVENT_CARD_HEIGHT / 2,
                                        },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.eventCard,
                                            {
                                                height: EVENT_CARD_HEIGHT,
                                                borderColor: eventColor,
                                                backgroundColor:
                                                    theme.uiBackground,
                                            },
                                        ]}
                                    >
                                        <View style={styles.cardHeader}>
                                            <ThemedText
                                                style={styles.eventType}
                                            >
                                                {event.type.toUpperCase()}
                                            </ThemedText>
                                            <ThemedText
                                                style={{ fontSize: 11 }}
                                            >
                                                <Ionicons
                                                    name="timer-outline"
                                                    size={11}
                                                    color={theme.text}
                                                />{" "}
                                                {Math.floor(
                                                    item.timestamp / 60,
                                                )}
                                                :
                                                {(item.timestamp % 60)
                                                    .toString()
                                                    .padStart(2, "0")}
                                            </ThemedText>
                                        </View>

                                        {event.type === "fall" && (
                                            <ThemedText
                                                style={styles.detailText}
                                            >
                                                Lot:{" "}
                                                <ThemedText bold>
                                                    {event.fallenDisnace}m
                                                </ThemedText>{" "}
                                                | Czas:{" "}
                                                <ThemedText bold>
                                                    {event.duration}s
                                                </ThemedText>{" "}
                                                | Siła:{" "}
                                                <ThemedText bold>
                                                    {event.force}kN
                                                </ThemedText>
                                            </ThemedText>
                                        )}
                                        {event.type === "clip" && (
                                            <ThemedText
                                                style={styles.detailText}
                                            >
                                                Wpinka:{" "}
                                                <ThemedText bold>
                                                    {event.clipingTime}s
                                                </ThemedText>{" "}
                                                | Siła:{" "}
                                                <ThemedText bold>
                                                    {event.force}kN
                                                </ThemedText>{" "}
                                                | Asek.:{" "}
                                                <ThemedText bold>
                                                    {event.belayRate}/10
                                                </ThemedText>
                                            </ThemedText>
                                        )}
                                    </View>
                                </View>
                            </React.Fragment>
                        );
                    })}
                </View>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        paddingVertical: 40,
        paddingLeft: 10,
        paddingRight: 15,
    },
    container: {
        width: "100%",
        position: "relative",
        marginLeft: 45,
    },
    verticalLine: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderRadius: 2,
    },
    scaleMark: {
        position: "absolute",
        left: -45,
        flexDirection: "row",
        alignItems: "center",
    },
    scaleText: {
        fontSize: 11,
        width: 40,
        textAlign: "right",
        opacity: 0.6,
    },
    axisPoint: {
        position: "absolute",
        left: -8,
        flexDirection: "row",
        alignItems: "center",
        zIndex: 10,
    },
    heightLabelWrapper: {
        left: -75,
        position: "absolute",
        width: 70,
    },
    heightLabelText: {
        fontSize: 12,
        textAlign: "right",
        fontWeight: "600",
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 3,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
    },
    stalkVertical: {
        position: "absolute",
        left: 6, // Po prawej od kropki
        width: 3,
        zIndex: 1,
    },
    stalkHorizontal: {
        position: "absolute",
        left: 6,
        width: 12,
        height: 3,
        zIndex: 1,
    },
    cardWrapper: {
        position: "absolute",
        left: 15,
        width: "85%",
    },
    eventCard: {
        padding: 10,
        borderRadius: 10,
        borderLeftWidth: 5,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    eventType: {
        fontWeight: "bold",
        fontSize: 13,
    },
    detailText: {
        fontSize: 12,
        lineHeight: 18,
    },
});

export default ThemedTimeline;

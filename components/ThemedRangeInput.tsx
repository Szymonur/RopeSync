import React, { useState } from "react";
import { StyleSheet, View, DimensionValue } from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";
import ThemedText from "./ThemedText";

interface ThemedRangeInputProps {
    min?: number;
    max?: number;
    value: number;
    onValueChange: (value: number) => void;
    label?: string;
}

const ThemedRangeInput = ({
    min = 20,
    max = 150,
    value,
    onValueChange,
    label,
}: ThemedRangeInputProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const [width, setWidth] = useState(0);

    const handleTouch = (e: any) => {
        if (width <= 0) return;
        const x = e.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, x / width));
        const newValue = Math.round(ratio * (max - min) + min);
        onValueChange(newValue);
    };

    const progress =
        `${((value - min) / (max - min)) * 100}%` as DimensionValue;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <ThemedText style={styles.label}>{label}</ThemedText>
                <ThemedText bold>{value} px/m</ThemedText>
            </View>

            <View
                style={styles.trackContainer}
                onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleTouch}
                onResponderMove={handleTouch}
            >
                <View
                    style={[
                        styles.track,
                        { backgroundColor: theme.iconColour + "33" },
                    ]}
                    pointerEvents="none"
                >
                    <View
                        style={[
                            styles.activeTrack,
                            { width: progress, backgroundColor: "#44AAFF" },
                        ]}
                    />
                </View>
                <View
                    style={[
                        styles.thumb,
                        {
                            left: progress,
                            backgroundColor: theme.background,
                            borderColor: "#44AAFF",
                        },
                    ]}
                    pointerEvents="none"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 15 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    label: { opacity: 0.6, fontSize: 12 },
    trackContainer: {
        height: 40,
        justifyContent: "center",
        position: "relative",
    },
    track: { height: 6, borderRadius: 3, width: "100%", overflow: "hidden" },
    activeTrack: { height: "100%" },
    thumb: {
        position: "absolute",
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 3,
        marginLeft: -11,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
    },
});

export default ThemedRangeInput;

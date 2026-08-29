import { StyleSheet, View } from "react-native";
import { Colors } from "../../constants/Colors";
import ThemedText from "../ThemedText";

interface RouteTypeBadgeProps {
    route_type: string;
}
const typeColors: Record<string, string> = {
    "Sport": Colors.sport,
    "Trad": Colors.trad,
    "Mixed trad": Colors.mixedTrad,
    "Boulder": Colors.boulder,
};

const RouteTypeBadge = ({ route_type }: RouteTypeBadgeProps) => {
    const badgeColor = typeColors[route_type] || Colors.boulder;

    return (
        <View style={[styles.badge, { backgroundColor: badgeColor, marginRight: 8 }]}>
            <ThemedText style={styles.typeText}>{route_type}</ThemedText>
        </View>
    );
};

export default RouteTypeBadge;

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    typeText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 12,
        lineHeight: 12, 
        includeFontPadding: false,
        textAlignVertical: "center",
    },
});
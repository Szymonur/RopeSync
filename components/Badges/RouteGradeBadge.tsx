import { StyleSheet, View } from "react-native";

import { Colors } from "../../constants/Colors";

import ThemedText from "../ThemedText";

interface RouteGradeBadgeProps {
    route_gade: string;
}

const RouteGradeBadge = ({ route_gade }: RouteGradeBadgeProps) => {
    return (
        <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
            <ThemedText style={styles.gradeText}>{route_gade}</ThemedText>
        </View>
    );
};
export default RouteGradeBadge;

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    gradeText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 12,
    },
});

import { StyleSheet, View } from "react-native";

import { Colors } from "../../constants/Colors";

import ThemedText from "../ThemedText";

interface RouteTypeBadgeProps {
    route_type: string;
}

const RouteTypeBadge = ({ route_type }: RouteTypeBadgeProps) => {
    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor:
                        route_type == "sportowa"
                            ? Colors.sport
                            : route_type == "trad"
                              ? Colors.trad
                              : Colors.boulder,
                    marginRight: 8,
                },
            ]}
        >
            <ThemedText style={styles.gradeText}>{route_type}</ThemedText>
        </View>
    );
};
export default RouteTypeBadge;

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

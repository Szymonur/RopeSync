import { StyleSheet, View } from "react-native";

import { Colors } from "../../constants/Colors";

import ThemedText from "../ThemedText";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

interface RouteStyleBadgeProps {
    route_style: string;
}

const RouteStyleBadge = ({ route_style }: RouteStyleBadgeProps) => {
    const iconSize = 18;

    switch (route_style) {
        case "Flash":
            return (
                <View style={styles.badge}>
                    <FontAwesome name="flash" size={iconSize} color="black" />
                </View>
            );
        case "OS":
            return (
                <View style={styles.badge}>
                    <FontAwesome name="eye" size={iconSize} color="black" />
                </View>
            );
        case "RP":
            return (
                <View style={styles.badge}>
                    <FontAwesome
                        name="dot-circle-o"
                        size={iconSize}
                        color="red"
                    />
                </View>
            );
        case "AF":
            return (
                <View style={styles.badge}>
                    <FontAwesome6 name="dog" size={iconSize} color="black" />;
                </View>
            );
        case "TR":
            return (
                <View style={styles.badge}>
                    <FontAwesome6 name="fish" size={iconSize} color="black" />;
                </View>
            );
        default:
            return <></>;
            break;
    }
};
export default RouteStyleBadge;

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
});

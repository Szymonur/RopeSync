import { StyleSheet, View } from "react-native";

import { Colors } from "../../constants/Colors";
import { useTheme } from "../../contexts/ThemeContext";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

interface RouteStyleBadgeProps {
    route_style: string;
}

const RouteStyleBadge = ({ route_style }: RouteStyleBadgeProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const iconSize = 18;
    const fontColor = theme.text;

    switch (route_style) {
        case "Flash":
            return (
                <View style={styles.badge}>
                    <FontAwesome
                        name="flash"
                        size={iconSize}
                        color={fontColor}
                    />
                </View>
            );
        case "OS":
            return (
                <View style={styles.badge}>
                    <FontAwesome name="eye" size={iconSize} color={fontColor} />
                </View>
            );
        case "RP":
            return (
                <View style={styles.badge}>
                    <View
                        style={{
                            backgroundColor: Colors.error,
                            height: iconSize,
                            width: iconSize,
                            borderRadius: 50,
                        }}
                    ></View>
                </View>
            );
        case "AF":
            return (
                <View style={styles.badge}>
                    <FontAwesome6
                        name="dog"
                        size={iconSize}
                        color={fontColor}
                    />
                </View>
            );
        case "TR":
            return (
                <View style={styles.badge}>
                    <FontAwesome6
                        name="fish"
                        size={iconSize}
                        color={fontColor}
                    />
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

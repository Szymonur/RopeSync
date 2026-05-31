import React from "react";
import { View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNetwork } from "../contexts/NetworkContext";
import { useTheme } from "../contexts/ThemeContext";
import { Colors } from "../constants/Colors";

const OfflineHeaderIcon = () => {
    const { isConnected } = useNetwork();
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    if (isConnected !== false) return null;

    return (
        <View style={styles.container}>
            <Ionicons
                name="cloud-offline-outline"
                size={20}
                color={theme.iconColour}
            />
        </View>
    );
};

export default OfflineHeaderIcon;

const styles = StyleSheet.create({
    container: {
        marginLeft: 20,
        marginRight: 10,
        justifyContent: "center",
        alignItems: "center",
    },
});

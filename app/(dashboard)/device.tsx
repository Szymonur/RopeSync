import { StyleSheet } from "react-native";

import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";

const Device = () => {
    return (
        <ThemedView style={styles.container} safe>
            <ThemedText title={true} style={styles.heading}>
                Device
            </ThemedText>
            <Spacer />

            <ThemedText>Paring devices in future</ThemedText>
            <Spacer />
        </ThemedView>
    );
};

export default Device;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    heading: {
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
    },
});

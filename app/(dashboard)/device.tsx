import { StyleSheet } from "react-native";

import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";

import { requestBluetoothPermissions } from "../../lib/utils/bluetoothPermissions";

const Device = () => {
    const handlePairing = async () => {
        const result = await requestBluetoothPermissions();
        if (result) {
            alert("Uprawnienia przyznane! Rozpoczynam parowanie...");
            console.log("Uprawnienia przyznane!");
        }
    };
    return (
        <ThemedView style={styles.container} safe>
            <ThemedText title={true} style={styles.heading}>
                Device
            </ThemedText>
            <Spacer />
            <Spacer />
            <ThemedButton onPress={handlePairing}>
                <ThemedText>Scan for device</ThemedText>
            </ThemedButton>
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

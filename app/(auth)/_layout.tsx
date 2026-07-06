import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar"
import {StyleSheet } from "react-native";
import ThemedView from "../../components/ThemedView"

export default function AuthLayout() {
    return (
        <ThemedView>	
			<ThemedView style={styles.centerContainer}>

				<StatusBar style="auto" />
				<Stack screenOptions={{ headerShown: false, animation: "none"}}  />
			</ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        width: "100%",
        maxWidth: 500,          // Maksymalna szerokość na webie
        alignSelf: "center",    // Wyśrodkowanie okna na środku ekranu!
    }
});
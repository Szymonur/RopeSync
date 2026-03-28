import { StyleSheet, Pressable, Text } from "react-native";
import { Link } from "expo-router";
import { Colors } from "../../constants/Colors";

import ThemedButton from "../../components/ThemedButton";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import Spacer from "../../components/Spacer";

const Login = () => {
    const handleSubmit = () => {
        console.log("Handle login");
    };
    return (
        <ThemedView style={styles.container} safe>
            <Spacer />
            <ThemedText title={true} style={styles.title}>
                Login To Tour Account
            </ThemedText>
            <ThemedButton onPress={handleSubmit}>
                <ThemedText style={{ textAlign: "center" }}> Login </ThemedText>
            </ThemedButton>
            <Spacer height={100} />

            <Link href="/register">
                <ThemedText style={{ textAlign: "center" }}>
                    Register instead
                </ThemedText>
            </Link>
        </ThemedView>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        textAlign: "center",
        fontSize: 18,
        marginBottom: 30,
    },
    btn: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 25,
    },
    pressed: {
        opacity: 0.8,
    },
});

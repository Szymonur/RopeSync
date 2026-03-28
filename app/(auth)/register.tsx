import { StyleSheet } from "react-native";
import { Link } from "expo-router";

import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";

import Spacer from "../../components/Spacer";

const Register = () => {
    const handleSubmit = () => {
        console.log("Handle register");
    };

    return (
        <ThemedView style={styles.container} safe>
            <Spacer />
            <ThemedText title={true} style={styles.title}>
                Register For an Account
            </ThemedText>
            <ThemedButton onPress={handleSubmit}>
                <ThemedText style={{ textAlign: "center" }}>
                    Register
                </ThemedText>
            </ThemedButton>
            <Spacer height={100} />

            <Link href="/login">
                <ThemedText style={{ textAlign: "center" }}>
                    Login instead
                </ThemedText>
            </Link>
        </ThemedView>
    );
};

export default Register;

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
});

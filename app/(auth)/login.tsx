import { StyleSheet, Alert } from "react-native";
import { Link } from "expo-router";
import { Colors } from "../../constants/Colors";

import ThemedButton from "../../components/ThemedButton";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedTextInput from "../../components/ThemedTextInput";
import Spacer from "../../components/Spacer";

import { useAuth } from "../../contexts/AuthContext";
import { useNetwork } from "../../contexts/NetworkContext";
import { useState } from "react";

const Login = () => {
    const { login } = useAuth();
    const { isConnected } = useNetwork();
    const [userLogin, setUserLogin] = useState("");
    const [userPassword, setUserPassword] = useState("");

    const handleSubmit = async () => {
        if (!isConnected) {
            Alert.alert("No internet", "You are currently offline. Please check your connection.", [{ text: "OK" }]);
            return;
        }

        try {
            const response = await fetch("http://192.168.18.2:8443/login", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: userLogin,
                    password: userPassword,
                }),
            });
            const json = await response.json();
            if (json.accesToken && json.refreshToken) {
                await login(json.accesToken, json.refreshToken);
            } else {
                Alert.alert(
                    "Login failed",
                    "You entered incorrect login credentials. ",
                    [{ text: "OK" }],
                );
            }
        } catch (error) {
            Alert.alert("Something went wrong!", `${error}`, [{ text: "OK" }]);
            console.error(error);
        }
    };
    return (
        <ThemedView style={styles.container} safe>
            <Spacer />
            <ThemedText title={true} style={styles.title}>
                Login
            </ThemedText>

            <ThemedTextInput
                placeholder="Login"
                style={{ width: "80%", marginBottom: 20 }}
                onChangeText={setUserLogin}
                value={userLogin}
            ></ThemedTextInput>
            <ThemedTextInput
                placeholder="Password"
                style={{ width: "80%", marginBottom: 20 }}
                keyboardType="visible-password"
                onChangeText={setUserPassword}
                value={userPassword}
            ></ThemedTextInput>

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

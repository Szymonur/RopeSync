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

    const [errorLogin, setErrorLogin] = useState("");
    const [errorPassword, setErrorPassword] = useState("");

    const API_URL = process.env.EXPO_PUBLIC_API_URL;

    const handleSubmit = async () => {
        if (!isConnected) {
            Alert.alert(
                "No internet",
                "You are currently offline. Please check your connection.",
                [{ text: "OK" }],
            );
            return;
        }

        const trimmedLogin = userLogin.trim();
        const trimmedPassword = userPassword.trim();

        trimmedLogin ? setErrorLogin("") : setErrorLogin("Enter your login!");
        trimmedPassword
            ? setErrorPassword("")
            : setErrorPassword("Enter your Password!");

        if (!trimmedLogin || !trimmedPassword) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: trimmedLogin,
                    password: trimmedPassword,
                }),
            });
            const json = await response.json();

            if (json.accesToken && json.refreshToken) {
                await login(json.accesToken, json.refreshToken, json.id);
            } else {
                setErrorLogin("Invalid credentials");
                setErrorPassword("Invalid credentials");
            }
        } catch (error) {
            Alert.alert("Something went wrong!", `${error}`, [{ text: "OK" }]);
            console.error(error);
        }
    };
    return (
        <ThemedView style={styles.container} safe>
            <ThemedText title={true} style={styles.title}>
                Login
            </ThemedText>

            <ThemedTextInput
                autoFocus
                label="Login or email"
                autoCapitalize="none"
                onChangeText={setUserLogin}
                value={userLogin}
                error={errorLogin ? errorLogin : ""}
                keyboardType="email-address"
                textContentType={"username"}
                autoComplete="username"
            ></ThemedTextInput>
            <ThemedTextInput
                label="Password"
                onChangeText={setUserPassword}
                autoCapitalize="none"
                isPassword={true}
                value={userPassword}
                error={errorPassword ? errorPassword : ""}
                textContentType="password"
                autoComplete="password"
            ></ThemedTextInput>

            <ThemedButton onPress={handleSubmit} style={{ width: "100%" }}>
                <ThemedText style={{ textAlign: "center" }}> Login </ThemedText>
            </ThemedButton>
            <Spacer height={100} />

            <Link href="/register">
                <ThemedText style={{ textAlign: "center" }}>
                    Register instead
                </ThemedText>
            </Link>
            <Spacer />
            <Link href="/reset-password">
                <ThemedText style={{ textAlign: "center" }}>
                    Restart password
                </ThemedText>
            </Link>
        </ThemedView>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
    },
    title: {
        textAlign: "center",
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30,
    },
});

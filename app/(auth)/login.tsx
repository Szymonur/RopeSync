import { Alert, KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { Link } from "expo-router";
import { Colors } from "../../constants/Colors";

import ThemedButton from "../../components/ThemedButton";
import ThemedLogo from "../../components/ThemedLogo";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedTextInput from "../../components/ThemedTextInput";

import { useAuth } from "../../contexts/AuthContext";
import { useNetwork } from "../../contexts/NetworkContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useState } from "react";
import { createAuthStyles } from "../../theme/authStyles";

const Login = () => {
    const { login } = useAuth();
    const { isConnected } = useNetwork();
    const { colorScheme } = useTheme();
    const [userLogin, setUserLogin] = useState("");
    const [userPassword, setUserPassword] = useState("");
    const theme = Colors[colorScheme];
    const styles = createAuthStyles(theme, colorScheme === "dark");

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

        try {
            const response = await fetch(`${API_URL}/login`, {
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
        <ThemedView style={styles.screen} safe>
            <View pointerEvents="none" style={styles.topBlob} />
            <View pointerEvents="none" style={styles.bottomBlob} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.keyboardContainer}
            >
                <View style={styles.hero}>
                    <ThemedLogo style={styles.logo} resizeMode="contain" />
                </View>

                <View style={styles.formCard}>
                    <ThemedTextInput
                        placeholder="Username"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                        onChangeText={setUserLogin}
                        value={userLogin}
                    />
                    <ThemedTextInput
                        placeholder="Password"
                        secureTextEntry={true}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                        onChangeText={setUserPassword}
                        value={userPassword}
                    />

                    <ThemedButton onPress={handleSubmit} style={styles.button}>
                        <ThemedText style={styles.buttonLabel}>Log in</ThemedText>
                    </ThemedButton>
                </View>

                <Link href="/register" asChild>
                    <Pressable style={styles.registerLink}>
                        <ThemedText style={styles.registerText}>
                            Don&apos;t have an account? Create one
                        </ThemedText>
                    </Pressable>
                </Link>
            </KeyboardAvoidingView>
        </ThemedView>
    );
};

export default Login;

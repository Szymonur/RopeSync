import {
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedTextInput from "../../components/ThemedTextInput";
import Spacer from "../../components/Spacer";
import { FontAwesome6 } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

const ChooseNewPassword = () => {
    const { token } = useLocalSearchParams<{ token: string }>();
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordRepeatError, setPasswordRepeatError] = useState("");

    const passwordRequirements = [
        { label: "at least 8 characters", check: (p: string) => p.length >= 8 },
        { label: "lowercase letter", check: (p: string) => /[a-z]/.test(p) },
        { label: "uppercase letter", check: (p: string) => /[A-Z]/.test(p) },
        { label: "number", check: (p: string) => /[0-9]/.test(p) },
        {
            label: "special character",
            check: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
        },
    ];

    const API_URL = process.env.EXPO_PUBLIC_API_URL;

    const handleSubmit = async () => {
        const trimmedPassword = password.trim();
        const trimmedPasswordRepeat = passwordRepeat.trim();

        const isPasswordValid = passwordRequirements.every((req) =>
            req.check(trimmedPassword),
        );
        const ifPasswordRepeatCorreclty = trimmedPassword === trimmedPasswordRepeat;

        if (!isPasswordValid) {
            setPasswordError("Password does not meet requirements!");
        } else {
            setPasswordError("");
        }

        if (!ifPasswordRepeatCorreclty) {
            setPasswordRepeatError("Passwords are not the same!");
        } else {
            setPasswordRepeatError("");
        }

        if (!isPasswordValid || !ifPasswordRepeatCorreclty || !token) {
            if (!token) Alert.alert("Error", "Invalid or missing reset token.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/reset-password/confirm`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    newPassword: trimmedPassword,
                }),
            });

            if (response.status === 200) {
                Alert.alert(
                    "Success",
                    "Your password has been reset successfully.",
                    [
                        {
                            text: "Login",
                            onPress: () => router.replace("/(auth)/login"),
                        },
                    ],
                );
            } else {
                const data = await response.json();
                Alert.alert("Error", data.message || "Something went wrong.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not connect to the server.");
        }
    };

    return (
        <ThemedView style={{ flex: 1 }} safe>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Spacer height={40} />

                    <ThemedText title={true} style={styles.title}>
                        Reset Password
                    </ThemedText>

                    <ThemedText style={styles.infoText}>
                        Please enter your new password below.
                    </ThemedText>

                    <Spacer height={20} />

                    <ThemedTextInput
                        label="New Password"
                        autoCapitalize="none"
                        isPassword={true}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (passwordError) setPasswordError("");
                        }}
                        value={password}
                        error={passwordError}
                        textContentType="newPassword"
                        autoComplete="password-new"
                    />

                    <ThemedView style={styles.requirementsContainer}>
                        {passwordRequirements.map((req, index) => {
                            const isMet = req.check(password);
                            return (
                                <ThemedText
                                    key={index}
                                    style={[
                                        styles.requirementText,
                                        {
                                            color: isMet
                                                ? Colors.success
                                                : Colors.warning,
                                        },
                                    ]}
                                >
                                    {isMet ? (
                                        <FontAwesome6 size={10} name="check" />
                                    ) : (
                                        <FontAwesome6
                                            size={10}
                                            name="circle-exclamation"
                                        />
                                    )}{" "}
                                    {req.label}
                                </ThemedText>
                            );
                        })}
                    </ThemedView>

                    <ThemedTextInput
                        label="Repeat New Password"
                        autoCapitalize="none"
                        isPassword={true}
                        onChangeText={(text) => {
                            setPasswordRepeat(text);
                            if (passwordRepeatError) setPasswordRepeatError("");
                        }}
                        value={passwordRepeat}
                        error={passwordRepeatError}
                        textContentType="newPassword"
                        autoComplete="password-new"
                    />

                    <Spacer height={20} />

                    <ThemedButton onPress={handleSubmit}>
                        <ThemedText style={styles.buttonText}>
                            Reset Password
                        </ThemedText>
                    </ThemedButton>

                    <Spacer height={40} />
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
};

export default ChooseNewPassword;

const styles = StyleSheet.create({
    scrollContent: {
        justifyContent: "center",
        paddingHorizontal: 30,
    },
    title: {
        textAlign: "center",
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
    },
    infoText: {
        textAlign: "center",
        opacity: 0.7,
        marginBottom: 20,
    },
    buttonText: {
        textAlign: "center",
    },
    requirementsContainer: {
        marginBottom: 10,
        paddingLeft: 10,
    },
    requirementText: {
        fontSize: 12,
        marginBottom: 2,
    },
});

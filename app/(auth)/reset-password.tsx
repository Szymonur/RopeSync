import {
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { openInbox } from "react-native-email-link";

import { useState } from "react";

import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedTextInput from "../../components/ThemedTextInput";
import ThemedButton from "../../components/ThemedButton";
import Spacer from "../../components/Spacer";

import { useNetwork } from "../../contexts/NetworkContext";

import { validateEmail } from "../../lib/utils/vadidateEmail";

const resetPassword = () => {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");

    const { isConnected } = useNetwork();

    const router = useRouter();

    const handleEmailBlur = () => {
        if (email && !validateEmail(email.trim())) {
            setEmailError("Enter valid email address!");
        } else if (email) {
            setEmailError("");
        }
    };

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

        const trimmedEmail = email.trim();

        trimmedEmail ? setEmailError("") : setEmailError("Enter your Email!");

        if (trimmedEmail && !validateEmail(trimmedEmail)) {
            setEmailError("Enter valid email address!");
        }

        if (
            emailError ||
            !trimmedEmail ||
            (trimmedEmail && !validateEmail(trimmedEmail))
        ) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: trimmedEmail,
                }),
            });
            if (response.status === 400) {
                setEmailError("Enter correct Email!");
            }
            if (response.status === 200) {
                Alert.alert(
                    "Check your inbox",
                    "If an account exists for this email, we've sent a password reset link. Please check your spam folder just in case.",
                    [
                        {
                            text: "Back to Login",
                            style: "cancel",
                            onPress: () => router.replace("/(auth)/login"),
                        },
                        {
                            text: "Open Email App",
                            onPress: async () => {
                                try {
                                    await openInbox();
                                    router.replace("/(auth)/login");
                                } catch (error) {
                                    console.error(
                                        "Nie udało się otworzyć aplikacji email",
                                        error,
                                    );
                                    router.replace("/(auth)/login");
                                }
                            },
                        },
                    ],
                );
            }
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <ThemedView style={styles.container} safe>
            <Spacer height={80} />
            <ThemedText title={true} style={styles.title}>
                Reset password
            </ThemedText>
            <ThemedText title={true} style={styles.infoText}>
                Enter your email address and we’ll send you a link to reset your
                password.
            </ThemedText>
            <Spacer />
            <ThemedTextInput
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError("");
                }}
                onBlur={handleEmailBlur}
                value={email}
                error={emailError}
                textContentType="emailAddress"
                autoComplete="email"
            />
            <ThemedButton onPress={handleSubmit} style={{ width: "100%" }}>
                <ThemedText style={{ textAlign: "center" }}>Send</ThemedText>
            </ThemedButton>
        </ThemedView>
    );
};

export default resetPassword;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexGrow: 1,
        alignItems: "center",
        paddingHorizontal: 30,

    },
    title: {
        textAlign: "center",
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30,
    },
    content: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 30,
    },
    infoText: {
        textAlign: "center",
    },
});

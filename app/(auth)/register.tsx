import {
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";

import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedTextInput from "../../components/ThemedTextInput";
import Spacer from "../../components/Spacer";

import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";

const Register = () => {
    const [userLogin, setUserLogin] = useState("");
    const [userPassword, setUserPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    const router = useRouter();

    const API_URL = process.env.EXPO_PUBLIC_API_URL;

    const handleSubmit = async () => {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: userLogin,
                password: userPassword,
                firstName,
                lastName,
                email,
            }),
        });
        if (response.status === 400) {
            Alert.alert("Registration failed", "Enter credentials.", [
                { text: "OK" },
            ]);
        }
        if (response.status === 409) {
            Alert.alert(
                "Registration failed",
                "A user with that username already exists! Please choose a different username.",
                [{ text: "OK" }],
            );
        }

        if (response.status === 201) {
            Alert.alert("Registration succeed", "Now login to yout acount.", [
                { text: "OK", onPress: () => router.replace("/(auth)/login") },
            ]);
        }
    };

    return (
        <ThemedView style={styles.container} safe scroll>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <Spacer />
                <ThemedText title={true} style={styles.title}>
                    Register
                </ThemedText>

                <ThemedTextInput
                    placeholder="First Name"
                    style={styles.input}
                    onChangeText={setFirstName}
                    value={firstName}
                ></ThemedTextInput>
                <ThemedTextInput
                    placeholder="Last Name"
                    style={styles.input}
                    onChangeText={setLastName}
                    value={lastName}
                ></ThemedTextInput>
                <ThemedTextInput
                    placeholder="Email"
                    style={styles.input}
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    value={email}
                ></ThemedTextInput>
                <ThemedTextInput
                    placeholder="Login"
                    style={styles.input}
                    onChangeText={setUserLogin}
                    value={userLogin}
                ></ThemedTextInput>
                <ThemedTextInput
                    placeholder="Password"
                    style={styles.input}
                    secureTextEntry={true}
                    onChangeText={setUserPassword}
                    value={userPassword}
                ></ThemedTextInput>

                <ThemedButton onPress={handleSubmit}>
                    <ThemedText style={{ textAlign: "center" }}>
                        Register
                    </ThemedText>
                </ThemedButton>
                <Spacer height={50} />

                <Link href="/login">
                    <ThemedText style={{ textAlign: "center" }}>
                        Login instead
                    </ThemedText>
                </Link>
                <Spacer height={50} />
            </KeyboardAvoidingView>
        </ThemedView>
    );
};

export default Register;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        textAlign: "center",
        fontSize: 18,
        marginBottom: 30,
    },
    input: {
        width: "80%",
        marginBottom: 20,
    },
});

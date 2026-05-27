import {
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";

import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedTextInput from "../../components/ThemedTextInput";
import Spacer from "../../components/Spacer";

import { FontAwesome6 } from "@expo/vector-icons";

import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "../../constants/Colors";

const Register = () => {
    const [userLogin, setUserLogin] = useState("");
    const [userPassword, setUserPassword] = useState("");
    const [userPasswordRepeat, setUserPasswordRepeat] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    const [userLoginError, setUserLoginError] = useState("");
    const [userPasswordError, setUserPasswordError] = useState("");
    const [userPasswordRepeatError, setUserPasswordRepeatError] = useState("");
    const [firstNameError, setFirstNameError] = useState("");
    const [lastNameError, setLastNameError] = useState("");
    const [emailError, setEmailError] = useState("");

    const router = useRouter();
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const validateEmail = (email: string) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            );
    };

    const handleEmailBlur = () => {
        if (email && !validateEmail(email)) {
            setEmailError("Enter valid email address!");
        } else if (email) {
            setEmailError("");
        }
    };

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
        const ifPasswordRepeatCorreclty = userPassword == userPasswordRepeat;

        const isPasswordValid = passwordRequirements.every((req) =>
            req.check(userPassword),
        );
        if (!isPasswordValid) {
            setUserPasswordError("Password does not meet requirements!");
        }

        userLogin
            ? setUserLoginError("")
            : setUserLoginError("Enter your Login!");
        userPassword
            ? setUserPasswordError("")
            : setUserPasswordError("Enter your Password!");
        userPasswordRepeat
            ? setUserPasswordRepeatError("")
            : setUserPasswordRepeatError("Repeat your password!");
        firstName
            ? setFirstNameError("")
            : setFirstNameError("Enter your First Name!");
        lastName
            ? setLastNameError("")
            : setLastNameError("Enter your Last Name!");
        email ? setEmailError("") : setEmailError("Enter your Email!");

        if (email && !validateEmail(email)) {
            setEmailError("Enter valid email address!");
        }

        if (!ifPasswordRepeatCorreclty) {
            setUserPasswordError("Passwords are not the same!");
            setUserPasswordRepeatError("Passwords are not the same!");
        }

        // return to not call api when data is missing
        if (
            !userLogin ||
            !userPassword ||
            !userPasswordRepeat ||
            !firstName ||
            !lastName ||
            !email ||
            !isPasswordValid ||
            (email && !validateEmail(email)) ||
            !ifPasswordRepeatCorreclty
        ) {
            return;
        }

        try {
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
                const json = await response.json();
                if (json.message.includes("USER_ALREADY_EXISTS")) {
                    setUserLoginError(
                        "An account with this login address already exists!",
                    );
                }
                if (json.message.includes("EMAIL_ALREADY_EXISTS")) {
                    setEmailError(
                        "An account with this email address already exists!",
                    );
                }
            }

            if (response.status === 201) {
                Alert.alert(
                    "Registration succeed",
                    "Now login to yout acount.",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace("/(auth)/login"),
                        },
                    ],
                );
            }
        } catch (error) {
            console.error("Network request failed", error);
            Alert.alert("Error", "Could not connect to the server.");
        }
    };

    return (
        <ThemedView style={{ flex: 1 }} safe>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Spacer height={40} />

                    <ThemedText title={true} style={styles.title}>
                        Register
                    </ThemedText>

                    <ThemedTextInput
                        label="First Name"
                        onChangeText={setFirstName}
                        value={firstName}
                        error={firstNameError}
                        autoFocus
                        textContentType="givenName"
                        autoComplete="name-given"
                    />
                    <ThemedTextInput
                        label="Last Name"
                        onChangeText={setLastName}
                        value={lastName}
                        error={lastNameError}
                        textContentType="familyName"
                        autoComplete="name-family"
                    />
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
                    <ThemedTextInput
                        label="Login"
                        autoCapitalize="none"
                        onChangeText={setUserLogin}
                        value={userLogin}
                        error={userLoginError}
                        textContentType="username"
                        autoComplete="username"
                    />
                    <ThemedTextInput
                        label="Password"
                        autoCapitalize="none"
                        isPassword={true}
                        onChangeText={(text) => {
                            setUserPassword(text);
                            if (userPasswordError) setUserPasswordError("");
                        }}
                        value={userPassword}
                        error={userPasswordError}
                        textContentType="newPassword"
                        autoComplete="password-new"
                    />

                    <ThemedView style={styles.requirementsContainer}>
                        {passwordRequirements.map((req, index) => {
                            const isMet = req.check(userPassword);
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
                        label="Repeat Password"
                        autoCapitalize="none"
                        isPassword={true}
                        onChangeText={setUserPasswordRepeat}
                        value={userPasswordRepeat}
                        error={userPasswordRepeatError}
                        textContentType="newPassword"
                        autoComplete="password-new"
                    />

                    <Spacer height={20} />

                    <ThemedButton onPress={handleSubmit}>
                        <ThemedText style={styles.buttonText}>
                            Register
                        </ThemedText>
                    </ThemedButton>

                    <Spacer height={20} />

                    <Link href="/login" style={{ textAlign: "center" }}>
                        <ThemedText>Login instead</ThemedText>
                    </Link>
                    <Spacer height={40} />
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
};

export default Register;

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 30,
    },
    title: {
        textAlign: "center",
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30,
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

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

import { useNetwork } from "../../contexts/NetworkContext";
import { useSnackbar } from "../../contexts/SnackbarContext";
import { useRepositories } from "../../contexts/RepositoryContext";


import { validateEmail } from "../../lib/utils/vadidateEmail";

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

    const { isConnected } = useNetwork();
	const { showSnackbar } = useSnackbar();
	const { userRepository } = useRepositories();


    const router = useRouter();
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const handleEmailBlur = () => {
        if (email && !validateEmail(email.trim())) {
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
        const trimmedPasswordRepeat = userPasswordRepeat.trim();
        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();
        const trimmedEmail = email.trim();

        const ifPasswordRepeatCorreclty = trimmedPassword == trimmedPasswordRepeat;

        const isPasswordValid = passwordRequirements.every((req) =>
            req.check(trimmedPassword),
        );
        if (!isPasswordValid) {
            setUserPasswordError("Password does not meet requirements!");
        }

        trimmedLogin
            ? setUserLoginError("")
            : setUserLoginError("Enter your Login!");
        trimmedPassword
            ? setUserPasswordError("")
            : setUserPasswordError("Enter your Password!");
        trimmedPasswordRepeat
            ? setUserPasswordRepeatError("")
            : setUserPasswordRepeatError("Repeat your password!");
        trimmedFirstName
            ? setFirstNameError("")
            : setFirstNameError("Enter your First Name!");
        trimmedLastName
            ? setLastNameError("")
            : setLastNameError("Enter your Last Name!");
        trimmedEmail ? setEmailError("") : setEmailError("Enter your Email!");

        if (trimmedEmail && !validateEmail(trimmedEmail)) {
            setEmailError("Enter valid email address!");
        }

        if (!ifPasswordRepeatCorreclty) {
            setUserPasswordError("Passwords are not the same!");
            setUserPasswordRepeatError("Passwords are not the same!");
        }

        if (
            !trimmedLogin ||
            !trimmedPassword ||
            !trimmedPasswordRepeat ||
            !trimmedFirstName ||
            !trimmedLastName ||
            !trimmedEmail ||
            !isPasswordValid ||
            (trimmedEmail && !validateEmail(trimmedEmail)) ||
            !ifPasswordRepeatCorreclty
        ) {
            return;
        }

        try {
            // Wywołanie repozytorium (zwraca response.data w przypadku sukcesu)
            await userRepository.register(
                trimmedLogin,
                trimmedPassword,
                trimmedEmail,
                trimmedFirstName,
                trimmedLastName
            );

            // Jeśli nie wyskoczył błąd, to znaczy że rejestracja się powiodła (np. status 201)
            router.replace("/login");
            showSnackbar({
                message: "Rejestracja powiodła się!",
                type: "success",
            });

        } catch (error: any) {
            // Axios wrzuci tutaj błąd z serwera (4xx, 5xx) lub błąd sieci
            // Sprawdzamy czy backend zwrócił odpowiedź z kodem statusu
            const status = error.response?.status;
            const message = error.response?.data?.message || "";

            if (status === 409) {
                if (message.includes("USER_ALREADY_EXISTS")) {
                    setUserLoginError("Konto z tym loginem już istnieje!");
                }
                if (message.includes("EMAIL_ALREADY_EXISTS")) {
                    setEmailError("Konto z tym adresem email już istnieje!");
                }
            } else if (status === 400) {
                showSnackbar({
                    message: "Błąd podczas rejestracji, wprowadź wszystkie poprawne dane.",
                    type: "error",
                });
            } else {
                // Błąd sieci lub inny niespodziewany błąd serwera (500)
                console.error("Network request failed", error);
                showSnackbar({
                    message: "Coś poszło nie tak! Sprawdź swoje połączenie sieciowe.",
                    type: "error",
                });
            }
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
                                                : Colors.error,
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

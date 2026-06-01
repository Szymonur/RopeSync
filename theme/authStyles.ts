import { StyleSheet } from "react-native";
import { ThemeColors } from "./palette";

export const createAuthStyles = (theme: ThemeColors, isDark: boolean) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: theme.background,
        },
        topBlob: {
            position: "absolute",
            top: -18,
            right: -42,
            width: 180,
            height: 110,
            borderBottomLeftRadius: 90,
            borderBottomRightRadius: 26,
            borderTopLeftRadius: 34,
            borderTopRightRadius: 22,
            backgroundColor: isDark ? theme.navBackground : theme.iconColourFocused,
            opacity: isDark ? 0.72 : 0.96,
        },
        bottomBlob: {
            position: "absolute",
            left: -32,
            bottom: -10,
            width: 220,
            height: 120,
            borderTopLeftRadius: 34,
            borderTopRightRadius: 96,
            borderBottomRightRadius: 18,
            backgroundColor: isDark ? theme.inputBackground : theme.iconColourFocused,
            opacity: isDark ? 0.84 : 1,
        },
        keyboardContainer: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 28,
        },
        hero: {
            width: "100%",
            alignItems: "center",
            marginBottom: 20,
        },
        logo: {
            width: 176,
            height: 176,
            marginBottom: 10,
        },
        formCard: {
            width: "100%",
            maxWidth: 380,
            paddingHorizontal: 20,
            paddingVertical: 22,
            borderRadius: 28,
            backgroundColor: theme.uiBackground,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: theme.iconColourFocused,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.07,
            shadowRadius: 18,
            elevation: 3,
        },
        input: {
            width: "100%",
            marginBottom: 14,
        },
        button: {
            marginTop: 8,
            width: "100%",
        },
        buttonLabel: {
            textAlign: "center",
            fontSize: 16,
            fontWeight: "700",
            color: theme.accentText,
        },
        registerLink: {
            marginTop: 18,
            paddingHorizontal: 18,
            paddingVertical: 12,
        },
        registerText: {
            textAlign: "center",
            fontSize: 14,
            fontWeight: "600",
            color: theme.iconColourFocused,
        },
    });
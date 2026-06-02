import React, { forwardRef, useState } from "react";
import {
    StyleProp,
    TextInput,
    TextStyle,
    TextInputProps,
    View,
    ViewStyle,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";
import ThemedText from "./ThemedText";
import { FontAwesome6 } from "@expo/vector-icons";

export interface ThemedTextInputProps extends TextInputProps {
    label?: string;
    labelStyle?: StyleProp<TextStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    error?: string;
    isPassword?: boolean;
}

const ThemedTextInput = forwardRef<TextInput, ThemedTextInputProps>(
    (
        {
            label,
            labelStyle,
            containerStyle,
            style,
            error,
            isPassword,
            secureTextEntry,
            ...rest
        },
        ref,
    ) => {
        const { colorScheme } = useTheme();
        const theme = Colors[colorScheme];
        const [isPasswordVisible, setIsPasswordVisible] = useState(false);

        // Unique ID for accessibility linkage
        const labelId = label
            ? `label-${label.replace(/\s+/g, "-").toLowerCase()}`
            : undefined;

        const togglePasswordVisibility = () => {
            setIsPasswordVisible(!isPasswordVisible);
        };

        const isSecure = isPassword ? !isPasswordVisible : secureTextEntry;

        return (
            <View style={[styles.container, containerStyle]}>
                {label && (
                    <ThemedText
                        nativeID={labelId}
                        style={[styles.label, labelStyle]}
                        bold
                    >
                        {label}
                    </ThemedText>
                )}
                <View style={styles.inputWrapper}>
                    <TextInput
                        ref={ref}
                        style={[
                            styles.input,
                            {
                                backgroundColor: theme.uiBackground,
                                color: theme.text,
                                borderColor: error
                                    ? Colors.error
                                    : "transparent",
                                paddingRight: isPassword ? 45 : 16,
                            },
                            style,
                        ]}
                        placeholderTextColor={theme.text + "80"} // 50% opacity for placeholder
                        accessibilityLabel={rest.accessibilityLabel || label}
                        accessibilityLabelledBy={labelId}
                        secureTextEntry={isSecure}
                        {...rest}
                    />
                    {isPassword && (
                        <TouchableOpacity
                            style={styles.iconContainer}
                            onPress={togglePasswordVisibility}
                        >
                            <FontAwesome6
                                name={isPasswordVisible ? "eye" : "eye-slash"}
                                size={18}
                                color={theme.text + "80"}
                            />
                        </TouchableOpacity>
                    )}
                </View>
                <ThemedText
                    style={[{ color: Colors.error }, styles.errorText]}
                >
                    {error ? error : ""}
                </ThemedText>
            </View>
        );
    },
);

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
        marginLeft: 4,
    },
    inputWrapper: {
        position: "relative",
        justifyContent: "center",
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
    },
    iconContainer: {
        position: "absolute",
        right: 12,
        padding: 4,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});

export default ThemedTextInput;

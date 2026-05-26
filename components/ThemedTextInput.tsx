import React, { forwardRef } from "react";
import {
    StyleProp,
    TextInput,
    TextStyle,
    TextInputProps,
    View,
    ViewStyle,
    StyleSheet,
} from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";
import ThemedText from "./ThemedText";

export interface ThemedTextInputProps extends TextInputProps {
    label?: string;
    labelStyle?: StyleProp<TextStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    error?: string;
}

const ThemedTextInput = forwardRef<TextInput, ThemedTextInputProps>(
    ({ label, labelStyle, containerStyle, style, error, ...rest }, ref) => {
        const { colorScheme } = useTheme();
        const theme = Colors[colorScheme];

        // Unique ID for accessibility linkage
        const labelId = label
            ? `label-${label.replace(/\s+/g, "-").toLowerCase()}`
            : undefined;

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
                <TextInput
                    ref={ref}
                    style={[
                        styles.input,
                        {
                            backgroundColor: theme.uiBackground,
                            color: theme.text,
                            borderColor: error ? Colors.warning : "transparent",
                        },
                        style,
                    ]}
                    placeholderTextColor={theme.text + "80"} // 50% opacity for placeholder
                    accessibilityLabel={rest.accessibilityLabel || label}
                    accessibilityLabelledBy={labelId}
                    {...rest}
                />
                <ThemedText
                    style={[{ color: Colors.warning }, styles.errorText]}
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
    input: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});

export default ThemedTextInput;

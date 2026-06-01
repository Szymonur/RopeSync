import {
    StyleSheet,
    Pressable,
    StyleProp,
    ViewStyle,
    PressableProps,
} from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

interface ThemedButtonProps extends PressableProps {
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

function ThemedButton({ style, children, ...rest }: ThemedButtonProps) {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    return (
        <Pressable
            style={({ pressed }) => [
                styles.btn,
                {
                    backgroundColor: theme.accent,
                    borderColor: theme.border,
                    shadowColor: theme.iconColourFocused,
                },
                pressed && styles.pressed,
                style,
            ]}
            {...rest}
        >
            {children}
        </Pressable>
    );
}
const styles = StyleSheet.create({
    btn: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 999,
        borderWidth: 1,
        marginVertical: 10,
        alignItems: "center",
        justifyContent: "center",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 3,
    },
    pressed: {
        opacity: 0.88,
        transform: [{ scale: 0.99 }],
    },
});

export default ThemedButton;

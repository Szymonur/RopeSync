import {
    StyleSheet,
    Pressable,
    StyleProp,
    ViewStyle,
    PressableProps,
} from "react-native";
import { Colors } from "../constants/Colors";

interface ThemedButtonProps extends PressableProps {
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

function ThemedButton({ style, children, ...rest }: ThemedButtonProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.btn,
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
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: 6,
        marginVertical: 10,
    },
    pressed: {
        opacity: 0.5,
    },
});

export default ThemedButton;

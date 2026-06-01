import { StyleSheet, StyleProp, View, ViewStyle } from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

interface ThemedCardProps {
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

const ThemedCard = ({ style, children }: ThemedCardProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const isDark = colorScheme === "dark";

    return (
        <View
            style={[
                {
                    backgroundColor: theme.uiBackground,
                    borderColor: theme.border,
                    shadowColor: isDark ? "#000" : theme.iconColourFocused,
                    borderWidth: isDark ? 1.4 : 1,
                },
                styles.card,
                style,
            ]}
            {...{ children }}
        />
    );
};

export default ThemedCard;

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
});

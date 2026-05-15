import {
    StyleSheet,
    StyleProp,
    View,
    ViewStyle,
} from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

interface ThemedCardProps {
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

const ThemedCard = ({ style, children }: ThemedCardProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    return (
        <View
            style={[
                {
                    backgroundColor: theme.uiBackground,
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
        borderRadius: 40,
        padding: 20,
    },
});

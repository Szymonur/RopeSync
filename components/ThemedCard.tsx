import {
    StyleSheet,
    StyleProp,
    View,
    ViewStyle,
    useColorScheme,
} from "react-native";
import { Colors } from "../constants/Colors";

interface ThemedCardProps {
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

const ThemedCard = ({ style, children }: ThemedCardProps) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || "light"];

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

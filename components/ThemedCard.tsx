import { StyleSheet, StyleProp, View, ViewStyle } from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

interface ThemedCardProps {
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
	selected?: boolean;
}

const ThemedCard = ({ style, children, selected = false }: ThemedCardProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const isLightMode = colorScheme === "light";
	const selectedColor = theme.uiBackgroundSelected;
    return (
        <View
            style={[
                {
                    shadowColor: theme.text,
                    backgroundColor: selected ? selectedColor : theme.uiBackground,
                },
                isLightMode && styles.lightModeShadow,
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
        borderRadius: 10,
        padding: 20,
        marginHorizontal: 2,
    },
    lightModeShadow: {
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});

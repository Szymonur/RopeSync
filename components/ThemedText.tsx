import { StyleProp, Text, TextStyle } from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

interface ThemedViewProps {
    style?: StyleProp<TextStyle>;
    children: React.ReactNode;
    title?: boolean;
    bold?: boolean;
}

const ThemedText = ({
    style,
    children,
    title = false,
    bold = false,
}: ThemedViewProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const textColor = title ? theme.title : theme.text;

    return (
        <Text
            style={[
                { color: textColor },
                bold && { fontWeight: "bold" },
                style,
            ]}
            {...{ children }}
        />
    );
};

export default ThemedText;

import { StyleProp, Text, TextStyle, TextProps } from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

interface ThemedTextProps extends TextProps {
    style?: StyleProp<TextStyle>;
    children: React.ReactNode;
    title?: boolean;
    bold?: boolean;
}//te typy są ważne!

const ThemedText = ({
    style,
    children,
    title = false,
    bold = false,
    ...rest
}: ThemedTextProps) => {
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
            {...rest}
        >
            {children}
        </Text>
    );
};

export default ThemedText;

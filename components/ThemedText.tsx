import { StyleProp, useColorScheme, Text, TextStyle } from "react-native";
import { Colors } from "../constants/Colors";

interface ThemedViewProps {
    style?: StyleProp<TextStyle>;
    children: React.ReactNode;
    title?: boolean;
}

const ThemedText = ({ style, children, title = false }: ThemedViewProps) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || "light"];

    const textColor = title ? theme.title : theme.text;

    return <Text style={[style, { color: textColor }]} {...{ children }} />;
};

export default ThemedText;

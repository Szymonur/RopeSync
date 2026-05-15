import {
    StyleProp,
    TextInput,
    TextStyle,
    TextInputProps,
} from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

const ThemedTextInput = ({ style, ...rest }: TextInputProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    return (
        <TextInput
            // Łączymy style domyślne z tymi przekazanymi z zewnątrz
            style={[
                {
                    backgroundColor: theme.uiBackground,
                    color: theme.text,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 6,
                    fontSize: 14,
                },
                style,
            ]}
            placeholderTextColor={theme.text}
            {...rest}
        />
    );
};

export default ThemedTextInput;

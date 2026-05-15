import {
    StyleProp,
    useColorScheme,
    TextInput,
    TextStyle,
    TextInputProps,
} from "react-native";
import { Colors } from "../constants/Colors";

const ThemedTextInput = ({ style, ...rest }: TextInputProps) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || "light"];

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

import {
    TextInput,
    TextInputProps,
} from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

const ThemedTextInput = ({ style, ...rest }: TextInputProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    return (
        <TextInput
            style={[
                {
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 999,
                    fontSize: 15,
                    borderWidth: 1,
                    borderColor: theme.border,
                },
                style,
            ]}
            placeholderTextColor={theme.mutedText}
            {...rest}
        />
    );
};

export default ThemedTextInput;

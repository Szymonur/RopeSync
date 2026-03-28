import { StyleProp, View, ViewStyle, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";

interface ThemedViewProps {
    style?: StyleProp<ViewStyle>;
    safe?: Boolean;
    children: React.ReactNode;
}

const ThemedView = ({ style, safe = false, children }: ThemedViewProps) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || "light"];

    if (!safe)
        return (
            <View
                style={[
                    {
                        backgroundColor: theme.background,
                    },
                    style,
                ]}
                {...{ children }}
            />
        );

    return (
        <SafeAreaView
            style={[
                {
                    backgroundColor: theme.background,
                    flex: 1,
                },
                style,
            ]}
            {...{ children }}
        />
    );
};

export default ThemedView;

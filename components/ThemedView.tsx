import { StyleProp, View, ViewStyle, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { useTheme } from "../contexts/ThemeContext";

interface ThemedViewProps {
    style?: StyleProp<ViewStyle>;
    safe?: boolean;
    scroll?: boolean;
    children: React.ReactNode;
}

const ThemedView = ({
    style,
    safe = false,
    scroll = false,
    children,
}: ThemedViewProps) => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    const content = scroll ? (
        <ScrollView
            contentContainerStyle={style}
            showsVerticalScrollIndicator={false}
            style={
                safe
                    ? undefined
                    : { flex: 1, backgroundColor: theme.background }
            }
        >
            {children}
        </ScrollView>
    ) : (
        <View
            style={[
                !safe && { backgroundColor: theme.background, flex: 1 },
                style,
            ]}
        >
            {children}
        </View>
    );

    if (safe) {
        return (
            <SafeAreaView
                style={{ flex: 1, backgroundColor: theme.background }}
            >
                {content}
            </SafeAreaView>
        );
    }

    return content;
};

export default ThemedView;

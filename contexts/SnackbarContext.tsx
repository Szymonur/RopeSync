import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
} from "react";
import {
    StyleSheet,
    Animated,
    View,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../components/ThemedText";
import { Colors } from "../constants/Colors";
import { useTheme } from "./ThemeContext";

export type SnackbarType = "success" | "info" | "warn" | "error";

interface SnackbarOptions {
    message: string;
    type?: SnackbarType;
    duration?: number;
}

interface SnackbarContextType {
    showSnackbar: (options: SnackbarOptions) => void;
    hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
    undefined,
);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState<SnackbarType>("info");
    const { colorScheme } = useTheme();
    const insets = useSafeAreaInsets();

    const translateY = useRef(new Animated.Value(-150)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hideSnackbar = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        Animated.timing(translateY, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
        });
    }, [translateY]);

    const showSnackbar = useCallback(
        ({ message, type = "info", duration = 3000 }: SnackbarOptions) => {
            if (timerRef.current) clearTimeout(timerRef.current);

            setMessage(message);
            setType(type);
            setVisible(true);

            translateY.setValue(-150);

            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 40,
                friction: 7,
            }).start();

            timerRef.current = setTimeout(() => {
                hideSnackbar();
            }, duration);
        },
        [hideSnackbar, translateY],
    );

    const getIcon = () => {
        switch (type) {
            case "success":
                return "checkmark-circle";
            case "error":
                return "alert-circle";
            case "warn":
                return "warning";
            case "info":
                return "information-circle";
            default:
                return "information-circle";
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case "success":
                return Colors.success;
            case "error":
                return Colors.error;
            case "warn":
                return Colors.warn; // Or define a specific warn color
            case "info":
                return Colors.info;
            default:
                return Colors.primary;
        }
    };

    return (
        <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
            {children}
            {visible && (
                <Animated.View
                    style={[
                        styles.container,
                        {
                            top: insets.top + 10,
                            backgroundColor: getBackgroundColor(),
                            transform: [{ translateY }],
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.content}
                        onPress={hideSnackbar}
                        activeOpacity={0.9}
                    >
                        <Ionicons name={getIcon()} size={24} color="#fff" />
                        <ThemedText style={styles.text}>{message}</ThemedText>
                        <Ionicons
                            name="close"
                            size={20}
                            color="rgba(255,255,255,0.7)"
                        />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </SnackbarContext.Provider>
    );
};

export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error("useSnackbar must be used within a SnackbarProvider");
    }
    return context;
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 16,
        right: 16,
        zIndex: 9999,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 56,
    },
    text: {
        flex: 1,
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        marginHorizontal: 12,
    },
});

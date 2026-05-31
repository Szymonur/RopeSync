import { StyleSheet } from "react-native";
import ThemedCard from "./ThemedCard";
import ThemedText from "./ThemedText";
import ThemedButton from "./ThemedButton";
import Spacer from "./Spacer";

interface ThemedEmptyStateProps {
    title: string;
    description: string | string[];
    buttonLabel: string;
    onButtonPress: () => void;
}

const ThemedEmptyState = ({
    title,
    description,
    buttonLabel,
    onButtonPress,
}: ThemedEmptyStateProps) => {
    const descriptionArray = Array.isArray(description) ? description : [description];

    return (
        <ThemedCard style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>{title}</ThemedText>
            <Spacer height={20} />

            {descriptionArray.map((text, index) => (
                <ThemedText key={index} style={styles.emptyText}>
                    {text}
                </ThemedText>
            ))}

            <Spacer />

            <ThemedButton onPress={onButtonPress}>
                <ThemedText style={styles.emptyButtonText}>{buttonLabel}</ThemedText>
            </ThemedButton>
        </ThemedCard>
    );
};

export default ThemedEmptyState;

const styles = StyleSheet.create({
    emptyCard: {
        marginTop: 24,
        paddingVertical: 40,
        paddingHorizontal: 18,
        height: "90%",
        display: "flex",
        justifyContent: "center",
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
    },
    emptyText: {
        opacity: 0.8,
        lineHeight: 20,
        textAlign: "center",
    },
    emptyButtonText: {
        fontWeight: "500",
        textAlign: "center",
    },
});

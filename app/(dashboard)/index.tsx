import { StyleSheet } from "react-native";

import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";

import ThemedTimeline from "../../components/ThemedTimeline";

const Index = () => {
    return (
        <ThemedView safe>
            <ThemedTimeline userId={3} />
            <Spacer />
        </ThemedView>
    );
};

export default Index;

const styles = StyleSheet.create({
    heading: {
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
    },
});

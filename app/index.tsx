import { StyleSheet, Text, View, Image } from "react-native";
import { Link } from "expo-router";

import ThemedView from "../components/ThemedView";
import ThemedCard from "../components/ThemedCard";
import ThemedImage from "../components/ThemedLogo";
import ThemedText from "../components/ThemedText";
import Spacer from "../components/Spacer";

const Home = () => {
    return (
        <ThemedView style={styles.container} safe>
            <ThemedImage style={styles.img} />

            <ThemedText style={styles.title} title={true}>
                Title
            </ThemedText>
            <ThemedText>Reading list app </ThemedText>
            <ThemedCard>
                <ThemedText> Card EXAMPLE</ThemedText>
            </ThemedCard>
            <Spacer />
            <Link style={styles.link} href="/login">
                <ThemedText>Login Page</ThemedText>
            </Link>
            <Link style={styles.link} href="/register">
                <ThemedText>Register Page</ThemedText>
            </Link>
            <Link style={styles.link} href="/profile">
                <ThemedText>Profile</ThemedText>
            </Link>
        </ThemedView>
    );
};

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
    },
    img: {
        width: 70,
        height: 50,
        marginVertical: 20,
    },
    link: {
        marginVertical: 10,
        borderBottomWidth: 1,
    },
});

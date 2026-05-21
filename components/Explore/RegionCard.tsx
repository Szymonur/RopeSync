import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import ThemedCard from "../ThemedCard";
import ThemedText from "../ThemedText";
import { Region } from "../../database/repositories/RegionRepository";

interface Props {
    region: Region;
}

const RegionCard = ({ region }: Props) => {
    const router = useRouter();

    return (
        <TouchableOpacity
            onPress={() =>
                router.push({
                    pathname: "/(dashboard)/region/[id]",
                    params: { id: region.id_rejonu.toString() },
                })
            }
        >
            <ThemedCard style={styles.card}>
                <ThemedText style={styles.bold}>
                    {region.nazwa_rejonu}
                </ThemedText>
                <ThemedText style={styles.subtext}>
                    {region.kraj || "Unknown country"}
                </ThemedText>
            </ThemedCard>
        </TouchableOpacity>
    );
};

export default RegionCard;

const styles = StyleSheet.create({
    card: {
        padding: 15,
        marginBottom: 10,
    },
    bold: {
        fontWeight: "bold",
        fontSize: 16,
    },
    subtext: {
        fontSize: 13,
        opacity: 0.7,
        marginTop: 2,
    },
});

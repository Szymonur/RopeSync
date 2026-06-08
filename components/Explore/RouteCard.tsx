import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import ThemedCard from "../ThemedCard";
import ThemedText from "../ThemedText";
import { RouteListItem } from "../../types/route";
import RouteTypeBadge from "../Badges/RouteTypeBadge";
import RouteGradeBadge from "../Badges/RouteGradeBadge";

interface Props {
    route: RouteListItem;
}

const RouteCard = ({ route }: Props) => {
    const router = useRouter();

    // Use wycena if skala is not available, but usually one of them should be there
    const grade = route.wycena || (route as any).skala;

    return (
        <TouchableOpacity
            onPress={() =>
                router.push({
                    pathname: "/(dashboard)/route/[id]",
                    params: { id: route.id_drogi },
                })
            }
        >
            <ThemedCard style={styles.card}>
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={styles.bold}>
                            {route.nazwa_drogi}
                        </ThemedText>
                        <ThemedText style={styles.subtext}>
                            {route.nazwa_skaly}
                        </ThemedText>
                    </View>

                    <RouteTypeBadge route_type={route.typ_drogi} />
                    <RouteGradeBadge route_grade={grade} />
                </View>
            </ThemedCard>
        </TouchableOpacity>
    );
};

export default RouteCard;

const styles = StyleSheet.create({
    card: {
        padding: 15,
        marginBottom: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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

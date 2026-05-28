import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import ThemedCard from "../ThemedCard";
import ThemedText from "../ThemedText";
import { RouteListItem } from "../../database/repositories/RouteRepository";
import { Colors } from "../../constants/Colors";
import Spacer from "../Spacer";

import RouteTypeBadge from "../Badges/RouteTypeBadge";
import RouteGradeBadge from "../Badges/RouteGradeBadge";

interface Props {
    route: RouteListItem;
}

const RouteCard = ({ route }: Props) => {
    const router = useRouter();

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
                    <RouteGradeBadge route_grade={route.skala} />
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
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    gradeText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 12,
    },
});

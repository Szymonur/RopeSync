import { StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import ThemedCard from "../ThemedCard";
import ThemedText from "../ThemedText";
import { Sector } from "../../types/location";
import { Colors } from "../../constants/Colors";
import { useTheme } from "../../contexts/ThemeContext";


interface Props {
    sector: Sector & { nazwa_rejonu?: string };
	onSectorPress?: (sectorId: number) => void;
	isSelected?: boolean;
}

const SectorCard = ({ sector, onSectorPress, isSelected}: Props) => {
    const router = useRouter();

    return (
        <TouchableOpacity
            onPress={() =>
			{
			if (Platform.OS === "web" && onSectorPress) {
				onSectorPress(sector.id_sektoru);
			} else {				
                router.push({
                    pathname: "/(dashboard)/sector/[id]",
                    params: { id: sector.id_sektoru.toString() },
                })
			}
			}
            }
        >
            <ThemedCard style={[styles.card]} selected={isSelected}>
                <ThemedText style={styles.bold}>
                    {sector.nazwa_sektoru}
                </ThemedText>
                <ThemedText style={styles.subtext}>
                    {sector.nazwa_rejonu}
                </ThemedText>
            </ThemedCard>
        </TouchableOpacity>
    );
};

export default SectorCard;

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

import {
    StyleSheet,
    FlatList,
    Alert,
    TouchableOpacity,
    View,
    RefreshControl,
} from "react-native";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";

import { Colors } from "../../../constants/Colors";
import { useTheme } from "../../../contexts/ThemeContext";

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedButton from "../../../components/ThemedButton";
import ThemedCard from "../../../components/ThemedCard";

import {
    AscentRepository,
    Ascent,
} from "../../../database/repositories/AscentRepository";
import { useMe } from "../../../lib/hooks/useProfile";

const Asce = () => {
    const db = useSQLiteContext();
    const { data: user } = useMe();
    const [ascents, setAscents] = useState<Ascent[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    // Inicjalizacja repozytorium
    const repository = useMemo(() => new AscentRepository(db), [db]);

    const loadAscents = async () => {
        if (!user?.id) return;
        try {
            const data = await repository.getAscentsForUser(Number(user.id));
            setAscents(data);
        } catch (error) {
            console.error("Błąd podczas ładowania przejść:", error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadAscents();
        setRefreshing(false);
    }, [user?.id, repository]);

    useEffect(() => {
        loadAscents();
    }, [user?.id]);

    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={ascents}
                keyExtractor={(item) => item.id_przejscia}
                showsVerticalScrollIndicator={false}
                style={{ width: "100%" }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.iconColour]}
                        tintColor={theme.iconColour}
                    />
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() =>
                            router.push(
                                `/(dashboard)/ascent/${item.id_przejscia}`,
                            )
                        }
                    >
                        <ThemedCard style={styles.card}>
                            <View
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                }}
                            >
                                <ThemedText style={styles.bold}>
                                    {item.nazwa_stylu} - {item.id_drogi}
                                </ThemedText>
                                <ThemedText>{item.data}</ThemedText>
                            </View>

                            <ThemedText style={styles.note}>
                                {item.notatka}
                            </ThemedText>
                        </ThemedCard>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <ThemedText>Brak zarejestrowanych przejść.</ThemedText>
                }
            />
        </ThemedView>
    );
};

export default Asce;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    heading: {
        fontWeight: "bold",
        fontSize: 22,
        textAlign: "center",
    },
    card: {
        padding: 15,
        marginVertical: 5,
    },
    bold: {
        fontWeight: "bold",
        fontSize: 16,
    },
    note: {
        fontStyle: "italic",
        color: "#666",
        marginTop: 5,
    },
});

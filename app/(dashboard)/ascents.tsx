import { StyleSheet, FlatList, Alert } from "react-native";
import { useEffect, useState, useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";

import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";

import {
    AscentRepository,
    Ascent,
} from "../../database/repositories/AscentRepository";
import { useMe } from "../../lib/hooks/useProfile";

const Asce = () => {
    const db = useSQLiteContext();
    const { data: user } = useMe();
    const [ascents, setAscents] = useState<Ascent[]>([]);

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

    useEffect(() => {
        loadAscents();
    }, [user?.id]);

    const handleAddSampleAscent = async () => {
        if (!user?.id || !user?.username || !user?.email) {
            Alert.alert("Błąd", "Niepełne dane użytkownika.");
            return;
        }

        try {
            // 1. Upewnij się, że użytkownik istnieje lokalnie (klucz obcy!)
            await db.runAsync(
                `INSERT OR IGNORE INTO Uzytkownicy (id_uzytkownika, login, email, imie, nazwisko) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    Number(user.id),
                    user.username,
                    user.email,
                    user.firstName || "User",
                    user.lastName || "Test",
                ],
            );

            // 2. Dodaj przejście
            const newAscent = {
                id_przejscia: Math.random().toString(36).substring(7),
                data: new Date().toISOString().split("T")[0],
                notatka:
                    "Przejście testowe: " + new Date().toLocaleTimeString(),
                id_uzytkownika: Number(user.id),
                nazwa_stylu: "OS",
                id_drogi: "droga_123", // Ta droga została dodana do SEED_DATA
            };

            await repository.addAscent(newAscent);
            Alert.alert("Sukces", "Dodano nowe przejście!");
            loadAscents();
        } catch (error) {
            console.error("Błąd podczas dodawania:", error);
            Alert.alert(
                "Błąd SQL",
                "Upewnij się, że zrestartowałeś aplikację po zmianie SEED_DATA.\n\n" +
                    error,
            );
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedButton onPress={handleAddSampleAscent}>
                <ThemedText style={{ textAlign: "center", color: "white" }}>
                    Dodaj testowe przejście
                </ThemedText>
            </ThemedButton>

            <Spacer height={20} />

            <FlatList
                data={ascents}
                keyExtractor={(item) => item.id_przejscia}
                style={{ width: "100%" }}
                renderItem={({ item }) => (
                    <ThemedCard style={styles.card}>
                        <ThemedText style={styles.bold}>
                            {item.nazwa_stylu} - {item.id_drogi}
                        </ThemedText>
                        <ThemedText>{item.data}</ThemedText>
                        <ThemedText style={styles.note}>
                            {item.notatka}
                        </ThemedText>
                    </ThemedCard>
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
        padding: 20,
    },
    heading: {
        fontWeight: "bold",
        fontSize: 22,
        textAlign: "center",
    },
    card: {
        padding: 15,
        marginBottom: 10,
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

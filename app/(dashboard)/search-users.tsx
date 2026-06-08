import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedTextInput from "../../components/ThemedTextInput";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import Spacer from "../../components/Spacer";
import ThemedEmptyState from "../../components/ThemedEmptyState";

import { Colors } from "../../constants/Colors";
import { useTheme } from "../../contexts/ThemeContext";
import { useNetwork } from "../../contexts/NetworkContext";
import { SearchUser } from "../../types/user";

import { useDebounce } from "../../lib/hooks/useDebounce";
import { useFollowUser, useSearchUsers, useUnfollowUser } from "../../lib/hooks/useUsers";

const SearchUsers = () => {
    const router = useRouter();
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const { isConnected } = useNetwork();

    const [phrase, setPhrase] = useState("");
    const debouncedPhrase = useDebounce(phrase);
    const [phraseError, setPhraseError] = useState("");
    
    // Hooks
    const { 
        data: searchedUsers = [], 
        isLoading, 
        refetch, 
        isRefetching 
    } = useSearchUsers(debouncedPhrase);
    
    const { mutateAsync: followUser, isPending: isFollowingPending, variables: followingId } = useFollowUser();
    const { mutateAsync: unfollowUser, isPending: isUnfollowingPending, variables: unfollowingId } = useUnfollowUser();

    useEffect(() => {
        if (phrase.length === 0 || phrase.length >= 2) {
            setPhraseError("");
            return;
        }

        const timer = setTimeout(() => {
            if (phrase.length === 1) {
                setPhraseError("Min. 2 znaki są wymagane");
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [phrase]);

    const onToggleFollow = async (user: SearchUser) => {
        if (!isConnected) return;

        try {
            if (user.isFollowing) {
                await unfollowUser(user.id);
            } else {
                await followUser(user.id);
            }
        } catch (error) {
            console.error("Błąd podczas zmiany obserwacji:", error);
        }
    };

    return (
        <ThemedView style={styles.container} safe>
            <Stack.Screen
                options={{
                    title: "Szukaj użytkowników",
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() =>
                                router.replace("/(dashboard)/(tabs)")
                            }
                            style={styles.closeButton}
                            accessibilityRole="button"
                            accessibilityLabel="Zamknij wyszukiwanie"
                        >
                            <Ionicons
                                name="close"
                                size={28}
                                color={theme.iconColour}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />

            {!isConnected ? (
                <View>
                    <ThemedEmptyState
                        title="Brak połączenia"
                        description="Wyszukiwanie użytkowników jest możliwe tylko w trybie online."
                        buttonLabel="Wróć"
                        onButtonPress={() => router.back()}
                    />
                </View>
            ) : (
                <>
                    <ThemedTextInput
                        value={phrase}
                        error={phraseError}
                        onChangeText={setPhrase}
                        placeholder="Wpisz przynajmniej 2 znaki"
                        autoCapitalize="none"
                    />
                    <Spacer height={10} />

                    {isLoading && (
                        <ActivityIndicator
                            size="small"
                            color={theme.iconColour}
                        />
                    )}

                    {!isLoading &&
                        debouncedPhrase.trim().length >= 2 &&
                        phrase === debouncedPhrase &&
                        searchedUsers.length === 0 && (
                            <ThemedText style={styles.emptyText}>
                                Nic nie wiemy o takim wspinaczu.
                            </ThemedText>
                        )}

                    <FlatList
                        data={searchedUsers}
                        keyExtractor={(item) => String(item.id)}
                        style={{ width: "100%" }}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefetching}
                                onRefresh={refetch}
                                colors={[theme.iconColour]}
                                tintColor={theme.iconColour}
                            />
                        }
                        renderItem={({ item }) => {
                            const isBusy = (isFollowingPending && followingId === item.id) || 
                                           (isUnfollowingPending && unfollowingId === item.id);

                            return (
                                <ThemedCard style={styles.userCard}>
                                    <View style={styles.rowTop}>
                                        <View>
                                            <ThemedText style={styles.nameText}>
                                                {item.firstName} {item.lastName}
                                            </ThemedText>
                                            <ThemedText
                                                style={styles.usernameText}
                                            >
                                                @{item.username}
                                            </ThemedText>
                                        </View>

                                        <ThemedButton
                                            style={[
                                                styles.followButton,
                                                item.isFollowing && {
                                                    backgroundColor:
                                                        theme.uiBackground,
                                                    borderColor:
                                                        theme.iconColour,
                                                },
                                            ]}
                                            onPress={() => onToggleFollow(item)}
                                            disabled={isBusy}
                                        >
                                            <ThemedText
                                                style={{
                                                    textAlign: "center",
                                                    color: item.isFollowing
                                                        ? theme.text
                                                        : "white",
                                                }}
                                            >
                                                {isBusy ? (
                                                    <ActivityIndicator
														size={14}
                                                        color={item.isFollowing ? theme.text : "white"}
                                                    />
                                                ) : item.isFollowing ? (
                                                    "Obserwujesz"
                                                ) : (
                                                    "Obserwuj"
                                                )}
                                            </ThemedText>
                                        </ThemedButton>
                                    </View>
                                </ThemedCard>
                            );
                        }}
                        ListEmptyComponent={
                            phrase.trim().length < 2 ? (
                                <ThemedText style={styles.emptyText}>
                                    Zacznij wpisywać, aby wyszukać wspinaczy.
                                </ThemedText>
                            ) : null
                        }
                    />
                </>
            )}
        </ThemedView>
    );
};

export default SearchUsers;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    userCard: {
        marginBottom: 10,
    },
    rowTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    nameText: {
        fontSize: 16,
        fontWeight: "600",
    },
    usernameText: {
        opacity: 0.8,
        fontSize: 13,
    },
    followButton: {
        borderWidth: 1,
        borderColor: "transparent",
        marginVertical: 0,
        paddingVertical: 8,
        minWidth: 118,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 16,
        opacity: 0.8,
    },
    closeButton: {
        marginRight: 12,
    },
});

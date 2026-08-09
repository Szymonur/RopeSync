import { Slot, Link, usePathname } from "expo-router";
import { useState } from "react";
import { View, StyleSheet, Pressable, TouchableOpacity, } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";	
import { Ionicons } from "@expo/vector-icons";

import NotificationsScreen from "./notifications";
import Settings from "./settings"

import ThemedText from "../../components/ThemedText";


import { useAuth } from "../../contexts/AuthContext";
import { useCurrentUser} from "../../lib/hooks/useUsers";
import { useUnreadReactionsCount } from "../../lib/hooks/useReactions";

export default function WebTabsLayout() {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const pathname = usePathname();
	const router = useRouter();

    const isActive = (path: string) => pathname === path;

	const { currentUserId: userId } = useAuth();
	const currentUserId = Number(userId);

	const { data: user, isLoading: userLoading } = useCurrentUser(currentUserId);
	const { data: unreadCount = 0, refetch: refetchUnreadCount } = useUnreadReactionsCount(currentUserId);
	
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const toggleNotifications = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
		refetchUnreadCount;
        setIsSettingsOpen(false); // Zamykamy ustawienia, gdy otwieramy powiadomienia
    };

    const toggleSettings = () => {
        setIsSettingsOpen(!isSettingsOpen);
        setIsNotificationsOpen(false); // Zamykamy powiadomienia, gdy otwieramy ustawienia
    };

    const closeModals = () => {
        setIsNotificationsOpen(false);
        setIsSettingsOpen(false);
    };

    return (
        <View style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
            {/* GÓRNY PASEK NAWIGACJI (WEB NAVBAR) */}
            <View  style={StyleSheet.flatten([styles.navbar, { backgroundColor: theme.navBackground, borderBottomColor: theme.border || '#e0e0e0' }])}>
                <ThemedText style={StyleSheet.flatten([styles.logo, { color: theme.title }])}>RopeSync 
					<ThemedText style={{fontWeight: 300}}>{!user ? "" : `  ${user?.firstName} ${user?.lastName}`} </ThemedText>
				</ThemedText>
                <View style={styles.navLinks} >
                    <Link href="/(dashboard)/(tabs)/" onPress={closeModals} asChild>
                        <Pressable style={StyleSheet.flatten([styles.linkButton, {backgroundColor: isActive("/") ? theme.background : "" }])}>
                            <ThemedText style={{ color: theme.title}}>
                                Pulpit
                            </ThemedText>
                        </Pressable>
                    </Link>
                    
                    <Link href="/(dashboard)/(tabs)/ascents" onPress={closeModals}  asChild>
                        <Pressable style={StyleSheet.flatten([styles.linkButton,{backgroundColor: isActive("/ascents") ? theme.background : "" }])}>
                            <ThemedText style={{ color: theme.title}}>
                                Przejścia
                            </ThemedText>
                        </Pressable>
                    </Link>

                    <Link href="/(dashboard)/(tabs)/routes" onPress={closeModals} asChild>
                        <Pressable style={StyleSheet.flatten([styles.linkButton, {backgroundColor: isActive("/routes") ? theme.background : "" }])}>
                            <ThemedText style={{ color: theme.title}}>
                                Drogi
                            </ThemedText>
                        </Pressable>
                    </Link>



                    <Link href="/(dashboard)/(tabs)/profile" onPress={closeModals} asChild>
                        <Pressable style={StyleSheet.flatten([styles.linkButton, {backgroundColor: isActive("/profile") ?  theme.background : "" }])}>
                            <ThemedText style={{ color: theme.title}}>
                                Profil
                            </ThemedText>
                        </Pressable>
                    </Link>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							width: 93 
						}}
					>	
					    <TouchableOpacity
                            onPress={toggleNotifications}
                            style={{ marginRight: 25}}
                        >
					        <View>
                                <Ionicons
                                    name="notifications-outline"
                                    color={theme.iconColour}
                                    size={24}
                                />
                                {unreadCount > 0 && (
                                    <View
                                        style={[
                                            styles.badge,
                                            {
                                                backgroundColor:
                                                    Colors.error,
                                            },
                                        ]}
                                    >
                                        <ThemedText
                                            style={styles.badgeText}
                                        >
                                            {unreadCount}
                                        </ThemedText>
                                    </View>
                                    )}
                            </View>
                        </TouchableOpacity>
						<TouchableOpacity
							onPress={toggleSettings}
							style={{ marginRight: 20 }}
						>
							<Ionicons
								name="settings-outline"
								color={theme.iconColour}
								size={24}
							/>
						</TouchableOpacity>
					</View>
                </View>
            </View>

			{/* NIEWIDZIALNY OVERLAY DO ZAMYKANIA MODALI PO KLIKNIĘCIU W TŁO */}
            {(isNotificationsOpen || isSettingsOpen) && (
                <Pressable style={styles.overlay} onPress={closeModals} />
            )}

            {/* MODAL / POPOVER POWIADOMIEŃ */}
            {isNotificationsOpen && (
                <View style={[styles.popover, { backgroundColor: theme.navBackground, shadowColor: theme.text }]}>
					<NotificationsScreen/>
                </View>
            )}

            {/* MODAL / POPOVER USTAWIEŃ */}
            {isSettingsOpen && (
                <View  onBlur={closeModals} style={[styles.popover, { backgroundColor: theme.navBackground, shadowColor: theme.text }]}>
					<Settings/>
                </View>
            )}

            {/* MIEJSCE NA TREŚĆ PODSTRONY */}
            <View  onBlur={closeModals} style={[styles.contentContainer, { zIndex: 1 }]}>
                <Slot />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    navbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 40,
        height: 65,
        borderBottomWidth: 1,
    },
    logo: {
        fontSize: 22,
        fontWeight: "bold",
    },
    navLinks: {
        flexDirection: "row",
        gap: 15,
    },
    linkButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    activeLink: {
        backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
    contentContainer: {
        flex: 1,
        alignSelf: "center",
        width: "100%",
    },
	badge: {
        position: "absolute",
        right: -6,
        top: -3,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
    },
    badgeText: {
        color: "white",
        fontSize: 10,
        fontWeight: "bold",
    },
	overlay: {
        position: "absolute",
        top: 65, // Zaczyna się pod paskiem nawigacji
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        backgroundColor: "transparent", // Niewidzialne tło przechwytujące kliknięcia
    },
    popover: {
        position: "absolute",
        top: 70, // 5px marginesu od paska navbar
        right: 40, // Wyrównanie do prawej strony (zgodnie z paddingiem navbaru)
        width: 400, // Szerokość modala - dostosuj według uznania
        maxHeight: 500,
        padding: 10,
        // borderRadius: 12,
        zIndex: 100, // Zawsze na wierzchu
        elevation: 10,
        // Cienie dla web (iOS i Web je wyłapią)
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
});
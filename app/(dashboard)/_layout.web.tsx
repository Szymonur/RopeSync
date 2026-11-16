import { Slot, usePathname, useRouter } from "expo-router";
import { memo, useCallback, useState } from "react";
import { View, StyleSheet, Pressable, TouchableOpacity } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

import NotificationsScreen from "./notifications";
import Settings from "./settings";

import ThemedText from "../../components/ThemedText";

import { useAuth } from "../../contexts/AuthContext";
import { useCurrentUser } from "../../lib/hooks/useUsers";
import { useUnreadReactionsCount } from "../../lib/hooks/useReactions";

const WebNavigation = memo(function WebNavigation({
    theme,
    onNavigate,
}: {
    theme: (typeof Colors)["light"];
    onNavigate: (path: string) => void;
}) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/" && (pathname === "/" || pathname === "")) return true;
        return pathname.startsWith(path) && path !== "/";
    };

    const renderLink = (path: string, label: string) => (
        <a
            href={path}
            onClick={(event) => {
                if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                ) {
                    return;
                }

                event.preventDefault();
                onNavigate(path);
            }}
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 6,
                backgroundColor: isActive(path) ? theme.background : "transparent",
                color: theme.title,
                textDecoration: "none",
                cursor: "pointer",
            }}
        >
            {label}
        </a>
    );

    return (
        <View style={styles.navLinks}>
			<ThemedText>{renderLink("/", "Pulpit")}</ThemedText>
			<ThemedText>{renderLink("/ascents", "Przejścia")}</ThemedText>
			<ThemedText>{renderLink("/routes", "Drogi")}</ThemedText>
			<ThemedText>{renderLink("/profile", "Profil")}</ThemedText>            
        </View>
    );
});

export default function WebTabsLayout() {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const router = useRouter();

    const { currentUserId: userId } = useAuth();
    // Bezpieczne parsowanie ID
    const currentUserId = userId ? Number(userId) : 0;

    const { data: user } = useCurrentUser(currentUserId);
    const { data: unreadCount = 0, refetch: refetchUnreadCount } = useUnreadReactionsCount(currentUserId);

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const closeModals = useCallback(() => {
        setIsNotificationsOpen(false);
        setIsSettingsOpen(false);
    }, []);

    const navigateTo = useCallback((path: string) => {
        closeModals();
        router.push(path as any);
    }, [closeModals, router]);

    const toggleNotifications = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
        if (typeof refetchUnreadCount === "function") {
            refetchUnreadCount();
        }
        setIsSettingsOpen(false);
    };

    const toggleSettings = () => {
        setIsSettingsOpen(!isSettingsOpen);
        setIsNotificationsOpen(false);
    };

    return (
        <View style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
            {/* GÓRNY PASEK NAWIGACJI */}
            <View style={StyleSheet.flatten([styles.navbar, { backgroundColor: theme.navBackground, borderBottomColor: theme.border || '#e0e0e0' }])}>
                <ThemedText style={StyleSheet.flatten([styles.logo, { color: theme.title }])}>
                    RopeSync
                    <ThemedText style={{ fontWeight: "300" }}>
                        {!user ? "" : `  ${user?.firstName} ${user?.lastName}`}
                    </ThemedText>
                </ThemedText>

                <View style={styles.navLinks}>
                    <WebNavigation theme={theme} onNavigate={navigateTo} />

                    <View style={{ flexDirection: "row", alignItems: "center", width: 93 }}>
                        <TouchableOpacity onPress={toggleNotifications} style={{ marginRight: 25 }}>
                            <View>
                                <Ionicons name="notifications-outline" color={theme.iconColour} size={24} />
                                {unreadCount > 0 && (
                                    <View style={[styles.badge, { backgroundColor: Colors.error }]}>
                                        <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={toggleSettings} style={{ marginRight: 20 }}>
                            <Ionicons name="settings-outline" color={theme.iconColour} size={24} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {(isNotificationsOpen || isSettingsOpen) && (
                <Pressable style={styles.overlay} onPress={closeModals} />
            )}

            {isNotificationsOpen && (
                <View style={[styles.popover, { backgroundColor: theme.navBackground, shadowColor: theme.text }]}>
                    <NotificationsScreen />
                </View>
            )}

            {isSettingsOpen && (
                <View style={[styles.popover, { backgroundColor: theme.navBackground, shadowColor: theme.text }]}>
                    <Settings />
                </View>
            )}

            <View style={[styles.contentContainer, { zIndex: 1 }]}>
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
        cursor: "pointer",
    } as any,
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
        top: 65,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        backgroundColor: "transparent",
    },
    popover: {
        position: "absolute",
        top: 70,
        right: 40,
        width: 400,
        maxHeight: 500,
        padding: 10,
        zIndex: 100,
        elevation: 10,
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
});
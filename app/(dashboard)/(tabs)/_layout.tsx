import { Tabs } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { useTheme } from "../../../contexts/ThemeContext";
import {
    Ionicons,
    Foundation,
    FontAwesome5,
    FontAwesome6,
} from "@expo/vector-icons";
import ThemedLogo from "../../../components/ThemedLogo";

const TabsLayout = () => {
    const { colorScheme } = useTheme();
    const theme = Colors[colorScheme];

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: theme.navBackground,
                    borderBottomColor: theme.border,
                    borderBottomWidth: 1,
                },
                headerTintColor: theme.title,
                headerTitleStyle: {
                    fontWeight: "bold",
                },
                headerRight: () => (
                    <ThemedLogo
                        resizeMode="contain"
                        style={{ width: 26, height: 26, marginRight: 12 }}
                    />
                ),
                headerShadowVisible: true,
                tabBarStyle: {
                    backgroundColor: theme.navBackground,
                    borderTopColor: theme.border,
                    borderTopWidth: 1,
                    paddingTop: 10,
                    height: 90,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "700",
                    paddingBottom: 2,
                },
                tabBarActiveTintColor: theme.iconColourFocused,
                tabBarInactiveTintColor: theme.iconColour,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome6
                            size={24}
                            name="house"
                            color={
                                focused
                                    ? theme.iconColourFocused
                                    : theme.iconColour
                            }
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ focused }) => (
                        <Ionicons
                            size={24}
                            name={focused ? "person" : "person-outline"}
                            color={
                                focused
                                    ? theme.iconColourFocused
                                    : theme.iconColour
                            }
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="device"
                options={{
                    title: "Device",
                    tabBarIcon: ({ focused }) => (
                        <Foundation
                            size={24}
                            name="mobile-signal"
                            color={
                                focused
                                    ? theme.iconColourFocused
                                    : theme.iconColour
                            }
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="routes"
                options={{
                    title: "Routes",
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome5
                            size={24}
                            name="route"
                            color={
                                focused
                                    ? theme.iconColourFocused
                                    : theme.iconColour
                            }
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="ascents"
                options={{
                    title: "Ascents",
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome5
                            size={24}
                            name="mountain"
                            color={
                                focused
                                    ? theme.iconColourFocused
                                    : theme.iconColour
                            }
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="search-users"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
};

export default TabsLayout;

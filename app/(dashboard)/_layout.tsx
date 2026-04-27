import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";
import {
    Ionicons,
    Foundation,
    FontAwesome5,
    FontAwesome6,
} from "@expo/vector-icons";

const DashboardLayout = () => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || "light"];

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.navBackground,
                    paddingTop: 10,
                    height: 90,
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
        </Tabs>
    );
};

export default DashboardLayout;

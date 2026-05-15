import { Image } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

import DarkLogo from "../assets/img/logo_dark.png";
import LightLogo from "../assets/img/logo_light.png";

const ThemedLogo = ({ ...props }) => {
    const { colorScheme } = useTheme();
    const logo = colorScheme === "dark" ? DarkLogo : LightLogo;

    return <Image source={logo} {...props} />;
};

export default ThemedLogo;

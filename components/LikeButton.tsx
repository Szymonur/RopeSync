import {
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useToggleReaction } from "../lib/hooks/useReactions"

const LikeButton = ({
    isLiked,
    ascentId,
    theme,
    isConnected,
    showSnackbar,
}: {
   	isLiked: boolean;
    ascentId: string;
    theme: any;
    isConnected: boolean;
    showSnackbar: any;
}) => {
	const { toggleReaction: toggleReaction } = useToggleReaction();
	
    const handlePress = () => {
        if (!isConnected) {
            showSnackbar({
                message: "Musisz być online, aby polubić przejście!",
                type: "warn",
            });
            return;
        }
        toggleReaction(ascentId, {
            onError: () => {
                showSnackbar({
                    message: "Błąd podczas polubienia przejścia",
                    type: "error",
                });
            }
        });
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.likeButton}>
            <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={24}
                color={isLiked ? theme.error || "red" : theme.iconColour}
				/>
        </TouchableOpacity>
    );
};

export default LikeButton

const styles = StyleSheet.create({
    likeButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
});

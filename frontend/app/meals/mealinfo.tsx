// meal nutrition facts screen
// make sure to add the three dots at the top right corner to enter edit mode/to delete meal
// "go to ingredients" at the bottom right corner
// the. nurtirion will update depending on what ingredients were inputted

import React, {useState} from "react";
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Modal,
    Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function MealNutritionScreen() {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <SafeAreaView style={styles.container}>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
})
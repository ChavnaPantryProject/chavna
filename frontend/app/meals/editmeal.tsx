// meal ingredients editing screen
// add popup for add ingredient, amount, and dropdown for measurement units.
// measurement units popup after you add ingredient, "--", click that to trigger popup.

import React from "react";
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet,
    SafeAreaView
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// ingredient list data
const ingredients = [
    { name: "Dry Fettuccine Pasta", amount: "680g" },
    { name: "Butter", amount: "240g" },
    { name: "Heavy Cream", amount: "360g" },
    { name: "Garlic Salt", amount: ".5g" },
    { name: "Roman Cheese", amount: "75g" },
    { name: "Parmesan Cheese", amount: "45g" },
];

export default function EditMealScreen() {
    const router = useRouter(); // navigation controller
    
    return (
        <SafeAreaView style={styles.container}>

            {/* Back Button at top left corner */}
            <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            {/* Meal Header */}
            <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>Fettuccine Alfredo</Text>
            </View>

            {/* Meal Image */}
            <Image
                source={require('../../assets/images/FETTUCCINE_ALFREDO_HOMEPAGE.jpg')}
                style={styles.image}
            />

            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={styles.headerText}>Ingredients</Text>
                <Text style={styles.headerText}>Measurement</Text>
            </View>

            {/* ingredient list */}
            <FlatList
                data={ingredients}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => (
                    <View style={styles.row}>

                        {/* Ingredient Name */}
                        <Text style={styles.ingredientText}>{item.name}</Text>

                        {/* Ingredient Amount */}
                        <Text style={styles.amountText}>{item.amount}</Text>
                    </View>
                )}
                
                // lines to distinguish rows
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Add Ingredient Button */}
            <TouchableOpacity style={styles.plusButton}>
                <Ionicons name="add" size={24} color="black" />
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity 
                style={styles.saveButton}
                onPress={() => router.push("/meals/meal_ingredient")}
            >
                <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // overall screen layout
    container: {
        flex: 1,
        backgroundColor: "#F9F9F9",
        alignItems: "center",
    },

    // back arrow positioning
    backButton: {
        alignSelf: "flex-start",
        marginLeft: 15,
        marginTop: 10,
    },

    // header container forthe meal name
    mealHeader: {
        backgroundColor: "#E3F0E3",
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 20,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: "#499F44",
    },

    // meal title styling
    mealTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2C3A2D",
        textAlign: "center",
    },

    // meal image styling
    image: {
        width: 230,
        height: 180,
        borderRadius: 15,
        borderColor: "#499F44",
        marginTop: 10,
        marginVertical: 10,
    },

    // header row for 'ingredients' and 'measurements'
    tableHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "85%",
        marginTop: 20,
        marginBottom: 5,
    },

    headerText: {
        fontSize: 23,
        fontWeight: "700",
        color: "#000",
        marginHorizontal: 19,
    },

    // each ingredient row
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "85%",
        paddingVertical: 8,
        marginLeft: 15,
    },

    ingredientText: {
        fontSize: 15,
        color: "#000",
    },

    amountText: {
        fontSize: 15,
        color: "#000",
    },

    listContent: {
        paddingBottom: 15,
        alignSelf: "center",
    },

    // green lines for row separation
    separator: {
        width: "95%",
        height: 1,
        backgroundColor: "#499F44",
        alignSelf: "center",
    },

    // add ingredient button
    plusButton: {
        marginTop: 15,
        backgroundColor: "#E8F2E8",
        borderRadius: 30,
        padding: 6,
    },

    // save button
    saveButton: {
        backgroundColor: "#F89D5D",
        paddingVertical: 10,
        paddingHorizontal: 50,
        borderRadius: 10,
        marginTop: 20,
        marginBottom: 30,
    },

    saveButtonText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "600",
    },
})
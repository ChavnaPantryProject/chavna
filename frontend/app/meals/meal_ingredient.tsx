// normal layout when displaying meal ingredients (not in edit mode)
// make sure to add the three dots at the top right corner to enter edit mode/to deleete meal
// "go to nutrition info" at the bottom right corner.

// FIX!!!!
// when user clicks save, it goes back to the original screen
// add delete meal logic
// must work on meal logic (delete, add ingredient, measurements, etc)

import React, {useState} from "react";
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Modal,
    Pressable,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function MealIngredientScreen() {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);

    // ingredient list data
    const ingredients = [
        { name: "Dry Fettuccine Pasta", amount: "680g" },
        { name: "Butter", amount: "240g" },
        { name: "Heavy Cream", amount: "360g" },
        { name: "Garlic Salt", amount: ".5g" },
        { name: "Romano Cheese", amount: "75g" },
        { name: "Parmesan Cheese", amount: "45g" },
    ];

    const handleDeleteMeal = () => {
        setMenuVisible(false);

        Alert.alert(
            "Delete Meal",
            "Are you sure you want to delete this meal? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        // delete meal logic
                        console.log("Meal deleted");

                        // navigatee back to meals tab
                        router.replace("/(tabs)/meal");

                        // confirmation
                        setTimeout(() => {
                            Alert.alert("Meal Deleted", "This meal has beedn deleted successfully.");
                        }, 500);
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMenuVisible(true)}>
                    <Ionicons name="ellipsis-horizontal" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Edit/Delete Meal Menu */}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable 
                    style={styles.modalOverlay} 
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.dropdownMenu}>
                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                                setMenuVisible(false);
                                router.push("/meals/editmeal");  // navigate to edit meal screen
                            }}
                        >
                            <Text style={styles.dropdownText}>Edit Meal</Text>
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={handleDeleteMeal}
                        >
                            <Text style={[styles.dropdownText, styles.deleteText]}>Delete Meal</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* Main content */}
            <View style={styles.fixedSection}>
                <View style={styles.mealHeader}>
                    <Text style={styles.mealTitle}>Fettuccine Alfredo</Text>
                </View>

                {/* Image */}
                <Image
                    source={require('../../assets/images/FETTUCCINE_ALFREDO_HOMEPAGE.jpg')}
                    style={styles.mealImage}
                />
            </View>
            
            {/* scrollable ingredient list */}
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >

                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={styles.headerText}>Ingredients</Text>
                    <Text style={styles.headerText}>Measurement</Text>
                </View>

                {/* Ingredient list with separators */}
                {ingredients.map((item, index) => (
                    <View key={index} style={styles.rowContainer}>
                        <View style={styles.row}>
                            <Text style={styles.ingredientText}>{item.name}</Text>
                            <Text style={styles.amountText}>{item.amount}</Text>
                        </View>

                        {/* Separator line */}
                        {index < ingredients.length - 1 && <View style={styles.divider} />}
                    </View>
                ))}

                {/* Navigation Button to Nutrition Info */}
                <TouchableOpacity
                    style={styles.linkContainer}
                    onPress={() => router.push('/meals/mealinfo')}
                >
                    <Text style={styles.linkText}>Go to Nutrition {'>'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:
    {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: "100%",
        paddingHorizontal: 20,
        paddingTop: 50,
    },

    fixedSection: {
        alignItems: "center",
    },

    scrollContainer: {
        flex: 1,
        paddingHorizontal: 25,
        marginTop: 5,
    },

    mealHeader: {
        backgroundColor: "#E3F0E3",
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 20,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: "499F44",
    },

    mealTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2C3A2D",
        textAlign: "center",
    },

    mealImage: {
        width: 230,
        height: 180,
        borderRadius: 15,
        borderColor: "#499F44",
        marginVertical: 10,
    },

    tableHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
        marginBottom: 5,
    },

    headerText: {
        fontSize: 22,
        fontWeight: "700",
        color: "#000",
    },

    rowContainer: {
        alignSelf: "stretch",
    },

    tableBody: {
        width: "90%",
        alignItems: "center",
    },

    tableRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "85%",
        paddingVertical: 8,
        marginLeft: 15,
    },

    tableLabel: {
        fontSize: 15,
        color: "#000",
    },

    tableValue: {
        fontSize: 15,
        color: "#000",
    },

    linkContainer: {
        alignSelf: 'flex-end',
        marginTop: 12,
        marginRight: 0,
    },

    linkText: {
        color: '#499F44',
        fontWeight: '500',
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        paddingHorizontal: 10,
    },

    ingredientText: {
        fontSize: 15,
        color: "#000",
    },

    amountText: {
        fontSize: 15,
        color: "#000",
    },

    divider: {
        width: "100%",
        height: 1,
        backgroundColor: "#499F44",
        alignSelf: "center",
    },

    // dropdown menu styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "transparent",
    },

    dropdownMenu: {
        position: "absolute",
        top: 80,
        right: 20,
        backgroundColor: "white",
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        width: 150,
        paddingVertical: 6,
    },

    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },

    dropdownText: {
        fontSize: 15,
        color: "#333",
    },

    deleteText: {
        color: "#E38B4D",
    },

    separator: {
        height: 1,
        backgroundColor: "#E8E8E8",
        marginHorizontal: 10,
    },
});
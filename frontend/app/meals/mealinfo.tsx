// meal nutrition facts screen
// make sure to add the three dots at the top right corner to enter edit mode/to delete meal
// "go to ingredients" at the bottom right corner

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

export default function MealIngredientScreen() {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);

    // ingredient list data
    const ingredients = [
        { name: "Calories", amount: "1200 kcal" },
        { name: "Protein", amount: "25g" },
        { name: "Total Fat", amount: "75g" },
        { name: "Saturated Fat", amount: "47g" },
        { name: "Trans Fat", amount: "2g" },
        { name: "Sodium", amount: "400g" },
    ];

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
                            onPress={() => {
                                setMenuVisible(false);
                                console.log("Delete Meal pressed");
                                // delete meal logic here
                            }}
                        >
                            <Text style={styles.dropdownText}>Delete Meal</Text>
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
                    <Text style={styles.headerText}>Nutrition</Text>
                    <Text style={styles.headerText}>Amount</Text>
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
                    onPress={() => router.push('/meals/meal_ingredient')}
                >
                    <Text style={styles.linkText}>Go to Ingredients {'>'}</Text>
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

    separator: {
        height: 1,
        backgroundColor: "#E8E8E8",
        marginHorizontal: 10,
    },
});

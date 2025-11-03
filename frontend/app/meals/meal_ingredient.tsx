// normal layout when displaying meal ingredients (not in edit mode)
// make sure to add the three dots at the top right corner to enter edit mode/to deleete meal
// "go to nutrition info" at the bottom right corner.

// FIX!!!!
// when user clicks save, it goes back to the original screen

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

export default function MealIngredientScreen() {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);

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
                <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
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
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.mealTitle}>Fettuccine Alfredo</Text>
                </View>

                {/* Image */}
                <Image
                    source={require('../../assets/images/FETTUCCINE_ALFREDO_HOMEPAGE.jpg')}
                    style={styles.mealImage}
                />

                {/* Ingredients List */}
                <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.headerText}>Ingredients</Text>
                        <Text style={styles.headerText}>Measurement</Text>
                    </View>

                    {[
                        ["Dry Fettuccine Pasta", "680g"],
                        ["Butter", "240g"],
                        ["Heavy Cream", "360g"],
                        ["Garlic Salt", ".5g"],
                        ["Roman Cheese", "75g"],
                        ["Parmesan Cheese", "45g"],
                    ].map(([label, value], index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.tableLabel}>{label}</Text>
                            <Text style={styles.tableValue}>{value}</Text>
                        </View>
                    ))}
                </View>

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
        paddingHorizontal: 20,
        paddingTop: 60,
    },

    scrollContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    titleContainer: {
        backgroundColor: "#E3F0E3",
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 20,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: "#499F44",
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
        marginTop: 10,
        marginVertical: 10,
    },

    tableContainer: {
        width: '100%',
        borderTopWidth: 1,
        borderColor: '#499F44',
    },

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
        marginTop: 10,
    },

    linkText: {
        color: '#499F44',
        fontWeight: '500',
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
// meal nutrition facts screen

import React, {useState, useEffect} from "react";
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
    TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function MealInfoScreen() {
    const router = useRouter();
    const { id, imageURL, mealName } = useLocalSearchParams();
    const [menuVisible, setMenuVisible] = useState(false);

    // Empty nutrition data - user needs to fill these in
    const [nutritionData, setNutritionData] = useState([
        { name: "Calories", amount: "", unit: "kcal" },
        { name: "Protein", amount: "", unit: "g" },
        { name: "Total Fat", amount: "", unit: "g" },
        { name: "Saturated Fat", amount: "", unit: "g" },
        { name: "Trans Fat", amount: "", unit: "g" },
        { name: "Sodium", amount: "", unit: "mg" },
    ]);

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
                        console.log("Meal deleted");
                        router.replace("/(tabs)/meal");

                        setTimeout(() => {
                            Alert.alert("Meal Deleted", "This meal has been deleted successfully.");
                        }, 500);
                    }
                }
            ]
        );
    };

    const handleSaveNutrition = () => {
        // Check if all fields are filled
        const allFilled = nutritionData.every(item => item.amount.trim() !== "");
        
        if (!allFilled) {
            Alert.alert("Incomplete Data", "Please fill in all nutrition fields.");
            return;
        }

        // Save logic here
        console.log("Saving nutrition data:", nutritionData);
        Alert.alert("Success", "Nutrition information saved successfully!");
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => router.back()}
                >
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
                                router.push("/meals/editmeal");
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
                    <Text style={styles.mealTitle}>{mealName || "Meal Name"}</Text>
                </View>

                {/* Image from previous screen */}
                <Image
                    source={{uri: imageURL ? String(imageURL) : ""}}
                    style={styles.mealImage}
                />
            </View>
            
            {/* scrollable nutrition input form */}
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={styles.headerText}>Nutrition</Text>
                    <Text style={styles.headerText}>Amount</Text>
                </View>

                {/* Nutrition input fields with separators */}
                {nutritionData.map((item, index) => (
                    <View key={index} style={styles.rowContainer}>
                        <View style={styles.row}>
                            <Text style={styles.nutritionLabel}>{item.name}</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={item.amount}
                                    onChangeText={(text) => {
                                        const newData = [...nutritionData];
                                        newData[index].amount = text;
                                        setNutritionData(newData);
                                    }}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                />
                                <Text style={styles.unitText}>{item.unit}</Text>
                            </View>
                        </View>

                        {/* Separator line */}
                        {index < nutritionData.length - 1 && <View style={styles.divider} />}
                    </View>
                ))}

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveNutrition}
                >
                    <Text style={styles.saveButtonText}>Save Nutrition Info</Text>
                </TouchableOpacity>

                {/* Navigation Button to Ingredients */}
                <TouchableOpacity
                    style={styles.linkContainer}
                    onPress={() => router.back()}
                >
                    <Text style={styles.linkText}>{'<'} Back to Ingredients</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
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

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 10,
    },

    nutritionLabel: {
        fontSize: 15,
        color: "#000",
        flex: 1,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },

    input: {
        fontSize: 15,
        color: "#000",
        borderBottomWidth: 1,
        borderBottomColor: "#499F44",
        paddingVertical: 2,
        paddingHorizontal: 8,
        minWidth: 60,
        textAlign: "right",
    },

    unitText: {
        fontSize: 15,
        color: "#666",
        width: 40,
    },

    divider: {
        width: "100%",
        height: 1,
        backgroundColor: "#499F44",
        alignSelf: "center",
    },

    saveButton: {
        backgroundColor: "#499F44",
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginTop: 20,
        alignItems: "center",
    },

    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },

    linkContainer: {
        alignSelf: 'flex-start',
        marginTop: 12,
        marginBottom: 20,
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

    deleteText: {
        color: "#E38B4D",
    },

    separator: {
        height: 1,
        backgroundColor: "#E8E8E8",
        marginHorizontal: 10,
    },
});
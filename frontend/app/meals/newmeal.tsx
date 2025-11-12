// empty screen for new meal creation
// implement the empty picture option.

// NOTE: this will be the default screen when a usesr decides to add a new meal/

import React, { use, useState } from "react";
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity, 
    StyleSheet,
    SafeAreaView,
    TextInput,
    Modal,
    Alert,
    ScrollView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function NewMeal() {
    const [mealName, setMealName] = useState("");
    const [mealImage, setMealImage] = useState<string | null>(null);
    const [ingredients, setIngredients] = useState<
        { name: string; amount: string; unit: string }[]
    >([]);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [newIngredient, setNewIngredient] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newUnit, setNewUnit] = useState("g");
    const [openUnit, setOpenUnit] = useState(false);

    const navigation = useNavigation();

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setMealImage(result.assets[0].uri);
        }
    };

    const addIngredient = () => {
        if (newIngredient && newAmount && newUnit) {
            setIngredients([
                ...ingredients,
                { name: newIngredient, amount: newAmount, unit: newUnit },
            ]);
            setNewIngredient("");
            setNewAmount("");
            setNewUnit("g");
            setModalVisible(false);
        }
    };

    const deleteIngredient = (index: number) => {
        const updatedIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(updatedIngredients);
    };

    const saveMeal = () => {
        if (!mealName.trim()) {
            Alert.alert("Missing Information", "Please enter a meal name.");
            return;
        }

        if (ingredients.length === 0) {
            Alert.alert("Missing Information", "Please add at least one ingredient.");
            return;
        }

        // backend/database info
        const mealData = {
            name: mealName,
            image: mealImage,
            ingredients: ingredients,
        };

        console.log("Saving meal:", mealData);

        Alert.alert(
            "Meal Saved!",
            '${mealName} has been saved successfully.',
            [
                {
                    text: "OK",
                    onPress: () => navigation.goBack(),
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* back button */}
            <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={styles.backButton}
            >
                <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>

            {/* meal name input */}
            <View style={styles.topSection}>
                <View style={styles.mealHeader}>
                    <TextInput
                        style={styles.mealNameInput}
                        placeholder="New Meal"
                        placeholderTextColor="#2C3A2D"
                        value={mealName}
                        onChangeText={setMealName}
                    />
                </View>

            {/* image picker */}
                <TouchableOpacity onPress={pickImage}>
                    {mealImage ? (
                        <Image source={{ uri: mealImage }} style={styles.mealImage} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="camera" size={40} color="#555" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* scrollable ingredients */}
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >

                {/* ingredients header */}
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Ingredients</Text>
                    <Text style={styles.tableHeaderText}>Measurement</Text>
                </View>

                {/* ingredients list */}
                {ingredients.map((item, index) => (
                    <View key={index} style={styles.rowContainer}>
                        <View style={styles.row}>
                            <Text style={styles.ingredientText}>{item.name}</Text>
                            <View style={styles.amountContainer}>
                                <Text style={styles.amountText}>
                                    {item.amount}{item.unit}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => deleteIngredient(index)}
                                    style={styles.deleteButton}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#E38B4D" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* separator line */}
                        {index < ingredients.length - 1 && <View style={styles.divider} />}
                    </View>
                ))}

                {/* add ingredient button */}
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={28} color="#4C6444" />
                </TouchableOpacity>

                {/* save button */}
                <TouchableOpacity style={styles.saveButton} onPress={saveMeal}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* add ingredient modal */}
            <Modal 
                visible={modalVisible} 
                transparent 
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Ingredient</Text>

                        <TextInput
                            placeholder="Ingredient Name"
                            placeholderTextColor="#888"
                            style={styles.input}
                            value={newIngredient}
                            onChangeText={setNewIngredient}
                        />

                        <View style={styles.amountRow}>
                            <TextInput
                                placeholder="Amount"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                                style={[styles.input, { flex: 1, marginRight: 10 }]}
                                value={newAmount}
                                onChangeText={setNewAmount}
                            />
                            <View style={{ flex: 1, zIndex: 1000}}>
                                <DropDownPicker
                                    open={openUnit}
                                    value={newUnit}
                                    items={[
                                        { label: "grams (g)", value: "g" },
                                        { label: "milliliters (ml)", value: "ml" },
                                        { label: "ounces (oz)", value: "oz" },
                                        { label: "pounds (lbs)", value: "lbs" },
                                        { label: "liters (l)", value: "l" },
                                        { label: "teaspoons", value: "tsp" },
                                        { label: "tablespoons", value: "tbsp" },
                                        { label: "cups", value: "cups" },
                                    ]}
                                    setOpen={setOpenUnit}
                                    setValue={setNewUnit}
                                    setItems={() => {}}
                                    placeholder="Select Unit"
                                    style={{
                                        borderColor: '#ccc',
                                        borderRadius: 8,
                                    }}
                                    dropDownContainerStyle={{
                                        borderColor: '#ccc',
                                    }}
                                />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setModalVisible(false);
                                    setNewIngredient("");
                                    setNewAmount("");
                                    setNewUnit("g");
                                }}
                            >
                                    <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.addModalButton}
                                onPress={addIngredient}
                            >
                                    <Text style={styles.addText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    topSection: {
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

    mealNameInput: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2C3A2D",
        textAlign: "center",
        minWidth: 150,
    },

    mealImage: {
        width: 230,
        height: 180,
        borderRadius: 15,
        borderColor: "#499F44",
        borderWidth: 1,
        marginVertical: 10,
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

    backButton: {
        position: "absolute",
        top: 55,
        left: 20,
        zIndex: 10,
    },

    placeholder: {
        width: 230,
        height: 180,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#499F44",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(240, 240, 240, 0.5)",
        marginVertical: 10,
    },

    ingredientsContainer: {
        alignSelf: "center",
        width: "90%",
        maxWidth: 350,
        marginTop: 10,
        paddingHorizontal: 10,
    },

    tableHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
        marginBottom: 8,
    },

    tableHeaderText: {
        fontSize: 22,
        fontWeight: "700",
        color: "#000",
    },

    tableRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomColor: "#A2C49F",
        borderBottomWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 5,
    },

    ingredientText: {
        fontSize: 15,
        color: "#000",
        flex: 1,
    },

    amountContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    amountText: {
        fontSize: 15,
        color: "#000",
    },

    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 15,
        paddingVertical: 10,
        gap: 8,
    },

    deleteButton: {
        padding: 4,
    },

    divider: {
        width: "100%",
        height: 1,
        backgroundColor: "#499F44",
        alignSelf: "center",
    },

    saveButton: {
        alignSelf: "center",
        backgroundColor: "#E38B4D",
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 60,
        marginTop: 20,
        marginBottom: 30,
    },

    saveButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },

    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },

    modalContent: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        width: "85%",
    },

    modalTitle: {
        fontWeight: "700",
        fontSize: 18,
        marginBottom: 15,
        textAlign: "center",
    },

    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        fontSize: 15,
    },

    amountRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
    },

    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },

    addModalButton: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        marginLeft: 10,
    },

    cancelButton: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        marginRight: 10,
    },

    cancelText: {
        color: "#888",
        fontWeight: "600",
        fontSize: 16,
    },

    addText: {
        color: "#499F44",
        fontWeight: "700",
        fontSize: 16,
    },
});
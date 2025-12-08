// meal ingredients editing screen

import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity, 
    StyleSheet,
    SafeAreaView,
    Modal,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_URL, Response, retrieveValue } from "../util";

interface Ingredient {
    name: string;
    amount: string;
    unit: string;
}

export default function EditMeal() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [mealName, setMealName] = useState("");
    const [mealImage, setMealImage] = useState<string | null>(null);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [newIngredient, setNewIngredient] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newUnit, setNewUnit] = useState("g");
    const [openUnit, setOpenUnit] = useState(false);

    // Fetch meal data when component mounts
    useEffect(() => {
        fetchMealData();
    }, [id]);

    const fetchMealData = async () => {
        try {
            setLoading(true);
            const loginToken = await retrieveValue('jwt');

            if (!loginToken) {
                Alert.alert('Error', 'Please log in to edit meals');
                router.back();
                return;
            }

            const response = await fetch(`${API_URL}/get-meal`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${loginToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mealId: id
                })
            });

            type MealResponse = {
                meal: {
                    name: string,
                    mealPictureURL: string,
                    ingredients: [{
                        name: string,
                        amount: number,
                        unit: string
                    }]
                }
            }

            const body: Response<MealResponse> = await response.json();

            if (!response.ok || body.success !== 'success') {
                throw new Error(body.message || 'Failed to fetch meal');
            }

            // Set the meal data
            setMealName(body.payload!.meal.name);
            setMealImage(body.payload!.meal.mealPictureURL);
            setIngredients(body.payload!.meal.ingredients.map(ingredient => ({
                name: ingredient.name,
                amount: String(ingredient.amount),
                unit: ingredient.unit.trim()
            })));

        } catch (error) {
            console.error('Error fetching meal:', error);
            Alert.alert('Error', 'Failed to load meal data. Please try again.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

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
    }

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
        Alert.alert(
            "Delete Ingredient",
            `Are you sure you want to delete ${ingredients[index].name}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        const updatedIngredients = ingredients.filter((_, i) => i !== index);
                        setIngredients(updatedIngredients);
                    }
                }
            ]
        );
    };

    const saveMeal = async () => {
        try {
            const loginToken = await retrieveValue('jwt');

            if (!loginToken) {
                Alert.alert('Error', 'Please log in to save changes');
                return;
            }

            // Prepare the meal update data
            const updateData = {
                mealId: id,
                meal: {
                    name: mealName,
                    mealPictureURL: mealImage,
                    ingredients: ingredients.map(ing => ({
                        name: ing.name,
                        amount: parseFloat(ing.amount),
                        unit: ing.unit
                    }))
                }
            };

            const response = await fetch(`${API_URL}/update-meal`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${loginToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            const body = await response.json();

            if (!response.ok || body.success !== 'success') {
                throw new Error(body.message || 'Failed to update meal');
            }

            Alert.alert(
                "Changes Saved!",
                `${mealName} has been updated successfully.`,
                [
                    {
                        text: "OK",
                        onPress: () => router.back(),
                    }
                ]
            );

        } catch (error) {
            console.error('Error saving meal:', error);
            Alert.alert('Error', 'Failed to save changes. Please try again.');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#499F44" />
                    <Text style={styles.loadingText}>Loading meal...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* back button */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Meal Name */}
            <View style={styles.topSection}>
                <View style={styles.mealHeader}>
                    <TextInput
                        style={styles.mealNameInput}
                        value={mealName}
                        onChangeText={setMealName}
                    />
                </View>

                {/* Meal Image */}
                <View style={styles.imageContainer}>
                    {mealImage ? (
                        <Image source={{ uri: mealImage }} style={styles.mealImage} />
                    ) : (
                        <View style={[styles.mealImage, styles.placeholderImage]}>
                            <Ionicons name="fast-food" size={60} color="#499F44" />
                        </View>
                    )}
                    <TouchableOpacity style={styles.editPhotoButton} onPress={pickImage}>
                        <Ionicons name="camera" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Ingredients Header */}
            <ScrollView 
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* table header */}
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Ingredients</Text>
                    <Text style={styles.tableHeaderText}>Measurement</Text>
                </View>

                {/* Ingredients List */}
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
                                    <Ionicons name="trash-outline" size={16} color="#E38B4D" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* separator line */}
                        {index < ingredients.length - 1 && <View style={styles.divider} />}
                    </View>
                ))}

                {/* Add Button */}
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#499F44" />
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity style={styles.saveButton} onPress={saveMeal}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Add Ingredient Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Ingredient</Text>

                        <TextInput
                            placeholder="Ingredient name"
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
                            <View style={{ flex: 1, zIndex: 1000 }}>
                                <DropDownPicker
                                    open={openUnit}
                                    value={newUnit}
                                    items={[
                                        {label: "grams (g)", value: "g" },
                                        {label: "kilograms (kg)", value: "kg" },
                                        {label: "milliliters (ml)", value: "ml" },
                                        {label: "liters (L)", value: "L" },
                                        {label: "teaspoons (tsp)", value: "tsp" },
                                        {label: "tablespoons (tbsp)", value: "tbsp" },
                                        {label: "cups (cup)", value: "cup" },
                                        {label: "ounces (oz)", value: "oz" },
                                        {label: "pounds (lbs)", value: "lbs" },
                                    ]}
                                    setOpen={setOpenUnit}
                                    setValue={setNewUnit}
                                    setItems={() => {}}
                                    placeholder="Select Unit"
                                    style={{
                                        borderColor: "#ccc",
                                        borderRadius: 8,
                                    }}
                                    dropDownContainerStyle={{
                                        borderColor: "#ccc",
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
        backgroundColor: "#fff", 
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666'
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 20,
        paddingTop: 50,
    },

    topSection: {
        alignItems: "center",
        paddingHorizontal: 25,
        paddingTop: 20,
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

    backButton: {
        position: "absolute",
        top: 55,
        left: 20,
        zIndex: 10,
    },

    mealNameInput: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2C3A2D",
        textAlign: "center",
        minWidth: 150,
    },

    imageContainer: { 
        position: "relative",
        marginVertical: 10,
    },

    mealImage: {
        width: 230,
        height: 180,
        borderRadius: 15,
        borderColor: "#499F44",
        borderWidth: 1,
    },

    placeholderImage: {
        backgroundColor: 'rgba(73, 159, 68, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    editPhotoButton: {
        position: "absolute",
        bottom: 5,
        right: 5,
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },

    tableHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
        marginBottom: 5,
    },

    tableHeaderText: { 
        fontWeight: "700", 
        fontSize: 22,
        color: "#000",
    },

    rowContainer: {
        alignSelf: "stretch",
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: "center",
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
        minWidth: 50,
        textAlign: "right",
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

    addButton: { 
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 15,
        paddingVertical: 10,
        gap: 8,
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
        fontSize: 16 
    },

    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
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

    cancelButton: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        marginRight: 10,
    },

    addModalButton: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        marginLeft: 10,
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
// empty screen for new meal creation

// NOTE: this will be the default screen when a usesr decides to add a new meal/

import React, { use, useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Modal,
    Alert,
    ScrollView,
    Pressable,
    Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { API_URL, loadFileBytes, Response, retrieveValue, uploadChunks, UploadInfo } from "../util";
import { getSelectedTemplate, Template } from "../select-template";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewMeal() {
    const { mealId } = useLocalSearchParams<{ mealId: string }>();

    const [mealName, setMealName] = useState("");
    const [mealImage, setMealImage] = useState<string | null>(null);
    const [ingredients, setIngredients] = useState<
        { templateId: string; name: string; amount: number; unit: string }[]
    >([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [newAmount, setNewAmount] = useState("");

    const [template, setTemplate] = useState<Template | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const navigation = useNavigation();

    useEffect(() => {
        setModalVisible(true);
        console.log(template);
    }, [template]);

    useFocusEffect(() => {
        const tmp = getSelectedTemplate();
        if (tmp != null)
            setTemplate(tmp);
    });
    
    useEffect(() => {
        fetchMealData();
    }, [mealId]);

    const fetchMealData = async () => {
        if (mealId === undefined)
            return;

        try {
            setLoading(true);
            const loginToken = await retrieveValue('jwt');
    
            if (!loginToken) {
                Alert.alert('Error', 'Please log in to view meals');
                return;
            }
    
            const response = await fetch(`${API_URL}/get-meal`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${loginToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mealId: mealId
                })
            });

            type MealResponse = {
                meal: {
                    name: string,
                    mealPictureURL: string,
                    ingredients: [{
                        templateId: string,
                        name: string,
                        amount: number,
                        unit: string
                    }]
                }
            }
    
            const body: Response<MealResponse> = await response.json();
    
            if (!response.ok) {
                throw new Error(body.message || 'Failed to fetch meals');
            }
    
            if (body.success !== 'success') {
                throw new Error(body.message || 'Failed to fetch meals');
            }

            const meal = body.payload?.meal!;

            setIngredients(meal.ingredients.map(ingredient => ({
                templateId: ingredient.templateId,
                name: ingredient.name,
                unit: ingredient.unit,
                amount: ingredient.amount
            })));
            setMealImage(meal.mealPictureURL);
            setMealName(meal.name);
        } catch (error) {
            console.error('Error fetching meals:', error);
            Alert.alert('Error', 'Failed to load meals. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    

    const initializeMealPictureUpload = async (mealId: string, fileSize: number): Promise<UploadInfo> => {
        const jwt = await retrieveValue('jwt');

        if (jwt == null)
            throw "No jwt.";

        const response = await fetch(`${API_URL}/initialize-meal-picture-upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mealId: mealId,
                fileSize: fileSize
            })
        });

        let body: Response<UploadInfo> | null;
        try {
            body = await response.json();
        } catch (ex) {
            body = null;
        }

        if (!response.ok || body?.success !== "success")
            throw "Invalid response: " + JSON.stringify(body ? body : response);

        return body.payload!;
    }

    const uploadMealPicture = async (image: string, mealId: string) => {
        let bytes;
        try {
            bytes = loadFileBytes(image);
        } catch (ex) {
            console.error("Failed to load picture.", ex);
            return;
        }

        let uploadInfo;
        try {
            uploadInfo = await initializeMealPictureUpload(mealId, bytes.length);
        } catch (ex) {
            console.error("Failed to initialize upload.", ex);
            return;
        }

        try {
            await uploadChunks(bytes, uploadInfo);
        } catch (ex) {
            console.error("Failed to upload picture", ex);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1
        });

        if (!result.canceled)
            setMealImage(result.assets[0].uri);
    };

    const addIngredient = () => {
        if (newAmount && template) {
            setIngredients(prev => [
                ...prev,
                {
                    templateId: template!.id,
                    name: template!.name,
                    amount: parseFloat(newAmount),
                    unit: template!.unit.trim()
                },
            ]);
            setNewAmount("");
            setModalVisible(false);
        }
    };

    const deleteIngredient = (index: number) => {
        const updatedIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(updatedIngredients);
    };

    type Ingredient = {
        templateId: string,
        amount: number
    }

    const newMeal = async (ingredients: Ingredient[]) => {
        const token = await retrieveValue("jwt");

        const requestBody = {
            name: mealName,
            ingredients: ingredients,
        };

        const response = await fetch(`${API_URL}/create-meal`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
        });

        type CreateMealResponse = {
            mealId: string,
            ingredientsAdded: number
        }

        const body: Response<CreateMealResponse> = await response.json();

        if (!response.ok || body.success !== "success") {
            throw new Error(JSON.stringify(body));
        }

        if (mealImage != null)
            await uploadMealPicture(mealImage, body.payload?.mealId!);

        navigation.goBack();
    };

    const updateMeal = async (ingredients: Ingredient[]) => {
        const token = await retrieveValue("jwt");

        const requestBody = {
            mealId: mealId,
            meal: {
                name: mealName,
                ingredients: ingredients
            }
        };

        const response = await fetch(`${API_URL}/update-meal`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
        });

        type UpdateMealResponse = {
            ingredientsAdded: number
        }

        const body: Response<UpdateMealResponse> = await response.json();

        if (!response.ok || body.success !== "success") {
            throw new Error(JSON.stringify(body));
        }

        if (body.payload?.ingredientsAdded! < ingredients.length)
            throw "Not all ingredients added."

        navigation.goBack();
    };

    const saveMeal = async () => {
        if (!mealName.trim()) {
            Alert.alert("Missing Information", "Please enter a meal name.");
            return;
        }

        if (ingredients.length === 0) {
            Alert.alert("Missing Information", "Please add at least one ingredient.");
            return;
        }

        // Convert ingredient objects to backend format
        const formattedIngredients = ingredients.map((ing) => ({
            templateId: ing.templateId, // MUST be a UUID
            amount: ing.amount, // MUST be a number
        }));

        setSaving(true);
        try {
            if (mealId === undefined)
                await newMeal(formattedIngredients);
            else
                await updateMeal(formattedIngredients);
        } catch (ex) {
            console.error("ERROR SAVING MEAL:", ex);
            Alert.alert("Error", "Could not save meal.");   
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>


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
                        placeholderTextColor="#747474ff"
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
                    <View style={styles.headerCell}>
                        <Text style={styles.tableHeaderText}>Ingredients</Text>
                        <View style={styles.headerUnderline} />
                    </View>

                    <View style={styles.headerCell}>
                        <Text style={styles.tableHeaderText}>Measurement</Text>
                        <View style={styles.headerUnderline} />
                    </View>
                </View>


                {/* ingredients list */}
                {ingredients.map((item, index) => (
                    <View key={index} style={styles.rowContainer}>
                        <View style={styles.row}>
                            <Text style={styles.ingredientText}>{item.name}</Text>
                            <View style={styles.amountContainer}>
                                <Text style={styles.amountText}>
                                    {item.amount} {item.unit}
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
                <Pressable
                    onPress={() => setModalVisible(true)}
                    style={({ pressed }) => [
                        styles.addBtn,
                        pressed && {
                            backgroundColor: '#CBE8CC', // On press glow
                            shadowColor: '#499F44',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.5,
                            shadowRadius: 10,
                            transform: [{ scale: 0.95 }],
                            ...(Platform.OS === 'android' ? { elevation: 8 } : {}),
                        },
                    ]}
                >
                    <Ionicons name="add" size={35} color="#2E7D32" />
                </Pressable>


                {/* save button */}
                <TouchableOpacity style={[styles.saveButton, saving && {opacity: .75}]} disabled={saving} onPress={saveMeal}>
                    <Text style={styles.saveButtonText}>{saving? "Saving..." : "Save"}</Text>
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
                        <View style={styles.modalTitleWrap}>
                            <Text style={styles.modalTitle}>Add Ingredient</Text>
                            <View style={styles.modalTitleUnderline} />
                        </View>



                        <Pressable
                            onPress={() => {
                                setModalVisible(false);
                                router.push("/select-template");
                            }}
                        >
                            <Text style={[styles.ingredientInput, template == null && { color: "#888" }]}>{template ? template.name : "Tap to Set Ingredient"}</Text>
                        </Pressable>

                        <View style={styles.amountRow}>
                            <TextInput
                                placeholder="Amount"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                                style={[styles.input, { flex: 1, marginRight: 10 }]}
                                value={newAmount}
                                onChangeText={setNewAmount}
                            />
                            <Text style={styles.unit}>{template ? template.unit.trim() : "Unit"}</Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.pillButton, styles.cancelPill]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setNewAmount("");
                                }}
                            >
                                <Text style={styles.cancelPillText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.pillButton, styles.addPill]}
                                onPress={addIngredient}
                            >
                                <Text style={styles.addPillText}>Add</Text>
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
        paddingTop: 20,
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
        top: 80,
        left: 20,
        zIndex: 10,
    },

    unit: {
        textAlign: "center",
        textAlignVertical: "center",
        padding: 10,
        marginBottom: 10,
        fontSize: 15,
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
        backgroundColor: "#F3A261",
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 60,
        marginTop: 20,
        marginBottom: 30,
        borderWidth: 2,
        borderColor: "#d9893c",
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

    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        fontSize: 15,
        textAlign: "center",
    },

    ingredientInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        fontSize: 15,
        textAlign: "center",
        marginTop: 10
    },

    amountRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: -8,
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
    pillButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: "center",
        marginHorizontal: 5,
        borderWidth: 2,
    },

    cancelPill: {
        backgroundColor: "#fff",
        borderColor: "#ccc",
    },

    addPill: {
        backgroundColor: "#E3F7E3",
        borderColor: "#499F44",
    },

    cancelPillText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666",
    },

    addPillText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2E7D32",
    },
    addBtn: {
        marginBottom: 12,
        marginTop: 15,
        alignSelf: 'center',
        width: 45,
        height: 45,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#499F44',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E6F4EA',
    },
    headerCell: {
        flex: 1,
        alignItems: "center",
    },

    headerUnderline: {
        width: "50%",
        height: 1.5,
        backgroundColor: "#499F44",
        borderRadius: 1,
        marginTop: 4,
    },
    modalTitleWrap: {
        alignItems: "center",
        marginBottom: 12,
    },

    modalTitle: {
        fontWeight: "700",
        fontSize: 18,
        textAlign: "center",
        marginBottom: 2,
        lineHeight: 22,
    },

    modalTitleUnderline: {
        width: 300,
        height: 1.5,
        backgroundColor: "#499F44",
        borderRadius: 2,
        marginTop: 2,
    },

});
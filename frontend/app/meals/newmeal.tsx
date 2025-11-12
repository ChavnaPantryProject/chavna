// empty screen for new meal creation
// implement the empty picture option.

// NOTE: this will be the default screen when a usesr decides to add a new meal/

import React, { use, useState } from "react";
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet,
    SafeAreaView,
    TextInput,
    Modal,
    Touchable,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function NewMeal() {
    const [mealName, setMealName] = useState("");
    const [mealImage, setMealImage] = useState<string | null>(null);
    const [ingredients, setIngredients] = useState<
        { name: String; amount: String; unit: string }[]
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

    return (
        <SafeAreaView style={styles.container}>

            {/* back button */}
            <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={styles.backButton}
            >
                <Ionicons name="chevron-back" size={26} color="black" />
            </TouchableOpacity>

            {/* meal name input */}
            <View style={styles.nameBox}>
                <TextInput
                    style={styles.mealNameInput}
                    placeholder="New Meal"
                    placeholderTextColor="#000"
                    value={mealName}
                    onChangeText={setMealName}
                />
            </View>

            {/* image picker */}
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
                {mealImage ? (
                    <Image source={{ uri: mealImage }} style={styles.image} />
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="camera" size={40} color="#555" />
                    </View>
                )}
            </TouchableOpacity>

            {/* ingredients header */}
            <View style={styles.ingredientsContainer}>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Ingredients</Text>
                    <Text style={styles.tableHeaderText}>Measurement</Text>
                </View>

                {/* ingredients list */}
                <FlatList
                    data={ingredients}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.tableRow}>
                            <Text style={styles.ingredientText}>{item.name}</Text>
                            <Text style={styles.ingredientText}>
                                {item.amount}
                                {item.unit}
                            </Text>
                        </View>
                    )}
                />
            </View>

            {/* add ingredient button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="add" size={28} color="#4C6444" />
            </TouchableOpacity>

            {/* save button */}
            <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            {/* add ingredient modal */}
            <Modal 
                visible={modalVisible} 
                transparent 
                animationType="slide"
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
                            <View style={{ flex: 1}}>
                                <DropDownPicker
                                    open={openUnit}
                                    value={newUnit}
                                    items={[
                                        { label: "grames (g)", value: "g" },
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
                                onPress={() => setModalVisible(false)}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={addIngredient}>
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
        alignItems: "center",
        paddingHorizontal: 25,
        paddingTop: 20,
    },

    backButton: {
        position: "absolute",
        top: 55,
        left: 20,
        zIndex: 10,
    },

    nameBox: {
        alignItems: "center",
        marginBottom: 20,
    },

    mealNameInput: {
        backgroundColor: "#D9E8D2",
        borderRadius: 12,
        borderColor: "#9DBE96",
        borderWidth: 1.5,
        textAlign: "center",
        width: "80%",
        paddingVertical: 10,
        fontSize: 18,
        fontWeight: "600",
    },

    imageContainer: {
        width: 200,
        height: 160,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "A2C49F",
    },

    image: {
        width: 200,
        height: 160,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "A2C49F",
    },

    placeholder: {
        width: 200,
        height: 160,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "A2C49F",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(240, 240, 240, 0.5)",
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
        paddingHorizontal: 10,
        marginBottom: 8,
    },

    tableHeaderText: {
        fontWeight: "700",
        fontSize: 16,
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
        color: "#333",
        flexShrink: 1,
    },

    addButton: {
        alignSelf: "center",
        marginTop: 10,
    },

    saveButton: {
        alignSelf: "center",
        backgroundColor: "#E38B4D",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 60,
        marginTop: 20,
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
        width: "80%",
    },

    modalTitle: {
        fontWeight: "700",
        fontSize: 18,
        marginBottom: 10,
    },

    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 8,
        marginBottom: 10,
    },

    amountRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },

    cancelText: {
        color: "#888",
        fontWeight: "600",
    },

    addText: {
        color: "#4C6444",
        fontWeight: "700",
    },
});
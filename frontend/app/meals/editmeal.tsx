// meal ingredients editing screen
// add popup for add ingredient, amount, and dropdown for measurement units.
// measurement units popup after you add ingredient, "--", click that to trigger popup.

import React, { useState } from "react";
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet,
    SafeAreaView,
    Modal,
    TextInput,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function EditMeal() {
    const [mealName, setMealName] = useState("Fettuccine Alfredo");
    const [mealImage, setMealImage] = useState(require("../../assets/images/FETTUCCINE_ALFREDO_HOMEPAGE.jpg"));
    const [ingredients, setIngredients] = useState([
        { name: "Dry Fettuccine Pasta", amount: "680", unit: "g" },
        { name: "Butter", amount: "240", unit: "g" },
        { name: "Heavy Cream", amount: "360", unit: "g" },
        { name: "Garlic Salt", amount: "0.5", unit: "g" },
        { name: "Romano Cheese", amount: "75", unit: "g" },
        { name: "Parmesan Cheese", amount: "45", unit: "g" },
    ]);

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
            setMealImage({ uri: result.assets[0].uri} as any);
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

    return (
        <SafeAreaView style={styles.container}>
        {/* back button */}
        <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
        >
            <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>

        {/* Meal Name */}
        <View style={styles.nameBox}>
            <TextInput
                style={styles.mealNameInput}
                value={mealName}
                onChangeText={setMealName}
            />
        </View>

        {/* Meal Image */}
        <View style={styles.imageContainer}>
            <Image source={mealImage} style={styles.image} />
            <TouchableOpacity style={styles.editPhotoButton} onPress={pickImage}>
                <Ionicons name="camera" size={18} color="white" />
            </TouchableOpacity>
        </View>

        {/* Ingredients Header */}
        <View style={styles.ingredientsContainer}>
            <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Ingredients</Text>
                <Text style={styles.tableHeaderText}>Measurement</Text>
            </View>

            {/* Ingredients List */}
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

        {/* Add Button */}
        <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
        >
            <Ionicons name="add" size={28} color="#4C6444" />
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>

        {/* Add Ingredient Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
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
                        <View
                            style={{flex: 1 }}
                        >
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
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={addIngredient}>
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

    mealName: {
        fontSize: 20,
        fontWeight: "600",
        textAlign: "center",
        color: "#2B2B2B",
    },

    headerText: { 
        flex: 1, 
        textAlign: "center", 
        fontSize: 18, 
        fontWeight: "500" 
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
        alignItems: "center", 
        marginBottom: 25 
    },

    image: {
        width: 200,
        height: 160,
        borderRadius: 12,
    },

    editPhotoButton: {
        position: "absolute",
        bottom: 5,
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },

    ingredientsContainer: {
        alignSelf: "center",
        width: "90%",
        maxWidth: 350,
        marginTop: 20,
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
        fontSize: 16 
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
        marginTop: 10 
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
        width: "80%",
    },

    modalTitle: { 
        fontWeight: "700", 
        fontSize: 18, 
        marginBottom: 10 
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
        alignItems: "center" 
    },

    dropdown: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },

    dropdownText: { 
        fontSize: 14 
    },

    picker: {
        height: 50,
        width: "100%",
    },

    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },

    cancelText: { 
        color: "#888", 
        fontWeight: "600" 
    },

    addText: { 
        color: "#4C6444", 
        fontWeight: "700" 
    },
});

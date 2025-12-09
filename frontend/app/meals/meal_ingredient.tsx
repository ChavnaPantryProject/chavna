// normal layout when displaying meal ingredients (not in edit mode)

import React, {useEffect, useState} from "react";
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
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_URL, Response, retrieveValue } from "../util";

export default function MealIngredientScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [menuVisible, setMenuVisible] = useState(false);
    const [ingredients, setIngredients] = useState<{name: string, amount: string}[]>([])
    const [imageURL, setImageURL] = useState<string | null>(null);
    const [mealName, setMealName] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMealData();
    }, [id]);

    const fetchMealData = async () => {
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
    
            if (!response.ok) {
                throw new Error(body.message || 'Failed to fetch meals');
            }
    
            if (body.success !== 'success') {
                throw new Error(body.message || 'Failed to fetch meals');
            }

            setIngredients(body.payload!.meal.ingredients.map(ingredient => ({
                name: ingredient.name,
                amount: String(ingredient.amount) + " " + ingredient.unit.trim()
            })));
            setImageURL(body.payload!.meal.mealPictureURL);
            setMealName(body.payload!.meal.name);
        } catch (error) {
            console.error('Error fetching meals:', error);
            Alert.alert('Error', 'Failed to load meals. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMeal = async () => {
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
                    onPress: async () => {
                        try {
                            const loginToken = await retrieveValue('jwt');

                            if (!loginToken) {
                                Alert.alert('Error', 'Please log in to delete meals');
                                return;
                            }

                            const response = await fetch(`${API_URL}/delete-meal`, {
                                method: 'POST',
                                headers: {
                                    Authorization: `Bearer ${loginToken}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ mealId: id }),
                            });

                            const body = await response.json();

                            if (!response.ok || body.success !== 'success') {
                                throw new Error(body.message || 'Failed to delete meal');
                            }

                            // Navigate back to meals tab
                            router.replace("/(tabs)/meal");

                            // Show confirmation
                            setTimeout(() => {
                                Alert.alert("Meal Deleted", "This meal has been deleted successfully.");
                            }, 500);
                        } catch (error) {
                            console.error('Error deleting meal:', error);
                            Alert.alert('Error', 'Failed to delete meal. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#499F44" />
                    <Text style={styles.loadingText}>Loading meal details...</Text>
                </View>
            </SafeAreaView>
        );
    }

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
                                router.push({
                                    pathname: "/meals/editMeal",
                                    params: { mealId: id }  // Pass the meal ID
                                });
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
                    <Text style={styles.mealTitle}>{mealName}</Text>
                </View>

                {/* Image */}
                {imageURL ? (
                    <Image
                        source={{uri: imageURL}}
                        style={styles.mealImage}
                    />
                ) : (
                    <View style={[styles.mealImage, styles.placeholderImage]}>
                        <Ionicons name="fast-food" size={60} color="#499F44" />
                    </View>
                )}
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
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
        borderWidth: 1,
        marginVertical: 10,
    },

    placeholderImage: {
        backgroundColor: 'rgba(73, 159, 68, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingVertical: 8,
        paddingHorizontal: 10,
    },

    ingredientText: {
        fontSize: 15,
        color: "#000",
        flex: 1,
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
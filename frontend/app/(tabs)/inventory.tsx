import { useState, useEffect } from "react";
import { Text, View, StyleSheet, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import ModalFoodCategory from "../pantry/modalFoodCategory";
import ModalCreateFoodCategory from "../pantry/modalAddCategory";
import { API_URL, retrieveValue } from "../util";

type GetCategoriesResponse = {
    categories: Array<string>;
};

const InventoryScreen = () => {
    const [searchEntry, setSearchEntry] = useState("");
    const [foodCategories, setFoodCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // modal for users food categories
    const [modalCategoryVisible, setCategoryModalVisible] = useState(false);
    const openCategory = () => setCategoryModalVisible(true);
    const closeCategory = () => setCategoryModalVisible(false);

    // modal for user creating a new category
    const [modalCreateCategory, setCreateCategory] = useState(false);
    const openCreateCategory = () => setCreateCategory(true);
    const closeCreateCategory = () => setCreateCategory(false);

    // title shown inside the category modal
    const [foodCategoryTitle, setFoodCategoryTitle] = useState<string | null>(null);

    // Fetch categories from backend
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const token = await retrieveValue("jwt");
            if (!token) {
                console.error("No authentication token found");
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/get-categories`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok && data.success === "success") {
                const payload: GetCategoriesResponse = data.payload;
                setFoodCategories(payload.categories);
            } else {
                console.error("Failed to fetch categories:", data.message || data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCategoryCreated = () => {
        // Refresh categories after creating a new one
        fetchCategories();
    };

    return (
        <View style={style.container}>
            {/* header meatball */}
            <View style={style.header}>
                <Pressable onPress={() => console.log("Menu pressed")} hitSlop={8}>
                    <Feather name="more-horizontal" size={24} style={style.meatballButton} />
                </Pressable>
            </View>

            {/* search bar */}
            <View style={style.searchBar}>
                <Ionicons
                    name="search"
                    size={22}
                    color="#499F44"
                    style={{ marginRight: 6 }}
                />
                <TextInput
                    value={searchEntry}
                    onChangeText={setSearchEntry}
                    placeholder="Search"
                    autoCorrect={false}
                />
            </View>

            {/* list of food categories (scrollable grid) */}
            <View style={style.catergoryContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#499F44" style={{ marginTop: 50 }} />
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        style={{ flex: 1, alignSelf: "stretch" }}
                        contentContainerStyle={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            paddingBottom: 24,
                        }}
                    >
                        {foodCategories.map((category) => (
                            <Pressable
                                key={category}
                                style={style.card}
                                onPress={() => {
                                    openCategory();
                                    setFoodCategoryTitle(category);
                                }}
                            >
                                <View style={style.cardTextContainer}>
                                    <Text>{category}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* food category modal */}
            <ModalFoodCategory
                visible={modalCategoryVisible}
                onClose={closeCategory}
                title={foodCategoryTitle ?? undefined}
                foodCategories={foodCategories}
            />

            {/* create category button */}
            <Pressable onPress={openCreateCategory}>
                <Text style={style.addButton}>+</Text>
            </Pressable>

            {/* create category modal (kept outside of the button) */}
            <ModalCreateFoodCategory
                visible={modalCreateCategory}
                onClose={closeCreateCategory}
                title="New Group"
                onSubmit={(name) => {
                    handleCategoryCreated();
                }}
            />
        </View>
    );
};

const style = StyleSheet.create({
    // container of the entire screen
    container: {
        flex: 1,
        alignItems: "center",
        marginTop: 10,
    },

    // positions the meatball to the right
    header: {
        alignSelf: "stretch",
        paddingHorizontal: 16,
        paddingTop: 5,
        paddingBottom: 10,
        flexDirection: "row",
        justifyContent: "flex-end",
        marginRight: 15,
    },

    meatballButton: {
        color: "gray",
    },

    searchBar: {
        borderWidth: 2,
        borderColor: "rgba(73,159,68,1)",
        borderRadius: 25,
        width: 350,
        padding: 10,
        alignItems: "center",
        marginBottom: 16,
        flexDirection: "row",
    },

    // wrapper that gives the scroll area height/width
    catergoryContainer: {
        flex: 1,
        alignSelf: "stretch",
    },

    // cards
    card: {
        borderWidth: 2,
        borderColor: "rgba(73,159,68,1)",
        borderRadius: 25,
        height: 150,
        width: 150,
        padding: 10,
        margin: 10,
        alignItems: "center",
        backgroundColor: "rgba(73,159,68,0.1)",
    },

    // text + underline inside each card
    cardTextContainer: {
        alignSelf: "stretch",
        marginHorizontal: -10, // make underline span full width of card
        borderBottomWidth: 2,
        borderBottomColor: "green",
        paddingBottom: 6,
        alignItems: "center",
    },

    addButton: {
        fontSize: 40,
        color: "rgba(138, 141, 138, 1)",
    },
});

export default InventoryScreen;
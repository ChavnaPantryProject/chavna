// import { useState, useEffect } from "react";
// import { Text, View, StyleSheet, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
// import { Feather, Ionicons } from "@expo/vector-icons";
// import ModalFoodCategory from "../pantry/modalFoodCategory";
// import ModalCreateFoodCategory from "../pantry/modalAddCategory";
// import { API_URL, retrieveValue } from "../util";

// type GetCategoriesResponse = {
//     categories: Array<string>;
// };

// const InventoryScreen = () => {
//     const [searchEntry, setSearchEntry] = useState("");
//     const [foodCategories, setFoodCategories] = useState<string[]>([]);
//     const [loading, setLoading] = useState(true);

//     // modal for users food categories
//     const [modalCategoryVisible, setCategoryModalVisible] = useState(false);
//     const openCategory = () => setCategoryModalVisible(true);
//     const closeCategory = () => setCategoryModalVisible(false);

//     // modal for user creating a new category
//     const [modalCreateCategory, setCreateCategory] = useState(false);
//     const openCreateCategory = () => setCreateCategory(true);
//     const closeCreateCategory = () => setCreateCategory(false);

//     // title shown inside the category modal
//     const [foodCategoryTitle, setFoodCategoryTitle] = useState<string | null>(null);

//     // Fetch categories from backend
//     const fetchCategories = async () => {
//         try {
//             setLoading(true);
//             const token = await retrieveValue("jwt");
//             if (!token) {
//                 console.error("No authentication token found");
//                 setLoading(false);
//                 return;
//             }

//             const response = await fetch(`${API_URL}/get-categories`, {
//                 method: "GET",
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     "Content-Type": "application/json",
//                 },
//             });

//             const data = await response.json();

//             if (response.ok && data.success === "success") {
//                 const payload: GetCategoriesResponse = data.payload;
//                 setFoodCategories(payload.categories);
//             } else {
//                 console.error("Failed to fetch categories:", data.message || data);
//             }
//         } catch (error) {
//             console.error("Error fetching categories:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchCategories();
//     }, []);

//     const handleCategoryCreated = () => {
//         // Refresh categories after creating a new one
//         fetchCategories();
//     };

//     return (
//         <View style={style.container}>
//             {/* header meatball */}
//             <View style={style.header}>
//                 <Pressable onPress={() => console.log("Menu pressed")} hitSlop={8}>
//                     <Feather name="more-horizontal" size={24} style={style.meatballButton} />
//                 </Pressable>
//             </View>

//             {/* search bar */}
//             <View style={style.searchBar}>
//                 <Ionicons
//                     name="search"
//                     size={22}
//                     color="#499F44"
//                     style={{ marginRight: 6 }}
//                 />
//                 <TextInput
//                     value={searchEntry}
//                     onChangeText={setSearchEntry}
//                     placeholder="Search"
//                     autoCorrect={false}
//                 />
//             </View>

//             {/* list of food categories (scrollable grid) */}
//             <View style={style.catergoryContainer}>
//                 {loading ? (
//                     <ActivityIndicator size="large" color="#499F44" style={{ marginTop: 50 }} />
//                 ) : (
//                     <ScrollView
//                         showsVerticalScrollIndicator={false}
//                         keyboardShouldPersistTaps="handled"
//                         style={{ flex: 1, alignSelf: "stretch" }}
//                         contentContainerStyle={{
//                             flexDirection: "row",
//                             flexWrap: "wrap",
//                             justifyContent: "center",
//                             paddingBottom: 24,
//                         }}
//                     >
//                         {foodCategories.map((category) => (
//                             <Pressable
//                                 key={category}
//                                 style={style.card}
//                                 onPress={() => {
//                                     openCategory();
//                                     setFoodCategoryTitle(category);
//                                 }}
//                             >
//                                 <View style={style.cardTextContainer}>
//                                     <Text>{category}</Text>
//                                 </View>
//                             </Pressable>
//                         ))}
//                     </ScrollView>
//                 )}
//             </View>

//             {/* food category modal */}
//             <ModalFoodCategory
//                 visible={modalCategoryVisible}
//                 onClose={closeCategory}
//                 title={foodCategoryTitle ?? undefined}
//                 foodCategories={foodCategories}
//             />

//             {/* create category button */}
//             <Pressable onPress={openCreateCategory}>
//                 <Text style={style.addButton}>+</Text>
//             </Pressable>

//             {/* create category modal (kept outside of the button) */}
//             <ModalCreateFoodCategory
//                 visible={modalCreateCategory}
//                 onClose={closeCreateCategory}
//                 title="New Group"
//                 onSubmit={(name) => {
//                     handleCategoryCreated();
//                 }}
//             />
//         </View>
//     );
// };

// const style = StyleSheet.create({
//     // container of the entire screen
//     container: {
//         flex: 1,
//         alignItems: "center",
//         marginTop: 10,
//     },

//     // positions the meatball to the right
//     header: {
//         alignSelf: "stretch",
//         paddingHorizontal: 16,
//         paddingTop: 5,
//         paddingBottom: 10,
//         flexDirection: "row",
//         justifyContent: "flex-end",
//         marginRight: 15,
//     },

//     meatballButton: {
//         color: "gray",
//     },

//     searchBar: {
//         borderWidth: 2,
//         borderColor: "rgba(73,159,68,1)",
//         borderRadius: 25,
//         width: 350,
//         padding: 10,
//         alignItems: "center",
//         marginBottom: 16,
//         flexDirection: "row",
//     },

//     // wrapper that gives the scroll area height/width
//     catergoryContainer: {
//         flex: 1,
//         alignSelf: "stretch",
//     },

//     // cards
//     card: {
//         borderWidth: 2,
//         borderColor: "rgba(73,159,68,1)",
//         borderRadius: 25,
//         height: 150,
//         width: 150,
//         padding: 10,
//         margin: 10,
//         alignItems: "center",
//         backgroundColor: "rgba(73,159,68,0.1)",
//     },

//     // text + underline inside each card
//     cardTextContainer: {
//         alignSelf: "stretch",
//         marginHorizontal: -10, // make underline span full width of card
//         borderBottomWidth: 2,
//         borderBottomColor: "green",
//         paddingBottom: 6,
//         alignItems: "center",
//     },

//     addButton: {
//         fontSize: 40,
//         color: "rgba(138, 141, 138, 1)",
//     },
// });

// export default InventoryScreen;

import { useState, useEffect, useMemo } from "react";
import { Text, View, StyleSheet, TextInput, Pressable, ActivityIndicator, ScrollView, Platform } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import ModalFoodCategory from "../pantry/modalFoodCategory";
import ModalCreateFoodCategory from "../pantry/modalAddCategory";
import FoodRows from "../pantry/foodRows";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { API_URL, retrieveValue } from "../util";

type GetCategoriesResponse = {
    categories: Array<string>;
};

type BackendFoodItem = {
    id: string;
    name: string;
    amount: number;
    unit: string;
    expiration: string;
    lastUsed: string | null;
    unitPrice: number;
    addDate: string;
    category: string;
};

type FoodItem = {
    id: string;
    name: string;
    qty: number;
    expDate: string;
    category?: string;
    unit?: string;
};

const InventoryScreen = () => {
    const [searchEntry, setSearchEntry] = useState("");
    const [foodCategories, setFoodCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [allFoodItems, setAllFoodItems] = useState<FoodItem[]>([]);
    const [loadingFoodItems, setLoadingFoodItems] = useState(false);

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

    // Fetch all food items when search entry changes (with debounce)
    useEffect(() => {
        if (searchEntry.trim().length > 0) {
            // Small debounce to avoid too many API calls while typing
            const timeoutId = setTimeout(() => {
                fetchAllFoodItems();
            }, 300);

            return () => clearTimeout(timeoutId);
        } else {
            setAllFoodItems([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchEntry]);

    const fetchAllFoodItems = async () => {
        try {
            setLoadingFoodItems(true);
            const token = await retrieveValue("jwt");
            if (!token) {
                console.error("No authentication token found");
                setLoadingFoodItems(false);
                return;
            }

            // Fetch all food items without category filter
            const response = await fetch(`${API_URL}/get-food-items`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            });

            const data = await response.json();

            if (response.ok && data.success === "success") {
                const backendItems: BackendFoodItem[] =
                    data.payload?.items || [];

                // Map backend items to frontend format
                const mappedItems: FoodItem[] = backendItems.map(
                    (item) => ({
                        id: item.id,
                        name: item.name,
                        qty: item.amount,
                        expDate: item.expiration
                            ? new Date(item.expiration)
                                  .toISOString()
                                  .split("T")[0]
                            : "",
                        category: item.category,
                        unit: item.unit,
                    })
                );
                setAllFoodItems(mappedItems);
            } else {
                console.error("Failed to fetch food items:", data.message || data);
                setAllFoodItems([]);
            }
        } catch (error) {
            console.error("Error fetching food items:", error);
            setAllFoodItems([]);
        } finally {
            setLoadingFoodItems(false);
        }
    };

    // Filter food items by search term
    const filteredFoodItems = useMemo(() => {
        if (!searchEntry.trim()) {
            return [];
        }
        const searchLower = searchEntry.toLowerCase().trim();
        return allFoodItems.filter((item) =>
            item.name.toLowerCase().includes(searchLower)
        );
    }, [allFoodItems, searchEntry]);

    const handleCategoryCreated = () => {
        // Refresh categories after creating a new one
        fetchCategories();
    };

    const deleteFoodItemOnServer = async (id: string) => {
        try {
            const token = await retrieveValue("jwt");
            if (!token) {
                console.error("No authentication token found");
                return;
            }

            const response = await fetch(`${API_URL}/update-food-item`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    foodItemId: id,
                    newAmount: 0, // backend interprets this as delete
                }),
            });

            const data = await response.json();

            if (response.ok && data.success === "success") {
                console.log("Item deleted!");
                // Refresh the food items list
                if (searchEntry.trim().length > 0) {
                    fetchAllFoodItems();
                }
            } else {
                console.error("Delete failed:", data.message || data);
            }
        } catch (error) {
            console.error("Error deleting food item:", error);
        }
    };

    const handleDeleteFood = (id: string) => {
        setAllFoodItems((prev) => prev.filter((item) => item.id !== id));
        deleteFoodItemOnServer(id);
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
        <View style={style.searchContainer}>
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
                placeholderTextColor="#555"
                autoCorrect={false}
                style={style.searchInput}
            />
            {searchEntry.length > 0 && (
                <Pressable onPress={() => setSearchEntry("")}>
                    <Ionicons name="close-circle" size={20} color="#499F44" />
                </Pressable>
            )}
        </View>


            {/* Show search results or category list */}
            <View style={style.catergoryContainer}>
                {searchEntry.trim().length > 0 ? (
                    // Show search results
                    <View style={style.searchResultsContainer}>
                        <View style={style.searchResultsHeader}>
                            <View style={style.searchResultsTitleContainer}>
                                <Ionicons
                                    name="search"
                                    size={20}
                                    color="#499F44"
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={style.searchResultsTitle}>
                                    {loadingFoodItems
                                        ? "Searching..."
                                        : `Found ${filteredFoodItems.length} ${filteredFoodItems.length === 1 ? "item" : "items"}`}
                                </Text>
                            </View>
                            {!loadingFoodItems && filteredFoodItems.length === 0 && (
                                <Text style={style.searchEmptyText}>
                                    No items found matching "{searchEntry}"
                                </Text>
                            )}
                        </View>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            style={{ flex: 1, alignSelf: "stretch" }}
                            contentContainerStyle={{
                                paddingBottom: 24,
                                paddingHorizontal: 16,
                            }}
                        >
                            {loadingFoodItems ? (
                                <View style={style.emptySearchContainer}>
                                    <ActivityIndicator size="large" color="#499F44" />
                                </View>
                            ) : filteredFoodItems.length === 0 ? (
                                <View style={style.emptySearchContainer}>
                                    <Ionicons
                                        name="search-outline"
                                        size={64}
                                        color="#ccc"
                                        style={{ marginBottom: 16 }}
                                    />
                                    <Text style={style.emptySearchText}>
                                        Try searching for something else
                                    </Text>
                                </View>
                            ) : (
                                <View style={style.searchResultsList}>
                                    {filteredFoodItems.map((foodItem) => (
                                        <Swipeable
                                            key={foodItem.id}
                                            renderRightActions={() => (
                                                <View style={style.rightAction}>
                                                    <Pressable
                                                        style={style.deleteBtn}
                                                        onPress={() => handleDeleteFood(foodItem.id)}
                                                    >
                                                        <Text style={style.deleteText}>Delete</Text>
                                                    </Pressable>
                                                </View>
                                            )}
                                        >
                                            <View style={style.searchResultCard}>
                                                <View style={style.searchResultContent}>
                                                    <Text style={style.searchResultName}>
                                                        {foodItem.name}
                                                    </Text>
                                                    {foodItem.category && (
                                                        <Text style={style.searchResultCategory}>
                                                            {foodItem.category}
                                                        </Text>
                                                    )}
                                                    <View style={style.searchResultBottom}>
                                                        <Text style={style.searchResultQty}>
                                                            {foodItem.qty} {foodItem.unit || "None"}
                                                        </Text>
                                                        {foodItem.expDate && (
                                                            <Text style={style.searchResultExp}>
                                                                Exp: {foodItem.expDate}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        </Swipeable>
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                ) : (
                    // Show category cards
                    loading ? (
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
                    )
                )}
            </View>

            {/* food category modal */}
            <ModalFoodCategory
                visible={modalCategoryVisible}
                onClose={closeCategory}
                title={foodCategoryTitle ?? undefined}
                foodCategories={foodCategories}
            />

            {/* create category button - only show when not searching */}
            {searchEntry.trim().length === 0 && (
                <Pressable
                    onPress={openCreateCategory}
                    style={({ pressed }) => [
                        style.addButton,
                        pressed && {
                            backgroundColor: '#CBE8CC',
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
            )}


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
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        marginBottom: 16,
        flexDirection: "row",
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },

    searchInput: {
        flex: 1,
        fontSize: 15,
        color: "#333",
    },


    clearButton: {
        marginLeft: 8,
        padding: 2,
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
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
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
    marginTop: 16,
    marginBottom: 24,
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


    searchResultsContainer: {
        flex: 1,
        alignSelf: "stretch",
        backgroundColor: "#f9f9f9",
    },

    searchResultsHeader: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 2,
        borderBottomColor: "rgba(73,159,68,1)",
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },

    searchResultsTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
    },

    searchResultsTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "rgba(73,159,68,1)",
    },

    searchEmptyText: {
        fontSize: 14,
        color: "#666",
        marginTop: 8,
        fontStyle: "italic",
    },

    emptySearchContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 80,
        paddingHorizontal: 32,
    },

    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#499F44",
        borderRadius: 25,
        paddingHorizontal: 12,
        marginBottom: 20,
        height: 50,
        backgroundColor: "#FFFFFF",
        alignSelf: "stretch",
        marginHorizontal: 16,
    },


    emptySearchText: {
        fontSize: 16,
        color: "#999",
        textAlign: "center",
    },

    searchResultsList: {
        width: "100%",
        paddingBottom: 24,
    },

    searchResultCard: {
        width: "100%",
        borderWidth: 2,
        borderColor: "rgba(73,159,68,1)",
        borderRadius: 15,
        backgroundColor: "rgba(73,159,68,0.1)",
        marginBottom: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },

    searchResultContent: {
        width: "100%",
    },

    searchResultName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#000",
        marginBottom: 6,
    },

    searchResultCategory: {
        fontSize: 15,
        color: "rgba(73,159,68,1)",
        fontWeight: "500",
        marginBottom: 10,
    },

    searchResultBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
    },

    searchResultQty: {
        fontSize: 14,
        color: "#333",
    },

    searchResultExp: {
        fontSize: 14,
        color: "#333",
        textAlign: "right",
    },

    rightAction: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        marginLeft: 8,
        backgroundColor: "#DC2626",
        borderRadius: 12,
        paddingHorizontal: 16,
    },

    deleteBtn: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },

    deleteText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },
});

export default InventoryScreen;
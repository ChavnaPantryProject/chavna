import { useState, useEffect, useMemo, useRef } from "react";
import { Text, View, StyleSheet, TextInput, Pressable, ActivityIndicator, ScrollView, Modal, Platform, Alert } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import ModalFoodCategory from "../pantry/modalFoodCategory";
import ModalCreateFoodCategory from "../pantry/modalAddCategory";
import Swipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
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

type FoodItemRowProps = {
  foodItem: FoodItem;
  onDelete: (id: string) => void;
};

const FoodItemRow = ({ foodItem, onDelete }: FoodItemRowProps) => {
  const swipeableRef = useRef<SwipeableMethods | null>(null);

  return (
    <Swipeable
      ref={swipeableRef}
      overshootRight={false}
      renderRightActions={() => (
        <View style={style.swipeDeleteBackground} />
      )}
      onSwipeableOpen={() => {
        Alert.alert(
          "Delete item",
          `Delete "${foodItem.name}" from your inventory?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                // snap the row back when user cancels
                swipeableRef.current?.close();
              },
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => {
                onDelete(foodItem.id);
                // row unmounts after deletion
              },
            },
          ]
        );
      }}
    >
      <View style={style.searchResultCard}>
        <View style={style.searchResultContent}>
          <Text style={style.searchResultName}>{foodItem.name}</Text>
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
  );
};


const InventoryScreen = () => {
    const [searchEntry, setSearchEntry] = useState("");
    const [foodCategories, setFoodCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [allFoodItems, setAllFoodItems] = useState<FoodItem[]>([]);
    const [loadingFoodItems, setLoadingFoodItems] = useState(false);

    // Modal for showing menu options
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [deletingCategory, setDeletingCategory] = useState(false);

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
            const timeoutId = setTimeout(() => {
                fetchAllFoodItems();
            }, 300);

            return () => clearTimeout(timeoutId);
        } else {
            setAllFoodItems([]);
        }
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
                const backendItems: BackendFoodItem[] = data.payload?.items || [];

                const mappedItems: FoodItem[] = backendItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    qty: item.amount,
                    expDate: item.expiration
                        ? new Date(item.expiration).toISOString().split("T")[0]
                        : "",
                    category: item.category,
                    unit: item.unit,
                }));
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
                    newAmount: 0,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success === "success") {
                console.log("Item deleted!");
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

    const handleDeleteCategory = async (categoryName: string) => {
        try {
            setDeletingCategory(true);
            const token = await retrieveValue("jwt");
            if (!token) {
                console.error("No authentication token found");
                setDeletingCategory(false);
                return;
            }

            const response = await fetch(`${API_URL}/remove-category`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: categoryName,
                }),
            });

            const data: { success?: string; message?: string } = await response.json();

            if (response.ok && data.success === "success") {
                console.log("Category deleted successfully!");
                // Refresh categories list
                await fetchCategories();
                setMenuVisible(false);
                setSelectedCategory(null);
            } else {
                const errorMsg = data.message || "Unknown error";
                console.error("Failed to delete category:", errorMsg);
                
                // Provide better error message for SQL errors (likely foreign key constraint)
                if (errorMsg.includes("SQL Error")) {
                    alert(
                        `Cannot delete category "${categoryName}".\n\n` +
                        "This category has food items or templates associated with it. " +
                        "Please delete or reassign all items in this category first."
                    );
                } else {
                    alert("Failed to delete category: " + errorMsg);
                }
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Error deleting category. Please try again.");
        } finally {
            setDeletingCategory(false);
        }
    };

    const openMenuForCategory = (categoryName: string) => {
        setSelectedCategory(categoryName);
        setMenuVisible(true);
    };

    return (
        <View style={style.container}>
            {/* header trashcan */}
            <View style={style.header}>
                <Pressable
                    onPress={() => {
                        if (searchEntry.trim().length === 0 && foodCategories.length > 0) {
                            // If not searching, show menu for first category or all categories
                            setMenuVisible(true);
                        }
                    }}
                    hitSlop={8}
                >
                    <Ionicons name="trash-outline" size={24} color="rgba(73,159,68,1)" />
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
              : `Found ${filteredFoodItems.length} ${
                  filteredFoodItems.length === 1 ? "item" : "items"
                }`}
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
            <FoodItemRow
            key={foodItem.id}
            foodItem={foodItem}
            onDelete={handleDeleteFood}
            />
        ))}
        </View>

        )}
      </ScrollView>
    </View>
  ) : (
    loading ? (
      <ActivityIndicator
        size="large"
        color="#499F44"
        style={{ marginTop: 50 }}
      />
    ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, alignSelf: "stretch" }}
        contentContainerStyle={style.categoryContent}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
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

{/* create category button - fixed at bottom, above list */}
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
            {/* Category options menu modal */}
            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable
                    style={style.menuOverlay}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={style.menuContainer}>
                        {selectedCategory ? (
                            <>
                                <Text style={style.menuTitle}>
                                    Category: {selectedCategory}
                                </Text>
                                <Pressable
                                    style={style.menuButton}
                                    onPress={() => {
                                        setMenuVisible(false);
                                        handleDeleteCategory(selectedCategory);
                                    }}
                                    disabled={deletingCategory}
                                >
                                    {deletingCategory ? (
                                        <ActivityIndicator size="small" color="#DC2626" />
                                    ) : (
                                        <>
                                            <Ionicons name="trash-outline" size={20} color="#DC2626" />
                                            <Text style={style.menuButtonTextDelete}>
                                                Delete Category
                                            </Text>
                                        </>
                                    )}
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <Text style={style.menuTitle}>Select a category</Text>
                                <ScrollView style={style.categoryListScroll}>
                                    {foodCategories.map((category) => (
                                        <Pressable
                                            key={category}
                                            style={style.categoryMenuItem}
                                            onPress={() => {
                                                setSelectedCategory(category);
                                            }}
                                        >
                                            <Text style={style.categoryMenuItemText}>
                                                {category}
                                            </Text>
                                            <Ionicons
                                                name="chevron-forward"
                                                size={20}
                                                color="#666"
                                            />
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </>
                        )}
                        <Pressable
                            style={style.menuCancelButton}
                            onPress={() => {
                                setMenuVisible(false);
                                setSelectedCategory(null);
                            }}
                        >
                            <Text style={style.menuCancelButtonText}>Cancel</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>

            {/* food category modal */}
            <ModalFoodCategory
                visible={modalCategoryVisible}
                onClose={closeCategory}
                title={foodCategoryTitle ?? undefined}
                foodCategories={foodCategories}
            />

            {/* bottom add button area - only show when not searching */}
            {searchEntry.trim().length === 0 && (
                <View style={style.bottomAddContainer}>
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
                </View>
            )}


            {/* create category modal */}
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
    container: {
        flex: 1,
        alignItems: "center",
        marginTop: 0,
    },

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
        backgroundColor: "white",
    },

    clearButton: {
        marginLeft: 8,
        padding: 2,
    },

    catergoryContainer: {
        flex: 1,
        alignSelf: "stretch",
    },

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

        // no shadow (This fixes the gray borders I think)
        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },


    cardTextContainer: {
        alignSelf: "stretch",
        marginHorizontal: -10,
        borderBottomWidth: 2,
        borderBottomColor: "green",
        paddingBottom: 6,
        alignItems: "center",
    },

    addButton: {
        position: 'absolute',
        bottom: 12,
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

        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
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
    marginTop: 10,
    borderWidth: 2,
    borderColor: "rgba(73,159,68,1)",
    borderRadius: 15,
    backgroundColor: "rgba(73,159,68,0.1)",
    marginBottom: 12,
    padding: 16,

    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0, 
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
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-end",
        paddingRight: 10,
        marginBottom: 12,
    },

    deleteIconButton: {
        backgroundColor: "#DC2626",
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },



    deleteBtn: {
        backgroundColor: "#DC2626",
        borderRadius: 20,
        height: 120,
        width: 70,
        alignItems: "center",
        justifyContent: "center",
    },

    deleteText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },

    menuOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    menuContainer: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        width: "85%",
        maxWidth: 400,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },

    menuTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 16,
        textAlign: "center",
    },

    menuButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FEE2E2",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 12,
    },

    menuButtonTextDelete: {
        color: "#DC2626",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },

    menuCancelButton: {
        backgroundColor: "#F3F4F6",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: "center",
    },

    menuCancelButtonText: {
        color: "#666",
        fontSize: 16,
        fontWeight: "600",
    },

    categoryListScroll: {
        maxHeight: 300,
        marginBottom: 12,
    },

    categoryMenuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    categoryMenuItemText: {
        fontSize: 16,
        color: "#333",
    },
    categoryContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingBottom: 140, 
},

    bottomAddContainer: {
    alignSelf: "stretch",
    height: 70,                   
    alignItems: "center",
    justifyContent: "center",
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

searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
},
swipeDeleteBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 12,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingRight: 16,  
},



});

export default InventoryScreen;
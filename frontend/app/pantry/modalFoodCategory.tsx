// pantry/ModalFoodCategory.tsx
import React, { useState, useEffect } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, StyleSheet as RNStyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Entypo } from "@expo/vector-icons";
import { API_URL, retrieveValue } from "../util";
import FoodRows from "./foodRows";

type Props = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children?: React.ReactNode;
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
    weight: number;
    qty: number;
    expDate: string;
};

export default function ModalFoodCategory({ visible, onClose, title }: Props) {
    const [arrOfFood, setArrOfFood] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [displayArr, setDisplayArr] = useState<FoodItem[]>([]);

    // States for sorting direction arrow
    // ALL ARROWS WITH TRUE ARE THE DEFAULT, TRUE POINTS ARROW DOWN, FALSE POINTS ARROW UP
    const [nameArrow, setNameArrow] = useState<boolean>(true);
    const [weightArrow, setWeightArrow] = useState<boolean>(true);
    const [qtyArrow, setQtyArrow] = useState<boolean>(true);
    const [expDateArrow, setExpDateArrow] = useState<boolean>(true);

    // color scheme for active and non active filters
    const ACTIVEFILTERCOLOR = "rgba(73,159,68,1)"; // green
    const NONACTIVEFILTERCOLOR = "gray";

    // state for the active filter
    const [activeFilter, setActiveFilter] = useState<string>("");

    // function to reset all arrows to default
    function resetAllArrows() {
        setNameArrow(true);
        setWeightArrow(true);
        setQtyArrow(true);
        setExpDateArrow(true);
    }

    // function to clear all states for when modal closes
    function resetState() {
        resetAllArrows();
        setActiveFilter("");
        setDisplayArr([...arrOfFood]);
    }

    // Fetch food items from backend when modal opens and title changes
    useEffect(() => {
        if (visible && title) {
            fetchFoodItems();
        } else if (!visible) {
            // Reset state when modal closes
            resetState();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, title]);

    const fetchFoodItems = async () => {
        if (!title) return;

        try {
            setLoading(true);
            const token = await retrieveValue("jwt");
            if (!token) {
                console.error("No authentication token found");
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/get-food-items`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ category: title }),
            });

            const data = await response.json();

            if (response.ok && data.success === "success") {
                const backendItems: BackendFoodItem[] = data.payload?.items || [];
                // Map backend items to frontend format
                const mappedItems: FoodItem[] = backendItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    weight: 0,
                    qty: item.amount,
                    expDate: item.expiration
                        ? new Date(item.expiration).toISOString().split("T")[0]
                        : "",
                }));
                setArrOfFood(mappedItems);
                setDisplayArr([...mappedItems]);
            } else {
                console.error("Failed to fetch food items:", data.message || data);
                setArrOfFood([]);
                setDisplayArr([]);
            }
        } catch (error) {
            console.error("Error fetching food items:", error);
            setArrOfFood([]);
            setDisplayArr([]);
        } finally {
            setLoading(false);
        }
    };

const deleteFoodItem = async (id: string) => {
    try {
        const token = await retrieveValue("jwt");
        if (!token) {
            console.error("No authentication token found");
            return;
        }

        const response = await fetch(`${API_URL}/update-food-item`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                foodItemId: id,
                newAmount: 0     // backend interprets this as delete
            })
        });

        const data = await response.json();

        if (response.ok && data.success === "success") {
            console.log("Item deleted!");
        } else {
            console.error("Delete failed:", data.message || data);
        }

    } catch (error) {
        console.error("Error deleting food item:", error);
    }
};

    //----------------------- Functions for sorting -----------------------
    // name ascending
    function sortAscName() {
        resetAllArrows();
        setActiveFilter("name");
        return [...arrOfFood].sort((a, b) => a.name.localeCompare(b.name));
    }
    // name descending
    function sortDescName() {
        resetAllArrows();
        setActiveFilter("name");
        setNameArrow(false); // make arrow point up
        return [...arrOfFood].sort((a, b) => b.name.localeCompare(a.name));
    }
    // weight ascending
    function sortAscWeight() {
        resetAllArrows();
        setActiveFilter("weight");
        return [...arrOfFood].sort((a, b) => a.weight - b.weight);
    }
    // weight descending
    function sortDescWeight() {
        resetAllArrows();
        setActiveFilter("weight");
        setWeightArrow(false); // make arrow point up
        return [...arrOfFood].sort((a, b) => b.weight - a.weight);
    }
    // qty ascending
    function sortAscQty() {
        resetAllArrows();
        setActiveFilter("qty");
        return [...arrOfFood].sort((a, b) => a.qty - b.qty);
    }
    // qty descending
    function sortDescQty() {
        resetAllArrows();
        setActiveFilter("qty");
        setQtyArrow(false); // make arrow point up
        return [...arrOfFood].sort((a, b) => b.qty - a.qty);
    }
    // exp date ascending
    function sortAscExpDate() {
        resetAllArrows();
        setActiveFilter("expDate");
        return [...arrOfFood].sort(
            (a, b) =>
                new Date(a.expDate as string).getTime() -
                new Date(b.expDate as string).getTime()
        );
    }
    // exp date descending
    function sortDescExpDate() {
        resetAllArrows();
        setActiveFilter("expDate");
        setExpDateArrow(false); // make arrow point up
        return [...arrOfFood].sort(
            (a, b) =>
                new Date(b.expDate as string).getTime() -
                new Date(a.expDate as string).getTime()
        );
    }
    // --------------------------End of sorting functions ----------------------------------------

    // delete food by id
    const handleDeleteFood = (id: string) => {
        setArrOfFood((prev) => prev.filter((item) => item.id !== id));
        setDisplayArr((prev) => prev.filter((item) => item.id !== id));
        deleteFoodItem(id);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                {/* Outer container for backdrop + sheet */}
                <View style={style.backdrop}>
                    {/* Backdrop touch area (outside the sheet) */}
                    <Pressable
                        style={RNStyleSheet.absoluteFill}
                        onPress={() => {
                            resetState();
                            onClose();
                        }}
                    />

                    {/* Sheet content (not inside the Pressable) */}
                    <View style={style.sheet}>
                        {/* category name header with an underline */}
                        {title ? <Text style={style.title}>{title}</Text> : null}

                        {/* column headers with the filter icon */}
                        <View style={style.columnFilters}>
                            <View style={[style.specificFilterColumn, { flex: 1 }]}>
                                <Text style={style.filterText}>Name</Text>

                                <Pressable
                                    onPress={() =>
                                        setDisplayArr(
                                            nameArrow ? sortDescName() : sortAscName()
                                        )
                                    }
                                >
                                    <Entypo
                                        name={nameArrow ? "triangle-down" : "triangle-up"}
                                        size={15}
                                        color={
                                            activeFilter == "name"
                                                ? ACTIVEFILTERCOLOR
                                                : NONACTIVEFILTERCOLOR
                                        }
                                    />
                                </Pressable>
                            </View>

                            <View style={[style.specificFilterColumn, { flex: 1.1 }]}>
                                <Text style={style.filterText}>Weight</Text>

                                <Pressable
                                    onPress={() =>
                                        setDisplayArr(
                                            weightArrow ? sortDescWeight() : sortAscWeight()
                                        )
                                    }
                                >
                                    <Entypo
                                        name={weightArrow ? "triangle-down" : "triangle-up"}
                                        size={15}
                                        color={
                                            activeFilter == "weight"
                                                ? ACTIVEFILTERCOLOR
                                                : NONACTIVEFILTERCOLOR
                                        }
                                    />
                                </Pressable>
                            </View>

                            <View style={[style.specificFilterColumn, { flex: 1 }]}>
                                <Text style={style.filterText}>Qty</Text>

                                <Pressable
                                    onPress={() =>
                                        setDisplayArr(
                                            qtyArrow ? sortDescQty() : sortAscQty()
                                        )
                                    }
                                >
                                    <Entypo
                                        name={qtyArrow ? "triangle-down" : "triangle-up"}
                                        size={15}
                                        color={
                                            activeFilter == "qty"
                                                ? ACTIVEFILTERCOLOR
                                                : NONACTIVEFILTERCOLOR
                                        }
                                    />
                                </Pressable>
                            </View>

                            <View style={[style.specificFilterColumn, { flex: 1.2 }]}>
                                <Text style={style.filterText}>Exp Date</Text>
                                <Pressable
                                    onPress={() =>
                                        setDisplayArr(
                                            expDateArrow
                                                ? sortDescExpDate()
                                                : sortAscExpDate()
                                        )
                                    }
                                >
                                    <Entypo
                                        name={expDateArrow ? "triangle-down" : "triangle-up"}
                                        size={15}
                                        color={
                                            activeFilter == "expDate"
                                                ? ACTIVEFILTERCOLOR
                                                : NONACTIVEFILTERCOLOR
                                        }
                                    />
                                </Pressable>
                            </View>
                        </View>

                        {/* rows area (scrolls vertically) */}
                        <View style={style.rowsArea}>
                            <ScrollView
                                style={{ flex: 1, alignSelf: "stretch" }}
                                contentContainerStyle={{ paddingBottom: 24 }}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                <FoodRows
                                    loading={loading}
                                    displayArr={displayArr}
                                    onDelete={handleDeleteFood}
                                />
                            </ScrollView>
                        </View>

                        {/* plus icon to add another category (hook up later) */}
                        <Pressable onPress={() => {}}>
                            <Text style={style.addButton}>+</Text>
                        </Pressable>
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}

const style = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        marginTop: 80,
    },

    // area that holds the rows & scroll
    rowsArea: {
        flex: 1,
        alignSelf: "stretch",
        width: "100%",
        marginTop: 6,
    },

    // modal container
    sheet: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "rgb(227,234,225)",
        padding: 18,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "rgba(73,159,68,1)",
        height: 600,
        alignItems: "center",
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
        borderBottomWidth: 2,
        borderColor: "rgba(73,159,68,1)",
        width: "100%",
        textAlign: "center",
        paddingBottom: 10,
    },

    // the filter row
    columnFilters: {
        borderBottomWidth: 1,
        borderColor: "rgba(73,159,68,1)",
        width: "100%",
        justifyContent: "space-between",
        flexDirection: "row",
        paddingBottom: 10,
        marginTop: 0,
        marginBottom: 5,
        paddingRight: 10,
        paddingLeft: 10,
    },

    // each individual filter column
    specificFilterColumn: {
        flexDirection: "row",
        alignItems: "center",
    },

    filterText: {
        fontSize: 17,
        fontWeight: "500",
        marginRight: 4,
    },

    addButton: {
        fontSize: 40,
        color: "rgba(138, 141, 138, 1)",
        marginTop: 6,
    },
});
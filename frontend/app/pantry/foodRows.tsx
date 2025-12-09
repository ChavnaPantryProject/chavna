// pantry/foodRows.tsx
import React, { useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import Swipeable, {
    SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

type FoodItem = {
    id: string;
    name: string;
    qty: number;
    qty_unit: string;
    expDate: string;
};

type Props = {
    loading: boolean;
    displayArr: FoodItem[];
    onDelete: (id: string) => void;
};

type FoodRowItemProps = {
    foodItem: FoodItem;
    onDelete: (id: string) => void;
};

const FoodRowItem = ({ foodItem, onDelete }: FoodRowItemProps) => {
    //console.log(foodItem)
    const swipeableRef = useRef<SwipeableMethods | null>(null);

    return (
        <Swipeable
            ref={swipeableRef}
            overshootRight={false}
            renderRightActions={() => (
                <View style={styles.rightAction} />
            )}
            onSwipeableOpen={() => {
                Alert.alert(
                    "Delete item",
                    `Delete "${foodItem.name}" from this category?`,
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
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    {/* Name */}
                    <Text
                        style={styles.nameText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {foodItem.name}
                    </Text>

                    {/* Bottom row: qty + exp date */}
                    <View style={styles.bottomRow}>
                    
                        <Text style={styles.qtyText}>
                            {foodItem.qty}
                            {foodItem.qty_unit.trim() !== "None" ? ` ${foodItem.qty_unit}` : ""}
                        </Text>

                        {foodItem.expDate ? (
                            <Text style={styles.expText}>
                                Exp: {foodItem.expDate}
                            </Text>
                        ) : null}
                    </View>
                </View>
            </View>
        </Swipeable>
    );
};

const FoodRows = ({ loading, displayArr, onDelete }: Props) => {
    if (loading) {
        return (
            <View style={styles.centerWrap}>
                <ActivityIndicator size="large" color="#499F44" />
            </View>
        );
    }

    if (displayArr.length === 0) {
        return (
            <View style={styles.centerWrap}>
                <Text style={styles.emptyText}>No items in this category</Text>
            </View>
        );
    }

    return (
        <View style={styles.listContainer}>
            {displayArr.map((foodItem) => (
                <FoodRowItem
                    key={foodItem.id}
                    foodItem={foodItem}
                    onDelete={onDelete}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        width: "100%",
        paddingBottom: 24,
    },

    centerWrap: {
        width: "100%",
        paddingTop: 50,
        alignItems: "center",
        justifyContent: "center",
    },

    emptyText: {
        textAlign: "center",
        fontSize: 16,
        color: "gray",
    },

    card: {
        width: "100%",
        borderWidth: 2,
        borderColor: "rgba(73,159,68,1)",
        borderRadius: 15,
        backgroundColor: "#f6f4eaff", // color of the card
        marginBottom: 12,
        padding: 12,
    },

    cardContent: {
        width: "100%",
    },

    nameText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#000",
        marginBottom: 6,
    },

    bottomRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
    },

    qtyText: {
        fontSize: 14,
        color: "#333",
    },

    expText: {
        fontSize: 14,
        color: "#333",
        textAlign: "right",
    },

    // updated to act like the swipe background (no button press, just visual area)
    rightAction: {
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-end",
        marginBottom: 12,
        borderTopRightRadius: 15,
        borderBottomRightRadius: 15,
        paddingRight: 16,
    },

    // kept from original file (no longer used, but left to avoid unnecessary changes)
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

export default FoodRows;
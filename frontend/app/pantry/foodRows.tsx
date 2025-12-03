import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type FoodItem = {
    id: string;
    name: string;
    weight: number;
    qty: number;
    expDate: string;
};

type Props = {
    loading: boolean;
    displayArr: FoodItem[];
    onDelete: (id: string) => void;
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
                <Swipeable
                    key={foodItem.id}
                    renderRightActions={() => (
                        <View style={styles.rightAction}>
                            <Pressable
                                style={styles.deleteBtn}
                                onPress={() => onDelete(foodItem.id)}
                            >
                                <Text style={styles.deleteText}>Delete</Text>
                            </Pressable>
                        </View>
                    )}
                >
                    <View style={styles.entryOfFood}>
                        <Text style={[styles.specficFoodEntryColumn, styles.flex1]}>
                            {foodItem.name}
                        </Text>
                        <Text style={[styles.specficFoodEntryColumn, styles.flex1]}>
                            {foodItem.weight}
                        </Text>
                        <Text style={[styles.specficFoodEntryColumn, styles.flex1]}>
                            {foodItem.qty}
                        </Text>
                        <Text style={[styles.specficFoodEntryColumn, styles.flex2]}>
                            {foodItem.expDate}
                        </Text>
                    </View>
                </Swipeable>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        width: "100%",
        paddingHorizontal: 10,
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

    specficFoodEntryColumn: {
        textAlign: "center",
        fontSize: 17,
    },

    flex1: {
        flex: 1,
    },

    flex2: {
        flex: 2,
    },

    entryOfFood: {
        width: "100%",
        borderWidth: 2,
        borderColor: "rgba(73,159,68,1)",
        borderRadius: 5,
        backgroundColor: "white",
        marginTop: 5,
        padding: 6,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    rightAction: {
        justifyContent: "center",
        alignItems: "center",
        marginTop: 5,
        marginLeft: 8,
        backgroundColor: "#DC2626",
        borderRadius: 5,
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

export default FoodRows;
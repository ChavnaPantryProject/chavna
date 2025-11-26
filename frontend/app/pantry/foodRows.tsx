import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";

type FoodItem = {
    name: string;
    weight: number;
    qty: number;
    expDate: string;
};

type Props = {
    loading: boolean;
    displayArr: FoodItem[];
};

const FoodRows = ({ loading, displayArr }: Props) => {
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
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {displayArr.map((foodItem, index) => {
                return (
                    <View key={`${foodItem.name}-${index}`} style={styles.entryOfFood}>
                        <Text style={[styles.specficFoodEntryColumn, styles.flex1]}>{foodItem.name}</Text>
                        <Text style={[styles.specficFoodEntryColumn, styles.flex1]}>{foodItem.weight}</Text>
                        <Text style={[styles.specficFoodEntryColumn, styles.flex1]}>{foodItem.qty}</Text>
                        <Text style={[styles.specficFoodEntryColumn, styles.flex2]}>{foodItem.expDate}</Text>
                    </View>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        alignSelf: "stretch",
    },

    listContainer: {
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
});

export default FoodRows;
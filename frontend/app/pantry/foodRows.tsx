// pantry/foodRows.tsx
import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Pressable,
} from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

type FoodItem = {
    id: string;
    name: string;
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
                        {/* Name – left aligned, most space */}
                        <Text
                            style={[
                                styles.baseText,
                                styles.nameText,
                                styles.flexName,
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {foodItem.name}
                        </Text>

                        {/* Qty – centered */}
                        <Text
                            style={[
                                styles.baseText,
                                styles.qtyText,
                                styles.flexQty,
                            ]}
                        >
                            {foodItem.qty}
                        </Text>

                        {/* Exp Date – right aligned, more room & inset a bit */}
                        <Text
                            style={[
                                styles.baseText,
                                styles.dateText,
                                styles.flexDate,
                            ]}
                        >
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

    baseText: {
        fontSize: 17,
    },

    nameText: {
        textAlign: "left",
        paddingLeft: 8,
    },

    qtyText: {
        textAlign: "center",
    },

    dateText: {
        textAlign: "right",
        paddingRight: 4, // small inset so it doesn’t touch the border
    },

    // Name gets the most space
    flexName: {
        flex: 1.7,
    },

    // Qty is smaller in the middle
    flexQty: {
        flex: 0.9,
    },

    // Exp date gets more space than before so it fits nicely
    flexDate: {
        flex: 1.6,
    },

    entryOfFood: {
        width: "96%",                     // slight inset from the green border
        alignSelf: "center",
        borderWidth: 2,
        borderColor: "rgba(73,159,68,1)",
        borderRadius: 5,
        backgroundColor: "white",
        marginTop: 5,
        paddingVertical: 6,
        paddingHorizontal: 6,
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
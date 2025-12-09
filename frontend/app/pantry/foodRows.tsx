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

export default FoodRows;
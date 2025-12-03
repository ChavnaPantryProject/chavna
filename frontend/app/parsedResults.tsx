
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ParsedResultsScreen() {
  const { items } = useLocalSearchParams();
  const parsedItems = items ? JSON.parse(items as string) : [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parsed Results</Text>
      <ScrollView>
        {parsedItems.length === 0 ? (
          <Text>No parsed items available.</Text>
        ) : (
          parsedItems.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#499F44",
  },
});

import * as React from "react";
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ConfirmationScreen() {
  const router = useRouter();
  const [items, setItems] = useState([
    { name: "Chicken Breast", weight: "300g", qty: "3", exp: "9/15/2025" },
  ]);

  const addItem = () => {
    // Add a blank new row when "+" is pressed
    setItems([
      ...items,
      { name: "New Item", weight: "-", qty: "-", exp: "-" },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/scanner")}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Confirmation</Text>
      </View>

      {/* Middle Section (Soft Green) */}
      <View style={styles.content}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>Name</Text>
          <Text style={styles.headerCell}>Weight</Text>
          <Text style={styles.headerCell}>Qty</Text>
          <Text style={styles.headerCell}>Exp Date</Text>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.name}</Text>
            <Text style={styles.tableCell}>{item.weight}</Text>
            <Text style={styles.tableCell}>{item.qty}</Text>
            <Text style={styles.tableCell}>{item.exp}</Text>
          </View>
        ))}

        {/* + Button */}
        <TouchableOpacity onPress={addItem}>
          <Text style={styles.plusSign}>＋</Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton}
        onPress={() => router.push("/(tabs)/inventory")}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom White Section */}
      <View style={styles.bottomWhite} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // White top
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#D6EAD8",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    position: "absolute",
    left: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
    backgroundColor: "#E8F3E8", // soft green
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: 10,
    marginBottom: 10,
    padding: 16,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#D6EAD8",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  headerCell: {
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
    textAlign: "center",
    color: "#2E4E3F",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
    color: "#333",
    fontSize: 14,
  },
  plusSign: {
    textAlign: "center",
    fontSize: 26,
    color: "#2E4E3F",
    marginVertical: 12,
  },
  saveButton: {
    alignSelf: "center",
    backgroundColor: "#F59A73",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
    marginTop: "auto",
  },
  saveText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  bottomWhite: {
    height: 40,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

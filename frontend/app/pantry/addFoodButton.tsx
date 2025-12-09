// pantry/addFoodButton.tsx
import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onPress: () => void;
};

export default function AddFoodButton({ onPress }: Props) {
  return (
    <View style={styles.bottomAddContainer}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.addButton,
          pressed && {
            backgroundColor: "#CBE8CC",
            shadowColor: "#499F44",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            transform: [{ scale: 0.95 }],
            ...(Platform.OS === "android" ? { elevation: 8 } : {}),
          },
        ]}
      >
        <Ionicons name="add" size={35} color="#2E7D32" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomAddContainer: {
    alignSelf: "stretch",
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },

  addButton: {
    width: 45,
    height: 45,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#499F44",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F4EA",
  },
});

// pantry/ModalFoodCategory.tsx
import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

export default function ModalFoodCategory({ visible, onClose, title, children }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose} 
    >
      {/* backdrop that also dismisses */}
      <Pressable style={styles.backdrop} onPress={onClose}>

        {/* stop backdrop press from closing when tapping inside */}
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>

          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children ?? <Text>pop up</Text>}

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.primary]} onPress={onClose}>
              <Text style={styles.primaryText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgb(227,234,225)",
    padding: 18,
    borderRadius: 16,
    // light shadow
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  actions: { marginTop: 12, flexDirection: "row", justifyContent: "flex-end" },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  primary: { backgroundColor: "#4F46E5" },
  primaryText: { color: "#fff", fontWeight: "600" },
});
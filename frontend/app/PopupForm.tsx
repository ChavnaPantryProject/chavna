import React, { Dispatch, SetStateAction} from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getSelectedTemplate, Template } from "./select-template";
import { ConfirmationItem } from "./scannerConfirmation";

interface DropdownOption {
  label: string;
  value: string;
}

interface PopupMenuProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ConfirmationItem) => void;
  state: PopupState;
  setState: Dispatch<SetStateAction<PopupState>>;
}

export type PopupState = {
  quantity: string,
  price: string,
  displayName: string | null,
  scanName: string,
  template: Template | null
}

function isValidState(state: PopupState): boolean {
  return state.quantity !== "" && Number(state.quantity) > 0 && state.price !== "" && Number(state.price) >= 0 && state.displayName != null && state.template != null;
}

const PopupMenu: React.FC<PopupMenuProps> = ({
  visible,
  onClose,
  onSave,
  state,
  setState
}) => {
  const setQuantity = (quantity: string) => {
    const newState = { ...state };
    newState.quantity = quantity;

    setState(newState);
  };

  const setPrice = (price: string) => {
    const newState = { ...state };
    newState.price = price;

    setState(newState);
  }

  useFocusEffect(() => {
    const template = getSelectedTemplate();
    if (template != null) {
      const newState = {...state};
      newState.displayName = template.name;
      newState.template = template;
      newState.quantity = state.quantity;

      setState(newState);
    }
  });

  const handleSave = () => {
    const data: ConfirmationItem = {
      displayName: state.displayName,
      scanName: state.scanName,
      qty: Number(state.quantity),
      price: Number(state.price),
      template: state.template
    };

    onSave(data);
    close();
  };

  const close = () => {
    setState({
      quantity:"",
      price: "",
      displayName: null,
      scanName: "New Item",
      template: null
    })

    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Add Item</Text>

          {/* Item Selection */}
          <Pressable
            style={styles.itemPicker}
            onPress={() => router.push('/select-template')}
          >
            <Text style={state.template == null && {color: "#AAAAAA"}}>{state.displayName? state.displayName : state.scanName}</Text>
          </Pressable>

          {/* Quantity */}
          <TextInput
            style={styles.input}
            placeholder="Quantity"
            keyboardType="numeric"
            value={state.quantity}
            onChangeText={setQuantity}
          />

          {/* Price */}
          <TextInput
            style={styles.input}
            placeholder="Price"
            keyboardType="numeric"
            value={state.price}
            onChangeText={setPrice}
          />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={close}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, !isValidState(state) && {opacity: 0.5}]}
              disabled={!isValidState(state)}
              onPress={handleSave}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#d9f0cb",
    padding: 20,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2f4f2f",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2f4f2f",
    alignSelf: "flex-start",
    marginBottom: 6,
    marginTop: 4,
  },
  row: {
    width: "100%",
  },
  dropdown: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginBottom: 12,
    width: "100%",
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    marginBottom: 12,
  },
  itemPicker: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    marginBottom: 12,
    fontSize: 18,
    textAlign: "center"
  },
  dateButton: {
    backgroundColor: "#a8d5a0",
    padding: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  dateText: {
    color: "#1b3b1b",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#cde7c0",
    flex: 1,
    marginRight: 10,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#8dc78a",
    flex: 1,
    marginLeft: 10,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "#2f4f2f",
    fontWeight: "500",
  },
  saveText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});

export default PopupMenu;
/*
import this
import PopupForm from "./PopupForm";

Add for the button
<TouchableOpacity onPress={() => setPopupVisible(true)}>
  <Text style={{ fontSize: 26, color: "#2E4E3F", textAlign: "center" }}>＋</Text>
</TouchableOpacity>

possible usage:
<PopupMenu
  visible={popupVisible}
  onClose={() => setPopupVisible(false)}
  onSave={(data) => {
    console.log("Saved data:", data);
    setPopupVisible(false);
  }}
  dropdownOptions={[
    { label: "Chicken Breast", value: "chicken" },
    { label: "Beef", value: "beef" },
    { label: "Fish", value: "fish" },
    { label: "Vegetable", value: "vegetable" },
  ]}
/>
*/

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

interface DropdownOption {
  label: string;
  value: string;
}

interface PopupMenuProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  dropdownOptions: DropdownOption[];
}

const PopupMenu: React.FC<PopupMenuProps> = ({
  visible,
  onClose,
  onSave,
  dropdownOptions,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>(
    dropdownOptions[0]?.value || ""
  );
  const [textValue, setTextValue] = useState("");
  const [number1, setNumber1] = useState("");
  const [number2, setNumber2] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    onSave({
      dropdown: selectedOption,
      text: textValue,
      number1: number1,
      number2: number2,
      date: date,
    });
    onClose();
  };

  useEffect(() => {
    console.log(dropdownOptions)
    const option = dropdownOptions[0]?.value || "";
    console.log(option);
    setSelectedOption(option);
  }, [dropdownOptions])

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Add Item</Text>

          {/* Dropdown */}
          <View style={styles.row}>
            <Picker
              selectedValue={selectedOption}
              onValueChange={(itemValue) => setSelectedOption(itemValue)}
              style={styles.dropdown}
            >
              {dropdownOptions.map((option, index) => (
                <Picker.Item key={index} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>

          {/* Textbox */}
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={textValue}
            onChangeText={setTextValue}
          />

          {/* Number 1 */}
          <TextInput
            style={styles.input}
            placeholder="Weight"
            keyboardType="numeric"
            value={number1}
            onChangeText={setNumber1}
          />

          {/* Number 2 */}
          <TextInput
            style={styles.input}
            placeholder="Quantity"
            keyboardType="numeric"
            value={number2}
            onChangeText={setNumber2}
          />

          {/* Expiration Date Title */}
          <Text style={styles.sectionTitle}>Expiration Date</Text>

          {/* Date */}
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {date.toLocaleDateString("en-US")}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
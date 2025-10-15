import * as React from "react";
import { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  StyleSheet,
  Platform,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type Option = { label: string; value: string };

type PopupFormProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    dropdown: string;
    text: string;
    number1: number;
    number2: number;
    date: Date;
  }) => void;
  dropdownOptions: Option[];
  title?: string;
};

export default function PopupForm({
  visible,
  onClose,
  onSubmit,
  dropdownOptions,
  title = "Add Item",
}: PopupFormProps) {
  const [dropdownValue, setDropdownValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [num1, setNum1] = useState("");
  const [num2, setNum2] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleConfirm = () => {
    onSubmit({
      dropdown: dropdownValue,
      text: textValue,
      number1: Number(num1),
      number2: Number(num2),
      date,
    });
    onClose();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }
    const currentDate = selectedDate || date;
    setDate(currentDate);
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>

            {/* Dropdown */}
            <View style={styles.dropdown}>
              {(dropdownOptions || []).map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.dropdownItem,
                    dropdownValue === opt.value && styles.dropdownItemSelected,
                  ]}
                  onPress={() => setDropdownValue(opt.value)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      dropdownValue === opt.value && { fontWeight: "bold" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.input}
              placeholder="Enter text..."
              value={textValue}
              onChangeText={setTextValue}
            />

            {/* Number Inputs */}
            <TextInput
              style={styles.input}
              placeholder="Number 1"
              keyboardType="numeric"
              value={num1}
              onChangeText={setNum1}
            />
            <TextInput
              style={styles.input}
              placeholder="Number 2"
              keyboardType="numeric"
              value={num2}
              onChangeText={setNum2}
            />

            {/* Date Picker */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Text style={styles.dateButtonText}>
                {date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
              />
            )}
            

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm} style={styles.saveButton}>
                <Text style={[styles.buttonText, { color: "white" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#CBE6BE",
    width: 300,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E4E1F",
    textAlign: "center",
    marginBottom: 12,
  },
  dropdown: {
    backgroundColor: "#A8D5A0",
    borderRadius: 8,
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#CBE6BE",
  },
  dropdownItemSelected: {
    backgroundColor: "#8FBF88",
  },
  dropdownText: {
    color: "#1B3614",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: "#A8D5A0",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  dateButtonText: {
    color: "#1B3614",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#D9EAD3",
    padding: 10,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#8FBF88",
    padding: 10,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
    color: "#2E4E1F",
  },
});

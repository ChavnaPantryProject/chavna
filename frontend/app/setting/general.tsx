import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Platform } from "react-native"; // Added Platform
import { Picker } from "@react-native-picker/picker"; 
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
// --- Data for the dropdowns ---
const UNIT_OPTIONS = ["g", "oz", "cups", "tbsp", "tsp", "lbs"];
const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "JPY", "CNY"];

// --- TypeScript Interface for Modal Props ---
interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; 
  onSave: () => void;
}

// --- Shared Modal Component for Reusability ---
const SettingsModal = ({
  visible,
  onClose,
  title,
  children,
  onSave,
}: SettingsModalProps) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        <View style={styles.underline} />
        {children}

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={onSave}
        >
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onClose}
        >
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const GeneralScreen = () => {
  const router = useRouter();

  // State for Change Name Modal
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [name, setName] = useState("");

  // State for Edit Units Modal
  const [unitsModalVisible, setUnitsModalVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(UNIT_OPTIONS[0]);

  // State for Edit Currency Modal
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCY_OPTIONS[0]);

  // --- Handlers for Save Buttons ---
  const handleSaveName = () => {
    console.log("Saved name:", name);
    setNameModalVisible(false);
  };

  const handleSaveUnit = () => {
    console.log("Saved unit:", selectedUnit);
    setUnitsModalVisible(false);
  };

  const handleSaveCurrency = () => {
    console.log("Saved currency:", selectedCurrency);
    setCurrencyModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}> <Ionicons name="arrow-back" size={24} color="black" /></Text>
      </TouchableOpacity>

      {/* Title with underline */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Settings › General</Text>
        <View style={styles.titleUnderline} />
      </View>

      {/* Options */}
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => setNameModalVisible(true)}
      >
        <Text style={styles.optionText}>Change Name</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => setUnitsModalVisible(true)}
      >
        <Text style={styles.optionText}>Edit Units</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => setCurrencyModalVisible(true)}
      >
        <Text style={styles.optionText}>Edit Currency</Text>
      </TouchableOpacity>

      {/* --- Change Name Modal --- */}
      <SettingsModal
        visible={nameModalVisible}
        onClose={() => setNameModalVisible(false)}
        title="Change Name" 
        onSave={handleSaveName}
      >
        <TextInput
          style={styles.input}
          placeholder="Change Name"
          value={name}
          onChangeText={setName}
        />
      </SettingsModal>

      {/* --- Edit Unit Modal --- */}
      <SettingsModal
        visible={unitsModalVisible}
        onClose={() => setUnitsModalVisible(false)}
        title="Edit Unit"
        onSave={handleSaveUnit}
      >
        <Text style={styles.dropdownLabel}>Default Unit Selection</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedUnit}
            onValueChange={(itemValue) => setSelectedUnit(itemValue)}
            style={styles.picker}
            mode="dropdown"
          >
            {UNIT_OPTIONS.map((unit) => (
              <Picker.Item key={unit} label={unit} value={unit} />
            ))}
          </Picker>
        </View>
      </SettingsModal>

      {/* --- Edit Currency Modal --- */}
      <SettingsModal
        visible={currencyModalVisible}
        onClose={() => setCurrencyModalVisible(false)}
        title="Edit Currency"
        onSave={handleSaveCurrency}
      >
        <Text style={styles.dropdownLabel}>Currency Selection</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCurrency}
            onValueChange={(itemValue) => setSelectedCurrency(itemValue)}
            style={styles.picker}
            mode="dropdown"
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <Picker.Item key={currency} label={currency} value={currency} />
            ))}
          </Picker>
        </View>
      </SettingsModal>
    </View>
  );
};

export default GeneralScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 60 },
  backBtn: { marginBottom: 0 },
  backText: { fontSize: 16, color: "green" },
  titleContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: { 
    fontSize: 18, 
    fontWeight: "bold", 
    textAlign: "center",
    marginBottom: 5,
  },
  titleUnderline: {
    width: 120,
    height: 2,
    backgroundColor: "green",
  },
  optionButton: {
    backgroundColor: "rgba(73, 159, 68, 0.2)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  optionText: { fontSize: 16, fontWeight: "500", textAlign: "center" },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    borderColor: 'green',
    borderWidth: 2,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5, textAlign: "center" },
  underline: {
    width: 80,
    height: 2,
    backgroundColor: "green",
    marginBottom: 20,
  },
  // --- Input (for Change Name) ---
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    textAlign: "center",
  },
  // --- Dropdown/Picker Styles ---
  dropdownLabel: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 5,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    height: Platform.OS === 'ios' ? 150 : 50,
    justifyContent: 'center',
  },
  picker: {
    width: "100%",
  },
  // --- Button Styles ---
  saveBtn: {
    backgroundColor: "#f89d5d",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginBottom: 10,
  },
  cancelBtn: {
    backgroundColor: "#f89d5d",
    padding: 12,
    borderRadius: 8,
    width: "100%",
  },
  btnText: { textAlign: "center", fontWeight: "bold", color: "#fff" },
});
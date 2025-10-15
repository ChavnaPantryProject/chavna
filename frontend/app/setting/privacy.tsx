import React, { useState } from "react";
import Feather from '@expo/vector-icons/Feather';
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";

const PrivacySecurityScreen = () => {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<"username" | "password" | "delete" | null>(null); 
  return (
    <View style={styles.container}>
      {/* Header */}
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}> <Ionicons name="arrow-back" size={24} color="black" /></Text>
      </TouchableOpacity>


      <View style={styles.titleContainer}>
        <Text style={styles.title}>Settings › Privacy & Security</Text>
        <View style={styles.titleUnderline} />
      </View>

      {/* Buttons */}
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => setActiveModal("username")}
      >
        <Text style={styles.optionText}>Change Username</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => setActiveModal("password")}
      >
        <Text style={styles.optionText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => setActiveModal("delete")}
      >
        <Text style={styles.optionText}>Delete Account</Text>
      </TouchableOpacity>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton}>
        <View style={styles.signOutContent}>
          <Text style={styles.signOutText}>Sign Out</Text>
          <Feather name="log-out" size={20} color="white" style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>

      {/* Username Modal */}
      <Modal
        visible={activeModal === "username"}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Change Username</Text>
            <View style={styles.underline} />

            <TextInput
              placeholder="New Username"
              style={styles.input}
              placeholderTextColor="#999"
            />

            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.btnText}>Change</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal
        visible={activeModal === "password"}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <View style={styles.underline} />
            <TextInput
              placeholder="Current Password"
              style={styles.input}
              secureTextEntry
            />
            <TextInput
              placeholder="New Password"
              style={styles.input}
              secureTextEntry
            />
            <TextInput
              placeholder="Verify Password"
              style={styles.input}
              secureTextEntry
            />

            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.btnText}>Change</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={activeModal === "delete"}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <View style={styles.underline} />

            <Text style={{ marginBottom: 20, textAlign: "center" }}>
              Are you sure you want to delete your account?
            </Text>

            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.btnText}>Delete Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PrivacySecurityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
  },
  backBtn: { marginBottom: 10 },
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
    backgroundColor: "#D8E7D6",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  optionText: { textAlign: "center", fontSize: 16, fontWeight: "500" },
  signOutButton: {
    backgroundColor: "#f89d5d",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 350,
  },
  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutContent: {
  flexDirection: "row", 
  alignItems: "center", 
  justifyContent: "center", 
},

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
  underline: {
    width: 100,
    height: 2,
    backgroundColor: "green",
    marginTop: 4,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    textAlign: "center",
  },
  actionBtn: {
    backgroundColor: "#f89d5d",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginBottom: 10,
  },
  btnText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#fff",
  },
});
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Feather from '@expo/vector-icons/Feather';
const HouseholdManagementScreen = () => {
  const router = useRouter();

  const [members, setMembers] = useState([
    "Brandon",
    "Daniella",
    "Brian",
    "Reza",
    "Thanh",
    "Harry",
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [newMember, setNewMember] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  const handleAddMember = () => {
    if (newMember.trim()) {
      setMembers([...members, newMember.trim()]);
      setNewMember("");
      setModalVisible(false);
    }
  };

  const confirmRemoveMember = () => {
    if (selectedMember) {
      setMembers(members.filter((m) => m !== selectedMember));
      setSelectedMember(null);
      setRemoveModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Settings › Household Management</Text>
                <View style={styles.titleUnderline} />
              </View>
      </View>

      {/* Member List Card */}
      <View style={styles.card}>
        <Text style={styles.subtitle}>Household Members</Text>

        <ScrollView style={{ width: "100%" }}>
          {members.map((name, index) => (
            <View key={index} style={styles.memberRow}>
              <TouchableOpacity
                style={styles.removeIcon}
                onPress={() => {
                  setSelectedMember(name);
                  setRemoveModalVisible(true);
                }}
              >
                <Ionicons name="remove-circle" size={22} color="#f44336" />
              </TouchableOpacity>

              <View style={styles.memberBox}>
                <Text style={styles.memberText}>{name}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Add & Remove Buttons */}
        <TouchableOpacity
          style={styles.orangeButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.orangeButtonText}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.orangeButton}
          onPress={() => setMembers([])}
        >
          <Text style={styles.orangeButtonText}>Remove All</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      {/* <TouchableOpacity style={styles.signOutButton}>
        <View style={styles.signOutContent}>
          <Text style={styles.signOutText}>Sign Out</Text>
          <Feather name="log-out" size={20} color="white" style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity> */}

      {/* Add Member Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Member</Text>
            <View style={styles.underline}></View>

            <TextInput
              style={styles.input}
              placeholder="New Member"
              value={newMember}
              onChangeText={setNewMember}
            />

            <TouchableOpacity style={styles.orangeButton} onPress={handleAddMember}>
              <Text style={styles.orangeButtonText}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orangeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.orangeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Remove Member Modal */}
      <Modal visible={removeModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Remove Member</Text>
            <View style={styles.underline}></View>

            <Text style={{ textAlign: "center", marginBottom: 20 }}>
              Are you sure you want to remove{" "}
              <Text style={{ fontWeight: "bold", color: "#499f44" }}>
                {selectedMember}?
              </Text>
            </Text>

            <TouchableOpacity style={styles.orangeButton} onPress={confirmRemoveMember}>
              <Text style={styles.orangeButtonText}>Remove</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orangeButton}
              onPress={() => setRemoveModalVisible(false)}
            >
              <Text style={styles.orangeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HouseholdManagementScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", paddingTop: 60 },

  header: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "center", // center the title
    position: "relative", // needed for absolute child positioning
    marginBottom: 40,
  },
    backBtn: { left: 0 , position: "absolute", },
  titleContainer: {
      alignItems: "center",
    marginBottom: 0,
  },
  title: { 
    fontSize: 18, 
    fontWeight: "bold", 
    textAlign: "center",
    marginBottom: 5,
    marginTop:30,
  },
  titleUnderline: {
    width: 120,
    height: 2,
    backgroundColor: "green",
  },

  card: {
    width: "85%",
    backgroundColor: "#e6f0e6",
    borderRadius: 10,
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#c5e1c5",
  },

  subtitle: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#499f44",
    paddingBottom: 5,
    width: "100%",
  },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },

  removeIcon: { marginRight: 6},

  memberBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#499f44",
    borderRadius: 5,
    paddingVertical: 6,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  memberText: { fontSize: 14, color: "#333" },

  orangeButton: {
    backgroundColor: "#f89d5d",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 10,
    width: 200,
    alignItems: "center",
  },

  orangeButtonText: { color: "#fff", fontWeight: "bold" },

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

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "80%",
    padding: 20,
    alignItems: "center",
    borderColor: "#499f44",
    borderWidth: 1,
  },

  modalTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },

  underline: { width: "40%", height: 1, backgroundColor: "#499f44", marginBottom: 15 },

  input: {
    borderWidth: 1,
    borderColor: "#499f44",
    borderRadius: 5,
    width: "100%",
    textAlign: "center",
    paddingVertical: 8,
    marginBottom: 15,
  },
});
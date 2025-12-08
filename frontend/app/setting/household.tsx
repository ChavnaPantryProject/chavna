import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
//import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
//import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesome5 } from "@expo/vector-icons";
import { API_URL, retrieveValue } from "../util";

interface FamilyMember {
  userId: string;
  email: string;
  role: string; // "Owner" or other roles
  firstName?: string;
  lastName?: string;
  nickname?: string;
}

const HouseholdManagementScreen = () => {
  const router = useRouter();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFamily, setHasFamily] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [leaveFamilyModalVisible, setLeaveFamilyModalVisible] = useState(false);
  const [deleteFamilyModalVisible, setDeleteFamilyModalVisible] = useState(false);

  // Load JWT token on mount
  useEffect(() => {
    loadToken();
  }, []);

  // Fetch family members when token is loaded
  useEffect(() => {
    if (jwtToken) {
      fetchFamilyMembers();
    }
  }, [jwtToken]);

  const loadToken = async () => {
    try {
      // Try SecureStore first (matches login.tsx)
      let token = await retrieveValue('jwt');
      
      // Fallback to localStorage if SecureStore fails
      if (!token) {
        try {
          token = localStorage.getItem('jwt');
        } catch {}
      }
      
      setJwtToken(token);
      
      if (!token) {
        Alert.alert("Not Authenticated", "Please login first");
        router.replace('/login');
      }
    } catch (error) {
      console.error("Error loading token:", error);
      Alert.alert("Error", "Failed to load authentication token");
    }
  };

  const fetchFamilyMembers = async () => {
    if (!jwtToken) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/get-family-members`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("API Response:", data);
      console.log("Response status:", response.status);

      if (response.ok && data.success === "success") {
        // Extract members array from payload.members
        const membersList = data.payload?.members || [];
        console.log("Setting members:", membersList);
        
        // Check if members array is empty - user not in a family
        if (membersList.length === 0) {
          console.log("Empty members list - user not in a family");
          setMembers([]);
          setHasFamily(false);
          setIsOwner(false);
        } else {
          setMembers(membersList);
          setHasFamily(true);
          
          // Check if current user is owner
          const currentUserId = JSON.parse(atob(jwtToken.split('.')[1])).user_id;
          const ownerMember = membersList.find((m: FamilyMember) => m.role === "Owner");
          setIsOwner(ownerMember?.userId === currentUserId);
        }
      } else {
        // Error response - treat as no family
        console.log("Error response - setting hasFamily to false");
        setHasFamily(false);
        setMembers([]);
        setIsOwner(false);
      }
    } catch (error) {
      console.error("Error fetching family members:", error);
      // On network error, assume no family
      setHasFamily(false);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!jwtToken) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/create-family`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success === "success") {
        Alert.alert("Success", "Family created successfully!");
        setHasFamily(true);
        fetchFamilyMembers();
      } else {
        Alert.alert("Error", data.message || "Failed to create family");
      }
    } catch (error) {
      console.error("Error creating family:", error);
      Alert.alert("Error", "Failed to create family");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveFamily = async () => {
    if (!jwtToken) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/leave-family`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success === "success") {
        Alert.alert("Success", "You have left the family");
        setLeaveFamilyModalVisible(false);
        setHasFamily(false);
        setMembers([]);
      } else {
        Alert.alert("Error", data.message || "Failed to leave family");
        setLeaveFamilyModalVisible(false);
      }
    } catch (error) {
      console.error("Error leaving family:", error);
      Alert.alert("Error", "Failed to leave family");
      setLeaveFamilyModalVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFamily = async () => {
    if (!jwtToken) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/delete-family`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success === "success") {
        Alert.alert("Success", "Family deleted successfully");
        setDeleteFamilyModalVisible(false);
        setHasFamily(false);
        setMembers([]);
        setIsOwner(false);
      } else {
        Alert.alert("Error", data.message || "Failed to delete family");
        setDeleteFamilyModalVisible(false);
      }
    } catch (error) {
      console.error("Error deleting family:", error);
      Alert.alert("Error", "Failed to delete family");
      setDeleteFamilyModalVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    if (!isValidEmail(newMemberEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!jwtToken) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/invite-to-family`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success === "success") {
        Alert.alert("Success", "Invitation sent successfully");
        setNewMemberEmail("");
        setModalVisible(false);
        // Refresh the member list
        fetchFamilyMembers();
      } else {
        Alert.alert("Error", data.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error inviting member:", error);
      Alert.alert("Error", "Failed to send invitation");
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember || !jwtToken) return;

    try {
      const response = await fetch(`${API_URL}/remove-family-member`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedMember.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success === "success") {
        Alert.alert("Success", "Member removed successfully");
        setRemoveModalVisible(false);
        setSelectedMember(null);
        // Refresh the member list
        fetchFamilyMembers();
      } else {
        Alert.alert("Error", data.message || "Failed to remove member");
        setRemoveModalVisible(false);
        setSelectedMember(null);
      }
    } catch (error) {
      console.error("Error removing member:", error);
      Alert.alert("Error", "Failed to remove member");
      setRemoveModalVisible(false);
      setSelectedMember(null);
    }
  };

  const getMemberDisplayName = (member: FamilyMember): string => {
    if (member.nickname) return member.nickname;
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    if (member.firstName) return member.firstName;
    return member.email;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#499f44" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  // User is not in a family - show create family screen
  if (!hasFamily) {
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

        {/* No Family Card */}
        <View style={styles.card}>
          <Ionicons name="people-outline" size={60} color="#499f44" style={{ marginBottom: 20 }} />
          <Text style={styles.noFamilyTitle}>No Family Yet</Text>
          <Text style={styles.noFamilyText}>
            Create a family to start managing your household together
          </Text>

          <TouchableOpacity
            style={[styles.orangeButton, { marginTop: 30 }]}
            onPress={handleCreateFamily}
          >
            <Text style={styles.orangeButtonText}>Create Family</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // User has a family - show family members
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

        <ScrollView style={{ width: "100%", maxHeight: 300 }}>
          {members.map((member, index) => (
            <View key={member.userId || index} style={styles.memberRow}>
              {removeMode && member.role !== "Owner" && (
                <TouchableOpacity
                  style={styles.removeIcon}
                  onPress={() => {
                    setSelectedMember(member);
                    setRemoveModalVisible(true);
                  }}
                >
                  <Ionicons name="remove-circle" size={22} color="#f44336" />
                </TouchableOpacity>
              )}
              <View style={styles.memberBox}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberText}>
                    {getMemberDisplayName(member)}
                  </Text>
                  {member.role === "Owner" && (
                    <View style={styles.crownIcon}>
                      <FontAwesome5 name="crown" size={14} color="#FFD700" />
                    </View>
                  )}
                </View>
                {member.email !== getMemberDisplayName(member) && (
                  <Text style={styles.memberEmailText}>{member.email}</Text>
                )}
                {member.role === "Owner" && (
                  <Text style={styles.roleText}>Family Owner</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Owner buttons */}
        {isOwner && (
          <>
            <TouchableOpacity
              style={styles.orangeButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.orangeButtonText}>Add Member</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orangeButton}
              onPress={() => setRemoveMode(!removeMode)}
            >
              <Text style={styles.orangeButtonText}>
                {removeMode ? "Done Removing" : "Remove Member"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.orangeButton, styles.deleteButton]}
              onPress={() => setDeleteFamilyModalVisible(true)}
            >
              <Text style={styles.orangeButtonText}>Delete Family</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Non-owner button to leave family */}
        {!isOwner && (
          <TouchableOpacity
            style={[styles.orangeButton, styles.leaveButton]}
            onPress={() => setLeaveFamilyModalVisible(true)}
          >
            <Text style={styles.orangeButtonText}>Leave Family</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.orangeButton, styles.refreshButton]}
          onPress={fetchFamilyMembers}
        >
          <Text style={styles.orangeButtonText}>Refresh List</Text>
        </TouchableOpacity>
      </View>

      {/* Add Member Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Member</Text>
            <View style={styles.underline}></View>

            <Text style={styles.modalDescription}>
              Enter the email address of the person you want to invite
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter member email"
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.orangeButton}
              onPress={handleAddMember}
            >
              <Text style={styles.orangeButtonText}>Send Invite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orangeButton}
              onPress={() => {
                setModalVisible(false);
                setNewMemberEmail("");
              }}
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
                {selectedMember ? getMemberDisplayName(selectedMember) : ""}?
              </Text>
            </Text>

            <TouchableOpacity
              style={styles.orangeButton}
              onPress={handleRemoveMember}
            >
              <Text style={styles.orangeButtonText}>Remove</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orangeButton}
              onPress={() => {
                setRemoveModalVisible(false);
                setSelectedMember(null);
              }}
            >
              <Text style={styles.orangeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Leave Family Modal */}
      <Modal visible={leaveFamilyModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Leave Family</Text>
            <View style={styles.underline}></View>

            <Text style={{ textAlign: "center", marginBottom: 20 }}>
              Are you sure you want to leave this family?
            </Text>

            <TouchableOpacity
              style={[styles.orangeButton, styles.leaveButton]}
              onPress={handleLeaveFamily}
            >
              <Text style={styles.orangeButtonText}>Leave Family</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orangeButton}
              onPress={() => setLeaveFamilyModalVisible(false)}
            >
              <Text style={styles.orangeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Family Modal */}
      <Modal visible={deleteFamilyModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Family</Text>
            <View style={styles.underline}></View>

            <Text style={{ textAlign: "center", marginBottom: 10, color: "#d32f2f", fontWeight: "600" }}>
              ⚠️ Warning ⚠️
            </Text>

            <Text style={{ textAlign: "center", marginBottom: 20 }}>
              This will permanently delete the family and remove all members!
              {"\n\n"}
              Are you sure you want to delete this family?
            </Text>

            <TouchableOpacity
              style={[styles.orangeButton, styles.deleteButton]}
              onPress={handleDeleteFamily}
            >
              <Text style={styles.orangeButtonText}>Delete Family</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orangeButton}
              onPress={() => setDeleteFamilyModalVisible(false)}
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 60,
  },
  centerContent: {
    justifyContent: "center",
  },
  header: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
    marginBottom: 40,
  },
  backBtn: { left: 0, position: "absolute" },
  titleContainer: { alignItems: "center" },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    marginTop: 30,
  },
  titleUnderline: { width: 120, height: 2, backgroundColor: "green" },
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
  noFamilyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  noFamilyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginVertical: 20,
    fontStyle: "italic",
  },
  memberRow: { flexDirection: "row", alignItems: "center", marginVertical: 3 },
  removeIcon: { marginRight: 6 },
  memberBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#499f44",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  crownIcon: {
    marginLeft: 6,
  },
  memberText: { fontSize: 14, color: "#333", fontWeight: "500" },
  memberEmailText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  roleText: {
    fontSize: 11,
    color: "#FFD700",
    fontWeight: "600",
    marginTop: 2,
  },
  orangeButton: {
    backgroundColor: "#f89d5d",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 10,
    width: 200,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d9893c", 
  },
  refreshButton: {
    backgroundColor: "#499f44",
  },
  leaveButton: {
    backgroundColor: "#f44336",
  },
  deleteButton: {
    backgroundColor: "#d32f2f",
  },
  orangeButtonText: { color: "#fff", fontWeight: "bold" },
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
  modalDescription: {
    textAlign: "center",
    color: "#666",
    marginBottom: 15,
    fontSize: 14,
  },
  underline: {
    width: "40%",
    height: 1,
    backgroundColor: "#499f44",
    marginBottom: 15,
  },
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
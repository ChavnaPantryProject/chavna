import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const HelpCenterScreen = () => {
  const router = useRouter();
  const [question, setQuestion] = useState("");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Settings › Help Center</Text>
          <View style={styles.titleUnderline} />
        </View>
      </View>

      {/* Question Input */}
      <Text style={styles.questionLabel}>Questions?</Text>
      <TextInput
        style={styles.inputBox}
        placeholder="Type here"
        placeholderTextColor="#777"
        multiline
        value={question}
        onChangeText={setQuestion}
      />

      {/* Send Button */}
      <TouchableOpacity style={styles.sendButton}>
        <Text style={styles.sendButtonText}>Send</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.orText}>Or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Contact Info */}
      <View style={styles.contactContainer}>
        <Text style={styles.contactLabel}>Contact</Text>
        <View style={styles.emailRow}>
          <Ionicons name="mail-outline" size={16} color="#499f44" />
          <Text style={styles.emailText}> email@email.com</Text>
        </View>
      </View>

    </KeyboardAvoidingView>
  );
};

export default HelpCenterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backBtn: { width: 24, marginBottom:40},
  titleContainer: {
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 3,
    marginTop:30,
  },
  titleUnderline: {
    width: 100,
    height: 1.5,
    backgroundColor: "#499f44",
    marginBottom:30,
  },
  questionLabel: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 10,
  },
  inputBox: {
    width: "85%",
    height: 140,
    borderWidth: 1,
    borderColor: "#499f44",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: "#f89d5d",
    paddingVertical: 10,
    borderRadius: 8,
    width: 120,
    alignItems: "center",
    marginBottom: 25,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "70%",
    marginBottom: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#499f44",
  },
  orText: {
    marginHorizontal: 10,
    fontWeight: "500",
    color: "#333",
  },
  contactContainer: { alignItems: "center", marginBottom: 30 },
  contactLabel: { fontSize: 15, fontWeight: "500", marginBottom: 5 },
  emailRow: { flexDirection: "row", alignItems: "center" },
  emailText: { fontSize: 15, color: "#000" },
  signOutButton: {
    backgroundColor: "#f89d5d",
    borderRadius: 30,
    width: "85%",
    alignItems: "center",
    paddingVertical: 14,
    marginTop: "auto",
    marginBottom: 40,
  },
  signOutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
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
import PopupErrors from "./PopupErrors";

export default function ForgotScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const handleReset = () => {
    // You can add your password reset logic here
    console.log("Reset link sent to:", email);
    if (!email.trim()) {
      // Empty email case
      setPopupMessage("Please enter your email or username.");
      setPopupVisible(true);
      return;
    }
  };

  return (
    <View style={styles.container}>
        <PopupErrors
        visible={popupVisible}
        type="error"
        message={popupMessage}
        onClose={() => setPopupVisible(false)}
      />
    {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/login")}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Forgot Password</Text>
          <View style={styles.titleUnderline} />
        </View>
      </View>

      {/* Instruction Text */}
      <Text style={styles.instruction}>
        Enter your email to receive instructions on how to reset your password
      </Text>

      {/* Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email/Username</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: focused ? "#4CAF50" : "#A5D6A7" },
          ]}
          placeholder="you@example.com"
          placeholderTextColor="#BDBDBD"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Reset Button */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleReset}
        activeOpacity={0.8}
      >
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    position: "absolute",
    left: 0,
    padding: 10,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E7D32",
  },
  titleUnderline: {
    width: 140,
    height: 1,
    backgroundColor: "#4CAF50",
    marginTop: 4,
  },
  instruction: {
    textAlign: "center",
    color: "#333",
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
    marginLeft: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderColor: "#A5D6A7",
    backgroundColor: "#fff",
    color: "#333",
  },
  resetButton: {
    backgroundColor: "#A5D6A7",
    borderRadius: 10,
    paddingVertical: 12,
    width: "50%",
    alignItems: "center",
    opacity: 0.9,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

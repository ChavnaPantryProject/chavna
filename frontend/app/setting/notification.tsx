import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const NotificationSettingsScreen = () => {
  const router = useRouter();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [expirationEnabled, setExpirationEnabled] = useState(true);
  const [restockEnabled, setRestockEnabled] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Settings › Notification</Text>
                <View style={styles.titleUnderline} />
              </View>
      </View>

      {/* Notifications */}
      <View style={styles.settingRow}>
        <Text style={styles.label}>Push Notifications</Text>
        <Switch
          value={pushEnabled}
          onValueChange={setPushEnabled}
          trackColor={{ false: "#d9d9d9", true: "#f89d5d" }}
          thumbColor={pushEnabled ? "#fff" : "#fff"}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.label}>Expiration Notifications</Text>
        <Switch
          value={expirationEnabled}
          onValueChange={setExpirationEnabled}
          trackColor={{ false: "#d9d9d9", true: "#f89d5d" }}
          thumbColor={expirationEnabled ? "#fff" : "#fff"}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.label}>Restock Notifications</Text>
        <Switch
          value={restockEnabled}
          onValueChange={setRestockEnabled}
          trackColor={{ false: "#d9d9d9", true: "#f89d5d" }}
          thumbColor={restockEnabled ? "#fff" : "#fff"}
        />
      </View>
    </View>
  );
};

export default NotificationSettingsScreen;

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
    marginBottom: 40,
  },
  backBtn: {
    width: 24,
  },
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
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "85%",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  label: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
});
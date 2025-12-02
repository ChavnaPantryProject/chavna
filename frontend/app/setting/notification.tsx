import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  scheduleExpirationNotifications,
  checkAndSendExpirationNotification,
  requestNotificationPermissions,
} from "../notificationService";

const NotificationSettingsScreen = () => {
  const router = useRouter();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [expirationEnabled, setExpirationEnabled] = useState(true);
  const [restockEnabled, setRestockEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Load saved settings on component mount
  useEffect(() => {
    loadSettings();
    // Check for expiring items when screen loads
    checkExpiringItems();
  }, []);

  // Load settings from AsyncStorage
  const loadSettings = async () => {
    try {
      const savedPush = await AsyncStorage.getItem('pushNotifications');
      const savedExpiration = await AsyncStorage.getItem('expirationNotifications');
      const savedRestock = await AsyncStorage.getItem('restockNotifications');

      if (savedPush !== null) setPushEnabled(JSON.parse(savedPush));
      if (savedExpiration !== null) setExpirationEnabled(JSON.parse(savedExpiration));
      if (savedRestock !== null) setRestockEnabled(JSON.parse(savedRestock));
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  // Save settings to AsyncStorage
  const saveSettings = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving notification setting:', error);
    }
  };

  // Check for expiring items and send notifications
  const checkExpiringItems = async () => {
    try {
      setIsChecking(true);
      // Request permissions first
      await requestNotificationPermissions();
      // Check and send immediate notification if needed
      await checkAndSendExpirationNotification();
      // Schedule future notifications
      await scheduleExpirationNotifications();
    } catch (error) {
      console.error('Error checking expiring items:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Handler for push notifications toggle
  const handlePushToggle = async (value: boolean) => {
    setPushEnabled(value);
    await saveSettings('pushNotifications', value);
    
    if (value) {
      // Request permissions when enabling
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive notifications.',
          [{ text: 'OK' }]
        );
      } else {
        // Schedule notifications when enabled
        await scheduleExpirationNotifications();
      }
    } else {
      // Cancel notifications when disabled (handled in scheduleExpirationNotifications)
      await scheduleExpirationNotifications();
    }
  };

  // Handler for expiration notifications toggle
  const handleExpirationToggle = async (value: boolean) => {
    setExpirationEnabled(value);
    await saveSettings('expirationNotifications', value);
    
    if (value) {
      // Request permissions and schedule notifications when enabled
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive expiration notifications.',
          [{ text: 'OK' }]
        );
      } else {
        await scheduleExpirationNotifications();
      }
    } else {
      // Cancel notifications when disabled
      await scheduleExpirationNotifications();
    }
  };

  // Handler for restock notifications toggle
  const handleRestockToggle = async (value: boolean) => {
    setRestockEnabled(value);
    await saveSettings('restockNotifications', value);
  };

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
          onValueChange={handlePushToggle}
          trackColor={{ false: "#d9d9d9", true: "#f89d5d" }}
          thumbColor={pushEnabled ? "#fff" : "#fff"}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.label}>Expiration Notifications</Text>
        <Switch
          value={expirationEnabled}
          onValueChange={handleExpirationToggle}
          trackColor={{ false: "#d9d9d9", true: "#f89d5d" }}
          thumbColor={expirationEnabled ? "#fff" : "#fff"}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.label}>Restock Notifications</Text>
        <Switch
          value={restockEnabled}
          onValueChange={handleRestockToggle}
          trackColor={{ false: "#d9d9d9", true: "#f89d5d" }}
          thumbColor={restockEnabled ? "#fff" : "#fff"}
        />
      </View>

      {/* Manual Check Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.checkButton, isChecking && styles.checkButtonDisabled]}
          onPress={checkExpiringItems}
          disabled={isChecking}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={isChecking ? "#999" : "#fff"}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.checkButtonText}>
            {isChecking ? "Checking..." : "Check Expiring Items Now"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.helpText}>
          Automatically checks for items expiring within 7 days and sends notifications
        </Text>
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
    marginTop: 30,
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
  actionContainer: {
    width: "85%",
    marginTop: 30,
    alignItems: "center",
  },
  checkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#499f44",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: "100%",
  },
  checkButtonDisabled: {
    backgroundColor: "#d9d9d9",
  },
  checkButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  helpText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },
});
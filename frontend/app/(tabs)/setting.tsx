import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';

const SettingScreen = () => {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Your milk will expire in 2 days." },
    { id: 2, text: "New app update available!" },
    { id: 3, text: "Your chicken will expire tomorrow." }
  ]);
  const [hasUnread, setHasUnread] = useState(true);
  const [avatar, setAvatar] = useState("https://api.dicebear.com/7.x/adventurer/png?seed=User");

  const handleNotificationPress = () => {
    setShowNotifications(!showNotifications);
    setHasUnread(false);
  };

  const handleChangeAvatar = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to change your avatar.');
      return;
    }

    // Show action sheet for user to choose option
    Alert.alert(
      "Change Avatar",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: takePhoto,
        },
        {
          text: "Choose from Gallery",
          onPress: pickImage,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take a photo.');
      return;
    }

    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Camera error:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Sign Out", 
          onPress: () => console.log("Sign out pressed") 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>

        <View style={{ position: "relative" }}>
          <TouchableOpacity onPress={handleNotificationPress}>
            <Ionicons name="notifications-outline" size={28} color="black" />
          </TouchableOpacity>

          {hasUnread && (
            <View style={styles.redDot} />
          )}
        </View>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleChangeAvatar}>
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
          />
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera-outline" size={20} color="white" />
          </View>
        </TouchableOpacity>
        <Text style={styles.welcome}>Hello User!</Text>
        <TouchableOpacity onPress={handleChangeAvatar}>
          <Text style={styles.changeAvatarText}>Change Avatar</Text>
        </TouchableOpacity>
      </View>

      {/* Options */}
      <View style={styles.options}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => router.push("/setting/general")}
        >
          <Text style={styles.optionText}>General</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => router.push("/setting/privacy")}
        >
          <Text style={styles.optionText}>Privacy & Security</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => router.push("/setting/household")}
        >
          <Text style={styles.optionText}>Household Management</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => router.push("/setting/notification")}
        >
          <Text style={styles.optionText}>Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => router.push("/setting/helpcenter")}
        >
          <Text style={styles.optionText}>Help Center</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <View style={styles.signOutContent}>
          <Text style={styles.signOutText}>Sign Out</Text>
          <Feather name="log-out" size={20} color="white" style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>

      {/* Notification Popup */}
      <Modal
        transparent
        visible={showNotifications}
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPressOut={() => setShowNotifications(false)}
        >
          <View style={styles.notificationPopup}>
            <Text style={styles.notificationTitle}>Notifications</Text>
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <Text key={item.id} style={styles.notificationItem}>
                  • {item.text}
                </Text>
              ))
            ) : (
              <Text style={styles.notificationEmpty}>No new notifications</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

export default SettingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  redDot: {
    position: "absolute",
    right: 2,
    top: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  cameraIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 15,
    backgroundColor: '#499F44',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  welcome: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  changeAvatarText: {
    fontSize: 14,
    color: "#499F44",
    fontWeight: "500",
  },
  options: {
    marginBottom: 80,
  },
  optionButton: {
    backgroundColor: "rgba(73, 159, 68, 0.2)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  signOutButton: {
    backgroundColor: "#f89d5d",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 40,
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: 15,
  },
  notificationPopup: {
    width: 250,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  notificationTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 10,
  },
  notificationItem: {
    fontSize: 14,
    marginBottom: 6,
  },
  notificationEmpty: {
    fontSize: 14,
    color: "#999",
  },
});
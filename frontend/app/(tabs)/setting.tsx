// import React from 'react'
// import { Text, View } from 'react-native'

// const settingScreen = () => {
//   return (
//     <View>
//       <Text>settingScreen</Text>
//     </View>
//   )
// }

// export default settingScreen
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from '@expo/vector-icons/Feather';
const SettingScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={() => console.log("Notifications pressed")}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          </TouchableOpacity>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: "https://api.dicebear.com/7.x/adventurer/png?seed=User" }} // placeholder avatar
          style={styles.avatar}
        />
        <Text style={styles.welcome}>Hello User!</Text>
      </View>

      {/* Options */}
      <View style={styles.options}>
        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>General</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Privacy & Security</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Household Management</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Help Center</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
<TouchableOpacity style={styles.signOutButton}>
  <View style={styles.signOutContent}>
    <Text style={styles.signOutText}>Sign Out</Text>
    <Feather name="log-out" size={20} color="white" style={{ marginLeft: 8 }} />
  </View>
</TouchableOpacity>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
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
  welcome: {
    fontSize: 16,
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

});
import React from "react";
import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View } from "react-native";

export default function TabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, paddingTop: 8 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#111",
            tabBarInactiveTintColor: "#111",
            tabBarActiveBackgroundColor: "rgba(73,159,68,0.43)",
            tabBarItemStyle: {
              marginHorizontal: 6,
              marginVertical: 8,
              borderRadius: 12,
              overflow: "hidden",
            },
            tabBarStyle: {
              height: 84,
              paddingTop: 6,
              paddingBottom: 12,
              backgroundColor: "#fff",
              borderTopWidth: 0.5,
              borderTopColor: "#e5e5e5",
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
            },
            tabBarIconStyle: { marginTop: 2 },
          }}
        >
          <Tabs.Screen
            name="meal"
            options={{
              title: "Meals",
              tabBarIcon: ({ color, size }) => (
                <FontAwesome6 name="burger" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="scanner"
            options={{
              title: "Scanner",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="document-text-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="home"
            options={{
              title: "Home",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="inventory"
            options={{
              title: "Inventory",
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="inventory" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="setting"
            options={{
              title: "Settings",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="settings-outline" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}

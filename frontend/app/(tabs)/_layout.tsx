import { Ionicons, } from "@expo/vector-icons";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';
const TabsLayout = () => {
  return (
    <Tabs 
    screenOptions={{
        tabBarActiveTintColor:"black",
        tabBarActiveBackgroundColor:"rgba(73, 159, 68, 0.43)" ,
        //tabBarInactiveTintColor: "red"
      tabBarStyle: {
      height: 80,          // increase vertical size (default is ~50)
      paddingBottom: 10,   // give icons/text breathing room     // centers icon + label vertically
    },
      tabBarIconStyle: {
      marginTop: 6,   // push icons down
    },
    }}
    >
    <Tabs.Screen
    name = "meal"
    options = {{
        title: "Meal",
        tabBarIcon: ({color, size})=>(<FontAwesome6 name="burger" size={size} color="color" />)
    }}
    />
          <Tabs.Screen
    name = "scanner"
    options = {{
        title: "Scanner",
        tabBarIcon: ({color, size})=>(<Ionicons name="document-text" size={size} color="color" />)
    }}
    />
    <Tabs.Screen
    name = "index"
    options = {{ 
        title: "Home",
        tabBarIcon: ({color, size})=>(<Ionicons name="home" size={size} color="color" />)
    }}/>
    <Tabs.Screen
    name = "inventory"
    options = {{
        title: "Inventory",
        tabBarIcon: ({color, size})=>(<MaterialIcons name="inventory" size={size} color="color" />)
    }}
    />
    <Tabs.Screen
    name = "setting"
    options = {{
        title: "Setting",
        tabBarIcon: ({color, size})=>(<Ionicons name="settings" size={size} color="color" />)
    }}
    />
    </Tabs>
  )
}

export default TabsLayout
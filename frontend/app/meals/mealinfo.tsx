// meal nutrition facts screen
// make sure to add the three dots at the top right corner to enter edit mode/to delete meal
// "go to ingredients" at the bottom right corner

import React from "react";
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet,
    SafeAreaView
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";